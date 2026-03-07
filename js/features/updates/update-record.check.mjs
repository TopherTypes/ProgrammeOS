import { assertValidUpdate, normalizeUpdate } from "./update-record.js";

/**
 * Minimal assertion helper for deterministic test failures.
 *
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Runs a single check and records a human-readable pass/fail result.
 *
 * @param {string} label
 * @param {() => void | Promise<void>} check
 * @returns {Promise<{ label: string, passed: boolean, error?: string }>}
 */
async function runCheck(label, check) {
  try {
    await check();
    return { label, passed: true };
  } catch (error) {
    return {
      label,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Creates a small in-memory implementation of the IndexedDB wrapper API shape
 * used by feature data modules (`createEntity`, `getEntity`, `listEntities`,
 * and `updateEntity`). This keeps the verification command runnable in Node.
 *
 * @returns {{
 *   createEntity: (store: string, data: Record<string, unknown>) => Promise<string>,
 *   getEntity: (store: string, id: string) => Promise<Record<string, unknown>|null>,
 *   listEntities: (store: string) => Promise<Record<string, unknown>[]>,
 *   updateEntity: (store: string, id: string, patch: Record<string, unknown>) => Promise<Record<string, unknown>>,
 * }}
 */
function createIndexedDbWrapperSimulation() {
  const stores = new Map([["updates", new Map()]]);

  function assertUpdatesStore(store) {
    if (store !== "updates") {
      throw new Error(`Unknown object store: ${store}`);
    }
  }

  return {
    async createEntity(store, data) {
      assertUpdatesStore(store);

      if (!data || typeof data !== "object") {
        throw new Error("Entity data must be an object.");
      }

      if (typeof data.id !== "string" || !data.id.trim()) {
        throw new Error('Entity for store "updates" must include "id".');
      }

      stores.get(store).set(data.id, { ...data });
      return data.id;
    },

    async getEntity(store, id) {
      assertUpdatesStore(store);

      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Entity id is required.");
      }

      return stores.get(store).get(id) ?? null;
    },

    async listEntities(store) {
      assertUpdatesStore(store);
      return Array.from(stores.get(store).values());
    },

    async updateEntity(store, id, patch) {
      assertUpdatesStore(store);

      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Entity id is required.");
      }

      if (!patch || typeof patch !== "object") {
        throw new Error("Update data must be an object.");
      }

      const existing = stores.get(store).get(id);

      if (!existing) {
        throw new Error(`Entity not found in store "${store}" for id "${id}".`);
      }

      const nextRecord = {
        ...existing,
        ...patch,
        id,
      };

      stores.get(store).set(id, nextRecord);
      return nextRecord;
    },
  };
}

/**
 * Builds lightweight update data helpers around the simulated wrapper API.
 * This mirrors create/get/list/update behaviour from `js/features/updates/data.js`
 * while remaining executable in Node without browser IndexedDB globals.
 *
 * @param {ReturnType<typeof createIndexedDbWrapperSimulation>} db
 */
function createUpdateDataHelpers(db) {
  const UPDATES_STORE = "updates";
  let idSequence = 0;

  return {
    async createUpdate(updateInput) {
      assertValidUpdate(updateInput);

      const nowIso = new Date().toISOString();
      const normalizedInput = normalizeUpdate(updateInput);

      idSequence += 1;
      const updateRecord = {
        id: `update-${idSequence}`,
        description: normalizedInput.description,
        meetingId: normalizedInput.meetingId,
        projectIds: normalizedInput.projectIds,
        requiresUpdateByPersonId: normalizedInput.requiresUpdateByPersonId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.createEntity(UPDATES_STORE, updateRecord);
      return updateRecord;
    },

    async getUpdate(updateId) {
      const normalizedUpdateId = typeof updateId === "string" ? updateId.trim() : "";

      if (!normalizedUpdateId) {
        throw new Error("Update id is required to retrieve an update.");
      }

      const update = await db.getEntity(UPDATES_STORE, normalizedUpdateId);
      return update ? normalizeUpdate(update) : null;
    },

    async listUpdates() {
      const updates = await db.listEntities(UPDATES_STORE);
      return updates.map(normalizeUpdate);
    },

    async updateUpdate(updateId, patch) {
      const normalizedUpdateId = typeof updateId === "string" ? updateId.trim() : "";

      if (!normalizedUpdateId) {
        throw new Error("Update id is required to update an update.");
      }

      const existingUpdateRecord = await db.getEntity(UPDATES_STORE, normalizedUpdateId);

      if (!existingUpdateRecord) {
        throw new Error(`Update not found for id "${normalizedUpdateId}".`);
      }

      const existingUpdate = normalizeUpdate(existingUpdateRecord);
      const incomingPatch = normalizeUpdate(patch);

      const hasDescriptionUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "description");
      const hasMeetingIdUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "meetingId");
      const hasProjectIdsUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "projectIds");
      const hasRequiresUpdateByPersonIdUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "requiresUpdateByPersonId");

      const updatedUpdate = {
        id: existingUpdate.id,
        description: hasDescriptionUpdate ? incomingPatch.description : existingUpdate.description,
        meetingId: hasMeetingIdUpdate ? incomingPatch.meetingId : existingUpdate.meetingId,
        projectIds: hasProjectIdsUpdate ? incomingPatch.projectIds : existingUpdate.projectIds,
        requiresUpdateByPersonId: hasRequiresUpdateByPersonIdUpdate
          ? incomingPatch.requiresUpdateByPersonId
          : existingUpdate.requiresUpdateByPersonId,
        createdAt: existingUpdate.createdAt,
        updatedAt: new Date().toISOString(),
      };

      assertValidUpdate(updatedUpdate);

      const savedUpdate = await db.updateEntity(UPDATES_STORE, normalizedUpdateId, updatedUpdate);
      return normalizeUpdate(savedUpdate);
    },
  };
}

