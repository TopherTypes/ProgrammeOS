/**
 * Actions feature: shared record shaping and validation helpers.
 *
 * These helpers are intentionally pure so browser modules and lightweight
 * Node verification scripts can apply identical normalization rules.
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
 * Normalises an action-like object into the canonical action shape.
 *
 * @param {Record<string, unknown>|undefined|null} action
 * @returns {{
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
 * }}
 */
export function normalizeAction(action) {
  return {
    id: asTrimmedString(action?.id),
    description: asTrimmedString(action?.description),
    ownerPersonId: asTrimmedString(action?.ownerPersonId),
    status: asTrimmedString(action?.status),
    dueDate: asTrimmedString(action?.dueDate),
    meetingId: asTrimmedString(action?.meetingId),
    projectIds: asNormalizedIdArray(action?.projectIds),
    requiresUpdateByPersonId: asNormalizedRequiresUpdateMap(action?.requiresUpdateByPersonId),
    createdAt: asTrimmedString(action?.createdAt),
    updatedAt: asTrimmedString(action?.updatedAt),
  };
}

/**
 * Validates required action fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} action
 */
export function assertValidAction(action) {
  const normalizedAction = normalizeAction(action);

  if (!normalizedAction.description) {
    throw new Error('Action "description" is required.');
  }
}
