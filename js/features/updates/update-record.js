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
 * Normalizes the per-person communication tracking map.
 *
 * Accepts a map-like object and returns a canonical object where keys are
 * trimmed person ids and each value follows `{ required, informedAt }`.
 *
 * @param {unknown} value
 * @returns {Record<string, { required: boolean, informedAt: string|null }>}
 */
function asNormalizedRequiresUpdateMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  /** @type {Record<string, { required: boolean, informedAt: string|null }>} */
  const normalizedMap = {};

  for (const [rawPersonId, rawEntry] of Object.entries(value)) {
    const personId = asTrimmedString(rawPersonId);

    if (!personId) {
      continue;
    }

    const entry = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
    const informedAtRaw = asTrimmedString(entry.informedAt);

    normalizedMap[personId] = {
      required: entry.required !== false,
      informedAt: informedAtRaw || null,
    };
  }

  return normalizedMap;
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
 *   requiresUpdateByPersonId: Record<string, { required: boolean, informedAt: string|null }>,
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
    requiresUpdateByPersonId: asNormalizedRequiresUpdateMap(update?.requiresUpdateByPersonId),
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
