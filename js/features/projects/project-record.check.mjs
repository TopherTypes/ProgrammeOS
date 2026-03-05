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
}

runChecks();
console.log("Project record normalization checks passed.");
