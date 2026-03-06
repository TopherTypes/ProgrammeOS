/**
 * Updates feature: shared record shaping and validation helpers.
 *
 * Keeping these functions pure allows browser modules and lightweight
 * Node checks to reuse identical normalization/validation behaviour.
 */

/**
 * Converts unknown values into a trimmed string.
 *
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalizes a value into a unique array of trimmed non-empty ids.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function asNormalizedIdArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedIds = value.map(asTrimmedString).filter((id) => id.length > 0);
  return [...new Set(normalizedIds)];
}

/**
 * Normalises an update-like object into the canonical update shape.
 *
 * @param {Record<string, unknown>|undefined|null} update
 * @returns {{
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }}
 */
export function normalizeUpdate(update) {
  return {
    id: asTrimmedString(update?.id),
    description: asTrimmedString(update?.description),
    meetingId: asTrimmedString(update?.meetingId),
    projectIds: asNormalizedIdArray(update?.projectIds),
    createdAt: asTrimmedString(update?.createdAt),
    updatedAt: asTrimmedString(update?.updatedAt),
  };
}

/**
 * Validates required update fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} update
 */
export function assertValidUpdate(update) {
  const normalizedUpdate = normalizeUpdate(update);

  if (!normalizedUpdate.description) {
    throw new Error('Update "description" is required.');
  }
}
