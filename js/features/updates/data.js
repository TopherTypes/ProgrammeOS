import { createEntity, getEntity, listEntities, updateEntity } from "../../db.js";
import { assertValidUpdate, normalizeUpdate } from "./update-record.js";

const UPDATES_STORE = "updates";

function emitUpdatesChanged(updateRecord) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("programmeos:updates-changed", {
      detail: {
        updateId: updateRecord.id,
        meetingId: updateRecord.meetingId,
      },
    })
  );
}

/**
 * Creates a new update record with immutable identity and timestamp metadata.
 *
 * @param {{
 *   description: string,
 *   meetingId?: string,
 *   projectIds?: string[],
 * }} updateInput
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function createUpdate(updateInput) {
  assertValidUpdate(updateInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizeUpdate(updateInput);

  const updateRecord = {
    id: crypto.randomUUID(),
    description: normalizedInput.description,
    meetingId: normalizedInput.meetingId,
    projectIds: normalizedInput.projectIds,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await createEntity(UPDATES_STORE, updateRecord);
  } catch (error) {
    throw new Error(`Failed to persist update "${updateRecord.description}".`, {
      cause: error,
    });
  }

  emitUpdatesChanged(updateRecord);

  return updateRecord;
}

/**
 * Returns a single update in canonical UI shape.
 *
 * @param {string} updateId
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }|null>}
 */
export async function getUpdate(updateId) {
  const normalizedUpdateId = typeof updateId === "string" ? updateId.trim() : "";

  if (!normalizedUpdateId) {
    throw new Error("Update id is required to retrieve an update.");
  }

  try {
    const update = await getEntity(UPDATES_STORE, normalizedUpdateId);
    return update ? normalizeUpdate(update) : null;
  } catch (error) {
    throw new Error(`Failed to retrieve update for id "${normalizedUpdateId}".`, {
      cause: error,
    });
  }
}

/**
 * Returns all updates in canonical UI shape.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>>}
 */
export async function listUpdates() {
  try {
    const updates = await listEntities(UPDATES_STORE);
    return updates.map(normalizeUpdate);
  } catch (error) {
    throw new Error("Failed to list updates.", {
      cause: error,
    });
  }
}

/**
 * Updates an existing update while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} updateId
 * @param {{
 *   description?: string,
 *   meetingId?: string,
 *   projectIds?: string[],
 *   id?: string,
 *   createdAt?: string,
 * }} patch
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function updateUpdate(updateId, patch) {
  const normalizedUpdateId = typeof updateId === "string" ? updateId.trim() : "";

  if (!normalizedUpdateId) {
    throw new Error("Update id is required to update an update.");
  }

  let existingUpdateRecord;

  try {
    existingUpdateRecord = await getEntity(UPDATES_STORE, normalizedUpdateId);
  } catch (error) {
    throw new Error(`Failed to load existing update for id "${normalizedUpdateId}" before update.`, {
      cause: error,
    });
  }

  if (!existingUpdateRecord) {
    throw new Error(`Update not found for id "${normalizedUpdateId}".`);
  }

  const existingUpdate = normalizeUpdate(existingUpdateRecord);
  const incomingPatch = normalizeUpdate(patch);

  const hasDescriptionUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "description");
  const hasMeetingIdUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "meetingId");
  const hasProjectIdsUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "projectIds");

  const updatedUpdate = {
    id: existingUpdate.id,
    description: hasDescriptionUpdate ? incomingPatch.description : existingUpdate.description,
    meetingId: hasMeetingIdUpdate ? incomingPatch.meetingId : existingUpdate.meetingId,
    projectIds: hasProjectIdsUpdate ? incomingPatch.projectIds : existingUpdate.projectIds,
    createdAt: existingUpdate.createdAt,
    updatedAt: new Date().toISOString(),
  };

  assertValidUpdate(updatedUpdate);

  try {
    const savedUpdate = await updateEntity(UPDATES_STORE, normalizedUpdateId, updatedUpdate);
    emitUpdatesChanged(updatedUpdate);
    return normalizeUpdate(savedUpdate);
  } catch (error) {
    throw new Error(`Failed to persist update for id "${normalizedUpdateId}".`, {
      cause: error,
    });
  }
}
