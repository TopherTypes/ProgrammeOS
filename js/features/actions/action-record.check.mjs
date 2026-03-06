import { assertValidAction, normalizeAction } from "./action-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizeAction({
    id: " action-123 ",
    description: " Follow up with sponsor ",
    ownerPersonId: " person-1 ",
    status: " Open ",
    dueDate: " 2026-04-01 ",
    meetingId: " meeting-7 ",
    projectIds: [" project-a ", "", "project-b", "project-a"],
    requiresUpdateByPersonId: {
      " person-1 ": { required: true, informedAt: " 2026-03-05T12:00:00.000Z " },
      " person-2 ": { required: false, informedAt: " " },
      " ": { required: true, informedAt: null },
    },
  });

  assert(normalized.id === "action-123", "Expected id to be trimmed.");
  assert(
    normalized.description === "Follow up with sponsor",
    "Expected description to be trimmed."
  );
  assert(normalized.ownerPersonId === "person-1", "Expected ownerPersonId to be trimmed.");
  assert(normalized.status === "Open", "Expected status to be trimmed.");
  assert(normalized.dueDate === "2026-04-01", "Expected dueDate to be trimmed.");
  assert(normalized.meetingId === "meeting-7", "Expected meetingId to be trimmed.");
  assert(
    normalized.projectIds.length === 2 &&
      normalized.projectIds[0] === "project-a" &&
      normalized.projectIds[1] === "project-b",
    "Expected projectIds to normalize into unique trimmed ids."
  );
  assert(
    Object.keys(normalized.requiresUpdateByPersonId).length === 2,
    "Expected requiresUpdate map to discard blank person ids."
  );
  assert(
    normalized.requiresUpdateByPersonId["person-1"].informedAt === "2026-03-05T12:00:00.000Z",
    "Expected informedAt timestamps to be trimmed."
  );
  assert(
    normalized.requiresUpdateByPersonId["person-2"].required === false,
    "Expected required=false to be preserved."
  );
  assert(
    normalized.requiresUpdateByPersonId["person-2"].informedAt === null,
    "Expected blank informedAt to normalize to null."
  );

  let invalidRejected = false;

  try {
    assertValidAction({ description: "   " });
  } catch (error) {
    invalidRejected = true;
  }

  assert(invalidRejected, "Expected blank action description to fail validation.");
}

runChecks();
console.log("Action record normalization checks passed.");