async function runChecks() {
  const checks = [
    runCheck("normalizeUpdate trims fields and applies defaults", () => {
      const normalized = normalizeUpdate({
        id: " update-1 ",
        description: " Shared update note ",
        meetingId: " meeting-2 ",
        projectIds: undefined,
        createdAt: null,
        updatedAt: null,
      });

      assert(normalized.id === "update-1", "Expected id to be trimmed.");
      assert(normalized.description === "Shared update note", "Expected description to be trimmed.");
      assert(normalized.meetingId === "meeting-2", "Expected meetingId to be trimmed.");
      assert(
        Array.isArray(normalized.projectIds) && normalized.projectIds.length === 0,
        "Expected missing projectIds to default to an empty array."
      );
      assert(normalized.createdAt === "", "Expected missing createdAt to default to empty string.");
      assert(normalized.updatedAt === "", "Expected missing updatedAt to default to empty string.");
    }),

    runCheck("assertValidUpdate rejects missing description", () => {
      let descriptionRejected = false;

      try {
        assertValidUpdate({ description: "   " });
      } catch (_error) {
        descriptionRejected = true;
      }

      assert(descriptionRejected, "Expected blank description to fail validation.");
    }),

    runCheck("normalizeUpdate normalizes requiresUpdateByPersonId entries", () => {
      const normalized = normalizeUpdate({
        description: "Shared update note",
        requiresUpdateByPersonId: {
          " person-a ": { required: 0, informedAt: " 2026-03-07T12:00:00.000Z " },
          "": { required: true, informedAt: "2026-03-07T13:00:00.000Z" },
          " person-b ": { required: false, informedAt: "   " },
          " person-c ": null,
        },
      });

      assert(
        Object.keys(normalized.requiresUpdateByPersonId).length === 3,
        "Expected blank person ids to be dropped from requiresUpdateByPersonId."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-a"].required === true,
        "Expected required to default to true unless explicitly false."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-a"].informedAt === "2026-03-07T12:00:00.000Z",
        "Expected informedAt to be trimmed when provided."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-b"].required === false,
        "Expected explicit false required values to be preserved."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-b"].informedAt === null,
        "Expected blank informedAt values to normalize to null."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-c"].required === true &&
          normalized.requiresUpdateByPersonId["person-c"].informedAt === null,
        "Expected invalid requiresUpdate entries to normalize with defaults."
      );
    }),

    runCheck("normalizeUpdate deduplicates project id arrays", () => {
      const normalized = normalizeUpdate({
        description: "Shared update note",
        projectIds: [" project-a ", "", "project-b", "project-a"],
      });

      assert(
        normalized.projectIds.length === 2 &&
          normalized.projectIds[0] === "project-a" &&
          normalized.projectIds[1] === "project-b",
        "Expected projectIds to be trimmed, filtered, and deduplicated."
      );
    }),

    runCheck(
      "update create/get/list/update sanity checks via IndexedDB wrapper API simulation",
      async () => {
        const wrapperApi = createIndexedDbWrapperSimulation();
        const updateData = createUpdateDataHelpers(wrapperApi);

        const created = await updateData.createUpdate({
          description: "  Shared update note  ",
          meetingId: " meeting-x ",
          projectIds: [" project-1 ", "project-1", "project-2"],
          requiresUpdateByPersonId: {
            " person-1 ": { required: true, informedAt: " 2026-03-07T09:00:00.000Z " },
            "   ": { required: true, informedAt: "ignored" },
          },
        });

        assert(!!created.id, "Expected created update to include an id.");
        assert(
          created.description === "Shared update note",
          "Expected created update description to be normalized."
        );

        const loaded = await updateData.getUpdate(created.id);
        assert(loaded !== null, "Expected created update to be retrievable via getUpdate.");
        assert(loaded?.projectIds.length === 2, "Expected projectIds dedupe to persist on create.");
        assert(
          Object.keys(loaded?.requiresUpdateByPersonId ?? {}).length === 1 &&
            loaded?.requiresUpdateByPersonId["person-1"].informedAt === "2026-03-07T09:00:00.000Z",
          "Expected requiresUpdateByPersonId normalization to persist on create/get."
        );

        const listed = await updateData.listUpdates();
        assert(listed.length === 1, "Expected one update to be returned by listUpdates.");

        const updated = await updateData.updateUpdate(created.id, {
          description: "  Shared update note (Updated)  ",
          projectIds: [" project-2 ", "project-3", "project-2"],
          requiresUpdateByPersonId: {
            " person-2 ": { required: false, informedAt: "   " },
            " person-3 ": { required: true, informedAt: " 2026-03-08T10:00:00.000Z " },
          },
          id: "attempted-overwrite",
          createdAt: "attempted-overwrite",
        });

        assert(updated.id === created.id, "Expected updateUpdate to preserve immutable id.");
        assert(
          updated.createdAt === created.createdAt,
          "Expected updateUpdate to preserve immutable createdAt."
        );
        assert(
          updated.updatedAt !== created.updatedAt,
          "Expected updateUpdate to refresh updatedAt timestamp."
        );
        assert(
          updated.description === "Shared update note (Updated)",
          "Expected updateUpdate description normalization to trim incoming values."
        );
        assert(
          updated.projectIds.length === 2 &&
            updated.projectIds[0] === "project-2" &&
            updated.projectIds[1] === "project-3",
          "Expected updated projectIds to remain normalized and deduplicated."
        );
        assert(
          updated.requiresUpdateByPersonId["person-2"].required === false &&
            updated.requiresUpdateByPersonId["person-2"].informedAt === null &&
            updated.requiresUpdateByPersonId["person-3"].required === true &&
            updated.requiresUpdateByPersonId["person-3"].informedAt ===
              "2026-03-08T10:00:00.000Z",
          "Expected updateUpdate to round-trip normalized requiresUpdateByPersonId values."
        );
      }
    ),
  ];

  const results = await Promise.all(checks);
  const failedChecks = results.filter((result) => !result.passed);

  for (const result of results) {
    if (result.passed) {
      console.log(`PASS: ${result.label}`);
    } else {
      console.error(`FAIL: ${result.label} -> ${result.error}`);
    }
  }

  if (failedChecks.length > 0) {
    throw new Error(`${failedChecks.length} update record check(s) failed.`);
  }

  console.log(`\nUpdate record checks passed (${results.length}/${results.length}).`);
}

runChecks().catch((error) => {
  console.error(`\nUpdate record checks failed: ${error.message}`);
  process.exitCode = 1;
});
