import { createEntity, getEntity, listEntities, updateEntity } from "../../db.js";
import { assertValidAction, normalizeAction } from "./action-record.js";

const ACTIONS_STORE = "actions";

/**
 * Creates a new action record with immutable identity and timestamp metadata.
 *
 * @param {{
 *   description: string,
 *   ownerPersonId?: string,
 *   status?: string,
 *   dueDate?: string,
 *   meetingId?: string,
 *   projectIds?: string[],
 *   requiresUpdateByPersonId?: Record<string, { required?: boolean, informedAt?: string|null }>,
 * }} actionInput
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   ownerPersonId: string,
 *   status: string,
 *   dueDate: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   requiresUpdateByPersonId: Record<string, { required: boolean, informedAt: string|null }>,
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function createAction(actionInput) {
  assertValidAction(actionInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizeAction(actionInput);

  const actionRecord = {
    id: crypto.randomUUID(),
    description: normalizedInput.description,
    ownerPersonId: normalizedInput.ownerPersonId,
    status: normalizedInput.status,
    dueDate: normalizedInput.dueDate,
    meetingId: normalizedInput.meetingId,
    projectIds: normalizedInput.projectIds,
    requiresUpdateByPersonId: normalizedInput.requiresUpdateByPersonId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await createEntity(ACTIONS_STORE, actionRecord);
  } catch (error) {
    throw new Error(`Failed to persist action "${actionRecord.description}".`, {
      cause: error,
    });
  }

  return actionRecord;
}

/**
 * Returns a single action in canonical UI shape.
 *
 * @param {string} actionId
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   ownerPersonId: string,
 *   status: string,
 *   dueDate: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   requiresUpdateByPersonId: Record<string, { required: boolean, informedAt: string|null }>,
 *   createdAt: string,
 *   updatedAt: string,
 * }|null>}
 */
export async function getAction(actionId) {
  const normalizedActionId = typeof actionId === "string" ? actionId.trim() : "";

  if (!normalizedActionId) {
    throw new Error("Action id is required to retrieve an action.");
  }

  try {
    const action = await getEntity(ACTIONS_STORE, normalizedActionId);
    return action ? normalizeAction(action) : null;
  } catch (error) {
    throw new Error(`Failed to retrieve action for id "${normalizedActionId}".`, {
      cause: error,
    });
  }
}

/**
 * Returns all actions in canonical UI shape.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   description: string,
 *   ownerPersonId: string,
 *   status: string,
 *   dueDate: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   requiresUpdateByPersonId: Record<string, { required: boolean, informedAt: string|null }>,
 *   createdAt: string,
 *   updatedAt: string,
 * }>>}
 */
export async function listActions() {
  try {
    const actions = await listEntities(ACTIONS_STORE);
    return actions.map(normalizeAction);
  } catch (error) {
    throw new Error("Failed to list actions.", {
      cause: error,
    });
  }
}

/**
 * Updates an existing action while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} actionId
 * @param {{
 *   description?: string,
 *   ownerPersonId?: string,
 *   status?: string,
 *   dueDate?: string,
 *   meetingId?: string,
 *   projectIds?: string[],
 *   requiresUpdateByPersonId?: Record<string, { required?: boolean, informedAt?: string|null }>,
 *   id?: string,
 *   createdAt?: string,
 * }} patch
 */
export async function updateAction(actionId, patch) {
  const normalizedActionId = typeof actionId === "string" ? actionId.trim() : "";

  if (!normalizedActionId) {
    throw new Error("Action id is required to update an action.");
  }

  let existingActionRecord;

  try {
    existingActionRecord = await getEntity(ACTIONS_STORE, normalizedActionId);
  } catch (error) {
    throw new Error(`Failed to retrieve existing action "${normalizedActionId}" before update.`, {
      cause: error,
    });
  }

  if (!existingActionRecord) {
    throw new Error(`Cannot update action "${normalizedActionId}" because it does not exist.`);
  }

  const safePatch = patch && typeof patch === "object" ? patch : {};
  const normalizedExisting = normalizeAction(existingActionRecord);
  const normalizedPatch = normalizeAction(safePatch);
  const nowIso = new Date().toISOString();

  const updatedAction = {
    id: normalizedExisting.id,
    description:
      "description" in safePatch
        ? normalizedPatch.description
        : normalizedExisting.description,
    ownerPersonId:
      "ownerPersonId" in safePatch
        ? normalizedPatch.ownerPersonId
        : normalizedExisting.ownerPersonId,
    status: "status" in safePatch ? normalizedPatch.status : normalizedExisting.status,
    dueDate: "dueDate" in safePatch ? normalizedPatch.dueDate : normalizedExisting.dueDate,
    meetingId: "meetingId" in safePatch ? normalizedPatch.meetingId : normalizedExisting.meetingId,
    projectIds: "projectIds" in safePatch ? normalizedPatch.projectIds : normalizedExisting.projectIds,
    requiresUpdateByPersonId:
      "requiresUpdateByPersonId" in safePatch
        ? normalizedPatch.requiresUpdateByPersonId
        : normalizedExisting.requiresUpdateByPersonId,
    createdAt: normalizedExisting.createdAt,
    updatedAt: nowIso,
  };

  assertValidAction(updatedAction);

  try {
    await updateEntity(ACTIONS_STORE, normalizedActionId, updatedAction);
  } catch (error) {
    throw new Error(`Failed to update action "${normalizedActionId}".`, {
      cause: error,
    });
  }

  return updatedAction;
}
