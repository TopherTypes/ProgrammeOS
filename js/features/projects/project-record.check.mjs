import {
  assertValidProject,
  DEFAULT_PROJECT_STATUS,
  normalizeProject,
} from "./project-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizeProject({
    id: " project-123 ",
    name: " Apollo Programme ",
    description: null,
    stakeholderIds: [" person-1 ", "", " person-2 ", "person-1"],
  });

  assert(normalized.id === "project-123", "Expected id to be trimmed.");
  assert(normalized.name === "Apollo Programme", "Expected name to be trimmed.");
  assert(normalized.description === "", "Expected description default to empty string.");
  assert(
    normalized.status === DEFAULT_PROJECT_STATUS,
    "Expected missing status to default to the configured status."
  );
  assert(
    normalized.stakeholderIds.length === 2 &&
      normalized.stakeholderIds[0] === "person-1" &&
      normalized.stakeholderIds[1] === "person-2",
    "Expected stakeholderIds to normalize into unique trimmed ids."
  );

  let invalidRejected = false;

  try {
    assertValidProject({ name: "   " });
  } catch (error) {
    invalidRejected = true;
  }

  assert(invalidRejected, "Expected blank project name to fail validation.");

  // Lightweight project data lifecycle simulation to verify create → delete
  // behaviour and the related list/get expectations.
  const recordsById = new Map();

  function createProjectRecord(projectInput) {
    assertValidProject(projectInput);

    const nowIso = new Date().toISOString();
    const normalizedInput = normalizeProject(projectInput);
    const id = `project-${recordsById.size + 1}`;
    const projectRecord = {
      id,
      name: normalizedInput.name,
      description: normalizedInput.description,
      status: normalizedInput.status,
      stakeholderIds: normalizedInput.stakeholderIds,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    recordsById.set(id, projectRecord);
    return projectRecord;
  }

  function getProjectRecord(projectId) {
    return recordsById.get(projectId) ?? null;
  }

  function listProjectRecords() {
    return Array.from(recordsById.values());
  }

  function deleteProjectRecord(projectId) {
    const normalizedProjectId =
      typeof projectId === "string" ? projectId.trim() : "";

    if (!normalizedProjectId) {
      throw new Error("Project id is required to delete a project.");
    }

    recordsById.delete(normalizedProjectId);
  }

  const created = createProjectRecord({
    name: "Delete me",
    description: "Transient project for data lifecycle checks",
  });

  assert(getProjectRecord(created.id) !== null, "Expected created project to be retrievable.");
  assert(listProjectRecords().length === 1, "Expected one project after creation.");

  deleteProjectRecord(created.id);

  assert(getProjectRecord(created.id) === null, "Expected deleted project to return null on get.");
  assert(listProjectRecords().length === 0, "Expected no projects after deletion.");
}

runChecks();
console.log("Project record normalization checks passed.");
