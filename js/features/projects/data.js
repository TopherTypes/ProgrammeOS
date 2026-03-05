import {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
} from "../../db.js";
import { assertValidProject, normalizeProject } from "./project-record.js";

const PROJECTS_STORE = "projects";

/**
 * Creates a new project record with immutable identity and timestamp metadata.
 *
 * @param {{
 *   name: string,
 *   description?: string,
 *   status?: string,
 *   stakeholderIds?: string[]
 * }} projectInput
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: string,
 *   stakeholderIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function createProject(projectInput) {
  assertValidProject(projectInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizeProject(projectInput);

  const projectRecord = {
    id: crypto.randomUUID(),
    name: normalizedInput.name,
    description: normalizedInput.description,
    status: normalizedInput.status,
    stakeholderIds: normalizedInput.stakeholderIds,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await createEntity(PROJECTS_STORE, projectRecord);

  return projectRecord;
}

/**
 * Updates an existing project while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} projectId
 * @param {{
 *   name?: string,
 *   description?: string,
 *   status?: string,
 *   stakeholderIds?: string[],
 *   id?: string,
 *   createdAt?: string
 * }} projectInput
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: string,
 *   stakeholderIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function updateProject(projectId, projectInput) {
  const existingProjectRecord = await getEntity(PROJECTS_STORE, projectId);

  if (!existingProjectRecord) {
    throw new Error(`Project not found for id "${projectId}".`);
  }

  const existingProject = normalizeProject(existingProjectRecord);
  const incomingProject = normalizeProject(projectInput);

  const hasNameUpdate =
    !!projectInput && Object.prototype.hasOwnProperty.call(projectInput, "name");
  const hasDescriptionUpdate =
    !!projectInput &&
    Object.prototype.hasOwnProperty.call(projectInput, "description");
  const hasStatusUpdate =
    !!projectInput && Object.prototype.hasOwnProperty.call(projectInput, "status");
  const hasStakeholderIdsUpdate =
    !!projectInput &&
    Object.prototype.hasOwnProperty.call(projectInput, "stakeholderIds");

  const updatedProject = {
    id: existingProject.id,
    name: hasNameUpdate ? incomingProject.name : existingProject.name,
    description: hasDescriptionUpdate
      ? incomingProject.description
      : existingProject.description,
    status: hasStatusUpdate ? incomingProject.status : existingProject.status,
    stakeholderIds: hasStakeholderIdsUpdate
      ? incomingProject.stakeholderIds
      : existingProject.stakeholderIds,
    createdAt: existingProject.createdAt,
    updatedAt: new Date().toISOString(),
  };

  assertValidProject(updatedProject);

  const savedProject = await updateEntity(PROJECTS_STORE, projectId, updatedProject);

  return normalizeProject(savedProject);
}

/**
 * Returns a single project in canonical UI shape.
 *
 * @param {string} projectId
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: string,
 *   stakeholderIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }|null>}
 */
export async function getProject(projectId) {
  const project = await getEntity(PROJECTS_STORE, projectId);
  return project ? normalizeProject(project) : null;
}

/**
 * Returns all projects in canonical UI shape.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   status: string,
 *   stakeholderIds: string[],
 *   createdAt: string,
 *   updatedAt: string,
 * }>>}
 */
export async function listProjects() {
  const projects = await listEntities(PROJECTS_STORE);
  return projects.map(normalizeProject);
}
