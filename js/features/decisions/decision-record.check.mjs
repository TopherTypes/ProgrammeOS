import { assertValidDecision, normalizeDecision } from "./decision-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizeDecision({
    id: " decision-123 ",
    description: " Confirm launch scope ",
    meetingId: " meeting-7 ",
    projectIds: [" project-a ", "", "project-b", "project-a"],
  });

  assert(normalized.id === "decision-123", "Expected id to be trimmed.");
  assert(
    normalized.description === "Confirm launch scope",
    "Expected description to be trimmed."
  );
  assert(normalized.meetingId === "meeting-7", "Expected meetingId to be trimmed.");
  assert(
    normalized.projectIds.length === 2 &&
      normalized.projectIds[0] === "project-a" &&
      normalized.projectIds[1] === "project-b",
    "Expected projectIds to normalize into unique trimmed ids."
  );

  let invalidRejected = false;

  try {
    assertValidDecision({ description: "   " });
  } catch (error) {
    invalidRejected = true;
  }

  assert(invalidRejected, "Expected blank decision description to fail validation.");
}

runChecks();
console.log("Decision record normalization checks passed.");
