import { assertValidPerson, normalizePerson } from "./person-record.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runChecks() {
  const normalized = normalizePerson({
    id: " 123 ",
    name: " Ada Lovelace ",
    organisation: "  Babbage Labs ",
    notes: null,
  });

  assert(normalized.id === "123", "Expected id to be trimmed.");
  assert(normalized.name === "Ada Lovelace", "Expected name to be trimmed.");
  assert(
    normalized.organisation === "Babbage Labs",
    "Expected organisation to be trimmed."
  );
  assert(normalized.notes === "", "Expected missing notes to normalize to empty string.");

  let invalidRejected = false;

  try {
    assertValidPerson({ name: "   " });
  } catch (error) {
    invalidRejected = true;
  }

  assert(invalidRejected, "Expected blank name to fail validation.");
}

runChecks();
console.log("People record normalization checks passed.");
