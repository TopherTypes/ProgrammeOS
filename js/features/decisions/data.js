import { createEntity, getEntity, listEntities, updateEntity } from "../../db.js";
import { assertValidDecision, normalizeDecision } from "./decision-record.js";

const DECISIONS_STORE = "decisions";

/**
 * Creates a new decision record with immutable identity and timestamp metadata.
 *
 * @param {{
 *   description: string,
 *   meetingId?: string,
 *   projectIds?: string[],
 * }} decisionInput
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function createDecision(decisionInput) {
  assertValidDecision(decisionInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizeDecision(decisionInput);

  const decisionRecord = {
    id: crypto.randomUUID(),
    description: normalizedInput.description,
    meetingId: normalizedInput.meetingId,
    projectIds: normalizedInput.projectIds,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await createEntity(DECISIONS_STORE, decisionRecord);
  } catch (error) {
    throw new Error(`Failed to persist decision "${decisionRecord.description}".`, {
      cause: error,
    });
  }

  return decisionRecord;
}

/**
 * Returns a single decision in canonical UI shape.
 *
 * @param {string} decisionId
 * @returns {Promise<{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }|null>}
 */
export async function getDecision(decisionId) {
  const normalizedDecisionId = typeof decisionId === "string" ? decisionId.trim() : "";

  if (!normalizedDecisionId) {
    throw new Error("Decision id is required to retrieve a decision.");
  }

  try {
    const decision = await getEntity(DECISIONS_STORE, normalizedDecisionId);
    return decision ? normalizeDecision(decision) : null;
  } catch (error) {
    throw new Error(`Failed to retrieve decision for id "${normalizedDecisionId}".`, {
      cause: error,
    });
  }
}

/**
 * Returns all decisions in canonical UI shape.
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
export async function listDecisions() {
  try {
    const decisions = await listEntities(DECISIONS_STORE);
    return decisions.map(normalizeDecision);
  } catch (error) {
    throw new Error("Failed to list decisions.", {
      cause: error,
    });
  }
}

/**
 * Updates an existing decision while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} decisionId
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
export async function updateDecision(decisionId, patch) {
  const normalizedDecisionId = typeof decisionId === "string" ? decisionId.trim() : "";

  if (!normalizedDecisionId) {
    throw new Error("Decision id is required to update a decision.");
  }

  let existingDecisionRecord;

  try {
    existingDecisionRecord = await getEntity(DECISIONS_STORE, normalizedDecisionId);
  } catch (error) {
    throw new Error(
      `Failed to load existing decision for id "${normalizedDecisionId}" before update.`,
      {
        cause: error,
      }
    );
  }

  if (!existingDecisionRecord) {
    throw new Error(`Decision not found for id "${normalizedDecisionId}".`);
  }

  const existingDecision = normalizeDecision(existingDecisionRecord);
  const incomingPatch = normalizeDecision(patch);

  const hasDescriptionUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "description");
  const hasMeetingIdUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "meetingId");
  const hasProjectIdsUpdate = !!patch && Object.prototype.hasOwnProperty.call(patch, "projectIds");

  const updatedDecision = {
    id: existingDecision.id,
    description: hasDescriptionUpdate ? incomingPatch.description : existingDecision.description,
    meetingId: hasMeetingIdUpdate ? incomingPatch.meetingId : existingDecision.meetingId,
    projectIds: hasProjectIdsUpdate ? incomingPatch.projectIds : existingDecision.projectIds,
    createdAt: existingDecision.createdAt,
    updatedAt: new Date().toISOString(),
  };

  assertValidDecision(updatedDecision);

  try {
    const savedDecision = await updateEntity(
      DECISIONS_STORE,
      normalizedDecisionId,
      updatedDecision
    );

    return normalizeDecision(savedDecision);
  } catch (error) {
    throw new Error(`Failed to persist decision update for id "${normalizedDecisionId}".`, {
      cause: error,
    });
  }
}
