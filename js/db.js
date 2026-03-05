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
 * Maps each object store to its required primary key field.
 * This lets the generic CRUD helpers validate records consistently.
 */
const STORE_KEY_FIELDS = {
  people: "id",
  projects: "id",
  meetings: "id",
  actions: "id",
  decisions: "id",
  updates: "id",
  meta: "key",
};

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

/**
 * Validates that a store name exists in the configured schema.
 *
 * @param {string} store
 */
function assertValidStore(store) {
  if (!OBJECT_STORES.includes(store)) {
    throw new Error(`Unknown object store: ${store}`);
  }
}

/**
 * Adds a new record to an object store.
 *
 * @param {string} store
 * @param {Record<string, any>} data
 * @returns {Promise<string>}
 */
export async function createEntity(store, data) {
  try {
    assertValidStore(store);

    if (!data || typeof data !== "object") {
      throw new Error("Entity data must be an object.");
    }

    const requiredKey = STORE_KEY_FIELDS[store];

    if (!data[requiredKey]) {
      throw new Error(
        `Entity for store \"${store}\" must include \"${requiredKey}\".`
      );
    }

    const db = await initializeDatabase();
    await db.add(store, data);

    return data[requiredKey];
  } catch (error) {
    throw new Error(`Failed to create entity in store \"${store}\".`, {
      cause: error,
    });
  }
}

/**
 * Updates an existing record by merging current and incoming values.
 *
 * @param {string} store
 * @param {string} id
 * @param {Record<string, any>} data
 * @returns {Promise<Record<string, any>>}
 */
export async function updateEntity(store, id, data) {
  try {
    assertValidStore(store);

    if (!id) {
      throw new Error("Entity id is required.");
    }

    if (!data || typeof data !== "object") {
      throw new Error("Update data must be an object.");
    }

    const db = await initializeDatabase();
    const existingEntity = await db.get(store, id);

    if (!existingEntity) {
      throw new Error(`Entity not found in store \"${store}\" for id \"${id}\".`);
    }

    const nextEntity = {
      ...existingEntity,
      ...data,
      [STORE_KEY_FIELDS[store]]: id,
    };

    await db.put(store, nextEntity);

    return nextEntity;
  } catch (error) {
    throw new Error(
      `Failed to update entity in store \"${store}\" for id \"${id}\".`,
      {
        cause: error,
      }
    );
  }
}

/**
 * Deletes a record from a store by id.
 *
 * @param {string} store
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteEntity(store, id) {
  try {
    assertValidStore(store);

    if (!id) {
      throw new Error("Entity id is required.");
    }

    const db = await initializeDatabase();
    await db.delete(store, id);
  } catch (error) {
    throw new Error(
      `Failed to delete entity in store \"${store}\" for id \"${id}\".`,
      {
        cause: error,
      }
    );
  }
}

/**
 * Retrieves a single record from a store by id.
 *
 * @param {string} store
 * @param {string} id
 * @returns {Promise<Record<string, any>|undefined>}
 */
export async function getEntity(store, id) {
  try {
    assertValidStore(store);

    if (!id) {
      throw new Error("Entity id is required.");
    }

    const db = await initializeDatabase();
    return db.get(store, id);
  } catch (error) {
    throw new Error(
      `Failed to retrieve entity in store \"${store}\" for id \"${id}\".`,
      {
        cause: error,
      }
    );
  }
}

/**
 * Lists all records in a store.
 *
 * @param {string} store
 * @returns {Promise<Record<string, any>[]>}
 */
export async function listEntities(store) {
  try {
    assertValidStore(store);

    const db = await initializeDatabase();
    return db.getAll(store);
  } catch (error) {
    throw new Error(`Failed to list entities in store \"${store}\".`, {
      cause: error,
    });
  }
}
