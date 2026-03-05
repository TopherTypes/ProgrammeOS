import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm";

/**
 * The application's IndexedDB database name.
 * Kept as a constant so all modules use a single source of truth.
 */
export const DATABASE_NAME = "programme-manager-db";

/**
 * Current IndexedDB schema version.
 * Increment this value whenever an object-store migration is introduced.
 */
export const DATABASE_SCHEMA_VERSION = 1;

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
 * Shared database instance promise so the database is opened once per app session.
 * @type {Promise<import('https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm').IDBPDatabase>|null}
 */
let databasePromise = null;

/**
 * Opens the application's IndexedDB database and ensures required stores exist.
 *
 * The `meta` store persists schema metadata, including `schemaVersion`,
 * so future migrations can be reasoned about and verified safely.
 *
 * @returns {Promise<import('https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm').IDBPDatabase>}
 */
export function initializeDatabase() {
  if (!databasePromise) {
    databasePromise = openDB(DATABASE_NAME, DATABASE_SCHEMA_VERSION, {
      upgrade(db) {
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
    });
  }

  return ensureSchemaVersionRecord();
}

/**
 * Ensures `meta.schemaVersion` is always written for the active database schema.
 *
 * @returns {Promise<import('https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm').IDBPDatabase>}
 */
async function ensureSchemaVersionRecord() {
  const db = await databasePromise;

  await db.put("meta", {
    key: "schemaVersion",
    value: DATABASE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  });

  return db;
}
