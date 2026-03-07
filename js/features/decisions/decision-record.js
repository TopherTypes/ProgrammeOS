/**
 * Decisions feature: shared record shaping and validation helpers.
 *
 * The functions here stay framework-agnostic so browser UI and lightweight
 * Node checks can rely on the exact same normalization rules.
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
 * Normalises a decision-like object into the canonical decision shape.
 *
 * @param {Record<string, unknown>|undefined|null} decision
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
export function normalizeDecision(decision) {
  return {
    id: asTrimmedString(decision?.id),
    description: asTrimmedString(decision?.description),
    meetingId: asTrimmedString(decision?.meetingId),
    projectIds: asNormalizedIdArray(decision?.projectIds),
    requiresUpdateByPersonId: asNormalizedRequiresUpdateMap(decision?.requiresUpdateByPersonId),
    createdAt: asTrimmedString(decision?.createdAt),
    updatedAt: asTrimmedString(decision?.updatedAt),
  };
}

/**
 * Validates required decision fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} decision
 */
export function assertValidDecision(decision) {
  const normalizedDecision = normalizeDecision(decision);

  if (!normalizedDecision.description) {
    throw new Error('Decision "description" is required.');
  }
}
