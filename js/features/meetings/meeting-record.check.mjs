import { assertValidMeeting, normalizeMeeting } from "./meeting-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizeMeeting({
    id: " meeting-1 ",
    title: " Weekly Update ",
    date: " 2026-03-06 ",
    type: " Update ",
    attendeeIds: [" person-1 ", "", " person-2 ", "person-1"],
    projectIds: [" project-2 ", " project-1 ", "project-2"],
    notes: " Summary notes ",
  });

  assert(normalized.id === "meeting-1", "Expected id to be trimmed.");
  assert(normalized.title === "Weekly Update", "Expected title to be trimmed.");
  assert(normalized.date === "2026-03-06", "Expected date to be trimmed.");
  assert(normalized.type === "Update", "Expected type to be trimmed.");
  assert(
    normalized.attendeeIds.length === 2 &&
      normalized.attendeeIds[0] === "person-1" &&
      normalized.attendeeIds[1] === "person-2",
    "Expected attendeeIds to normalize into unique trimmed ids."
  );
  assert(
    normalized.projectIds.length === 2 &&
      normalized.projectIds[0] === "project-2" &&
      normalized.projectIds[1] === "project-1",
    "Expected projectIds to normalize into unique trimmed ids."
  );
  assert(normalized.notes === "Summary notes", "Expected notes to be trimmed.");

  let titleRejected = false;
  let dateRejected = false;

  try {
    assertValidMeeting({ title: "   ", date: "2026-03-06" });
  } catch (error) {
    titleRejected = true;
  }

  try {
    assertValidMeeting({ title: "Weekly Update", date: "   " });
  } catch (error) {
    dateRejected = true;
  }

  assert(titleRejected, "Expected blank meeting title to fail validation.");
  assert(dateRejected, "Expected blank meeting date to fail validation.");
}

runChecks();
console.log("Meeting record normalization checks passed.");
