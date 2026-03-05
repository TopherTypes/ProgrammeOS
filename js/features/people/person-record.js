/**
 * People feature: shared record shaping and validation helpers.
 *
 * These functions are intentionally pure so they can be reused by the
 * persistence module and lightweight Node-based checks without requiring
 * browser-only dependencies.
 */

/**
 * Converts a potentially unknown input into a safe string value.
 *
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalises a person-like object into the canonical person shape expected by
 * the UI and persistence layer.
 *
 * @param {Record<string, unknown>|undefined|null} person
 * @returns {{
 *   id: string,
 *   name: string,
 *   organisation: string,
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }}
 */
export function normalizePerson(person) {
  return {
    id: asTrimmedString(person?.id),
    name: asTrimmedString(person?.name),
    organisation: asTrimmedString(person?.organisation),
    notes: asTrimmedString(person?.notes),
    createdAt: asTrimmedString(person?.createdAt),
    updatedAt: asTrimmedString(person?.updatedAt),
  };
}

/**
 * Validates required person fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} person
 */
export function assertValidPerson(person) {
  const normalizedPerson = normalizePerson(person);

  if (!normalizedPerson.name) {
    throw new Error('Person "name" is required.');
  }
}
