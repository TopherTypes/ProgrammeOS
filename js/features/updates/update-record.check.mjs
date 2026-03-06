import { assertValidUpdate, normalizeUpdate } from "./update-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizeUpdate({
    id: " update-123 ",
    description: " Shared update note ",
    meetingId: " meeting-2 ",
    projectIds: [" project-a ", "", "project-b", "project-a"],
  });

  assert(normalized.id === "update-123", "Expected id to be trimmed.");
  assert(normalized.description === "Shared update note", "Expected description to be trimmed.");
  assert(normalized.meetingId === "meeting-2", "Expected meetingId to be trimmed.");
  assert(
    normalized.projectIds.length === 2 &&
      normalized.projectIds[0] === "project-a" &&
      normalized.projectIds[1] === "project-b",
    "Expected projectIds to normalize into unique trimmed ids."
  );

  let invalidRejected = false;

  try {
    assertValidUpdate({ description: "   " });
  } catch (error) {
    invalidRejected = true;
  }

  assert(invalidRejected, "Expected blank update description to fail validation.");
}

runChecks();
console.log("Update record normalization checks passed.");
