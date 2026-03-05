/**
 * Projects feature: shared record shaping and validation helpers.
 *
 * These helpers stay pure so both browser runtime modules and lightweight
 * Node verification scripts can exercise the same behaviour.
 */

/**
 * Default status assigned when project input omits status.
 *
 * @type {string}
 */
export const DEFAULT_PROJECT_STATUS = "active";

/**
 * Converts unknown values into trimmed strings.
 *
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Converts unknown values into a unique, trimmed string array.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function asNormalizedIdArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedIds = value
    .map(asTrimmedString)
    .filter((id) => id.length > 0);

  return [...new Set(normalizedIds)];
}

/**
 * Normalises a project-like object into the canonical project shape.
 *
 * @param {Record<string, unknown>|undefined|null} project
 * @returns {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: string,
 *   stakeholderIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }}
 */
export function normalizeProject(project) {
  return {
    id: asTrimmedString(project?.id),
    name: asTrimmedString(project?.name),
    description: asTrimmedString(project?.description),
    status: asTrimmedString(project?.status) || DEFAULT_PROJECT_STATUS,
    stakeholderIds: asNormalizedIdArray(project?.stakeholderIds),
    createdAt: asTrimmedString(project?.createdAt),
    updatedAt: asTrimmedString(project?.updatedAt),
  };
}

/**
 * Validates required project fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} project
 */
export function assertValidProject(project) {
  const normalizedProject = normalizeProject(project);

  if (!normalizedProject.name) {
    throw new Error('Project "name" is required.');
  }
}
