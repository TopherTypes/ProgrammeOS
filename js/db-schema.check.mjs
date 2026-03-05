import { getPendingMigrationVersions } from "./db-schema.js";

function assertEqualArray(actual, expected, label) {
  const sameLength = actual.length === expected.length;
  const sameValues = actual.every((value, index) => value === expected[index]);

  if (!sameLength || !sameValues) {
    throw new Error(
      `${label} failed. Expected [${expected.join(", ")}], got [${actual.join(", ")}].`
    );
  }
}

/**
 * Simulates upgrade paths to verify migration planning logic.
 *
 * This keeps schema version handling testable without depending on browser
 * IndexedDB APIs in a Node-based verification command.
 */
function runChecks() {
  assertEqualArray(
    getPendingMigrationVersions(0, 1),
    [1],
    "Initial install should schedule migration 1"
  );

  assertEqualArray(
    getPendingMigrationVersions(1, 1),
    [],
    "No-op upgrades should schedule no migrations"
  );

  let errorThrown = false;

  try {
    getPendingMigrationVersions(2, 1);
  } catch (error) {
    errorThrown = true;
  }

  if (!errorThrown) {
    throw new Error("Downgrade path should reject invalid version ranges.");
  }
}

runChecks();
console.log("Schema migration planning checks passed.");
