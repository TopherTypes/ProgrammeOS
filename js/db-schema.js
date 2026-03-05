/**
 * All object stores required for the MVP data model.
 * Using a constant array keeps store creation and validation consistent.
 */
export const OBJECT_STORES = [
  "people",
  "projects",
  "meetings",
  "actions",
  "decisions",
  "updates",
  "meta",
];

/**
 * One-way database schema migrations keyed by target version.
 *
 * Each migration function receives the IndexedDB upgrade context and may:
 * - create or alter object stores
 * - write default metadata
 *
 * Keep migrations deterministic and idempotent where possible so upgrades are safe
 * even when users skip intermediate app versions.
 */
const SCHEMA_MIGRATIONS = {
  1: ({ db }) => {
    for (const storeName of OBJECT_STORES) {
      if (db.objectStoreNames.contains(storeName)) {
        continue;
      }

      if (storeName === "meta") {
        db.createObjectStore(storeName, { keyPath: "key" });
        continue;
      }

      db.createObjectStore(storeName, { keyPath: "id" });
    }
  },
};

/**
 * Calculates migration versions that should run during an IndexedDB upgrade.
 *
 * @param {number} fromVersion
 * @param {number} toVersion
 * @returns {number[]}
 */
export function getPendingMigrationVersions(fromVersion, toVersion) {
  if (!Number.isInteger(fromVersion) || fromVersion < 0) {
    throw new Error("fromVersion must be a non-negative integer.");
  }

  if (!Number.isInteger(toVersion) || toVersion < 1) {
    throw new Error("toVersion must be a positive integer.");
  }

  if (toVersion < fromVersion) {
    throw new Error("toVersion must be greater than or equal to fromVersion.");
  }

  return Object.keys(SCHEMA_MIGRATIONS)
    .map(Number)
    .filter((version) => version > fromVersion && version <= toVersion)
    .sort((left, right) => left - right);
}

/**
 * Runs schema migrations for the current upgrade path.
 *
 * @param {object} context
 * @param {IDBDatabase} context.db
 * @param {number} context.oldVersion
 * @param {number} context.newVersion
 */
export function runMigrations({ db, oldVersion, newVersion }) {
  const pendingVersions = getPendingMigrationVersions(oldVersion, newVersion);

  for (const version of pendingVersions) {
    const migration = SCHEMA_MIGRATIONS[version];

    if (!migration) {
      throw new Error(`Missing schema migration for version ${version}.`);
    }

    migration({ db, oldVersion, newVersion });
  }
}
