import { assertValidAction, normalizeAction } from "./action-record.js";

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
  const stores = new Map([["actions", new Map()]]);

  function assertActionsStore(store) {
    if (store !== "actions") {
      throw new Error(`Unknown object store: ${store}`);
    }
  }

  return {
    async createEntity(store, data) {
      assertActionsStore(store);

      if (!data || typeof data !== "object") {
        throw new Error("Entity data must be an object.");
      }

      if (typeof data.id !== "string" || !data.id.trim()) {
        throw new Error('Entity for store "actions" must include "id".');
      }

      stores.get(store).set(data.id, { ...data });
      return data.id;
    },

    async getEntity(store, id) {
      assertActionsStore(store);

      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Entity id is required.");
      }

      return stores.get(store).get(id) ?? null;
    },

    async listEntities(store) {
      assertActionsStore(store);
      return Array.from(stores.get(store).values());
    },

    async updateEntity(store, id, patch) {
      assertActionsStore(store);

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
 * Builds lightweight action data helpers around the simulated wrapper API.
 * This mirrors create/get/list/update behaviour from `js/features/actions/data.js`
 * while remaining executable in Node without browser IndexedDB globals.
 *
 * @param {ReturnType<typeof createIndexedDbWrapperSimulation>} db
 */
function createActionDataHelpers(db) {
  const ACTIONS_STORE = "actions";
  let idSequence = 0;

  return {
    async createAction(actionInput) {
      assertValidAction(actionInput);

      const nowIso = new Date().toISOString();
      const normalizedInput = normalizeAction(actionInput);

      idSequence += 1;
      const actionRecord = {
        id: `action-${idSequence}`,
        description: normalizedInput.description,
        ownerPersonId: normalizedInput.ownerPersonId,
        status: normalizedInput.status,
        dueDate: normalizedInput.dueDate,
        meetingId: normalizedInput.meetingId,
        projectIds: normalizedInput.projectIds,
        requiresUpdateByPersonId: normalizedInput.requiresUpdateByPersonId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.createEntity(ACTIONS_STORE, actionRecord);
      return actionRecord;
    },

    async getAction(actionId) {
      const normalizedActionId = typeof actionId === "string" ? actionId.trim() : "";

      if (!normalizedActionId) {
        throw new Error("Action id is required to retrieve an action.");
      }

      const action = await db.getEntity(ACTIONS_STORE, normalizedActionId);
      return action ? normalizeAction(action) : null;
    },

    async listActions() {
      const actions = await db.listEntities(ACTIONS_STORE);
      return actions.map(normalizeAction);
    },

    async updateAction(actionId, patch) {
      const normalizedActionId = typeof actionId === "string" ? actionId.trim() : "";

      if (!normalizedActionId) {
        throw new Error("Action id is required to update an action.");
      }

      const existingActionRecord = await db.getEntity(ACTIONS_STORE, normalizedActionId);

      if (!existingActionRecord) {
        throw new Error(`Action not found for id "${normalizedActionId}".`);
      }

      const safePatch = patch && typeof patch === "object" ? patch : {};
      const normalizedExisting = normalizeAction(existingActionRecord);
      const normalizedPatch = normalizeAction(safePatch);

      const updatedAction = {
        id: normalizedExisting.id,
        description:
          "description" in safePatch
            ? normalizedPatch.description
            : normalizedExisting.description,
        ownerPersonId:
          "ownerPersonId" in safePatch
            ? normalizedPatch.ownerPersonId
            : normalizedExisting.ownerPersonId,
        status: "status" in safePatch ? normalizedPatch.status : normalizedExisting.status,
        dueDate: "dueDate" in safePatch ? normalizedPatch.dueDate : normalizedExisting.dueDate,
        meetingId: "meetingId" in safePatch ? normalizedPatch.meetingId : normalizedExisting.meetingId,
        projectIds:
          "projectIds" in safePatch ? normalizedPatch.projectIds : normalizedExisting.projectIds,
        requiresUpdateByPersonId:
          "requiresUpdateByPersonId" in safePatch
            ? normalizedPatch.requiresUpdateByPersonId
            : normalizedExisting.requiresUpdateByPersonId,
        createdAt: normalizedExisting.createdAt,
        updatedAt: new Date().toISOString(),
      };

      assertValidAction(updatedAction);

      const savedAction = await db.updateEntity(ACTIONS_STORE, normalizedActionId, updatedAction);
      return normalizeAction(savedAction);
    },
  };
}

async function runChecks() {
  const checks = [
    runCheck("normalizeAction trims fields and applies defaults", () => {
      const normalized = normalizeAction({
        id: " action-1 ",
        description: " Follow up with sponsor ",
        ownerPersonId: " person-1 ",
        status: " Open ",
        dueDate: " 2026-04-01 ",
        meetingId: " meeting-7 ",
        projectIds: undefined,
        requiresUpdateByPersonId: undefined,
        createdAt: null,
        updatedAt: null,
      });

      assert(normalized.id === "action-1", "Expected id to be trimmed.");
      assert(
        normalized.description === "Follow up with sponsor",
        "Expected description to be trimmed."
      );
      assert(normalized.ownerPersonId === "person-1", "Expected ownerPersonId to be trimmed.");
      assert(normalized.status === "Open", "Expected status to be trimmed.");
      assert(normalized.dueDate === "2026-04-01", "Expected dueDate to be trimmed.");
      assert(normalized.meetingId === "meeting-7", "Expected meetingId to be trimmed.");
      assert(
        Array.isArray(normalized.projectIds) && normalized.projectIds.length === 0,
        "Expected missing projectIds to default to an empty array."
      );
      assert(
        normalized.requiresUpdateByPersonId &&
          Object.keys(normalized.requiresUpdateByPersonId).length === 0,
        "Expected missing requiresUpdateByPersonId to default to an empty object."
      );
      assert(normalized.createdAt === "", "Expected missing createdAt to default to empty string.");
      assert(normalized.updatedAt === "", "Expected missing updatedAt to default to empty string.");
    }),

    runCheck("assertValidAction rejects missing description", () => {
      let descriptionRejected = false;

      try {
        assertValidAction({ description: "   " });
      } catch (_error) {
        descriptionRejected = true;
      }

      assert(descriptionRejected, "Expected blank description to fail validation.");
    }),

    runCheck("normalizeAction deduplicates project ids and requires-update map ids", () => {
      const normalized = normalizeAction({
        description: "Follow up",
        projectIds: [" project-a ", "", "project-b", "project-a"],
        requiresUpdateByPersonId: {
          " person-1 ": { required: true, informedAt: " 2026-03-05T12:00:00.000Z " },
          "person-2": { required: false, informedAt: "" },
          " person-1": { required: true, informedAt: " 2026-03-06T10:00:00.000Z " },
          " ": { required: true, informedAt: null },
        },
      });

      assert(
        normalized.projectIds.length === 2 &&
          normalized.projectIds[0] === "project-a" &&
          normalized.projectIds[1] === "project-b",
        "Expected projectIds to be trimmed, filtered, and deduplicated."
      );

      const entries = Object.entries(normalized.requiresUpdateByPersonId);
      assert(entries.length === 2, "Expected blank person ids to be removed from requires-update map.");
      assert(
        normalized.requiresUpdateByPersonId["person-1"].informedAt === "2026-03-06T10:00:00.000Z",
        "Expected duplicate person ids in requires-update map to collapse to the last normalized value."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-2"].required === false,
        "Expected requires-update required=false to be preserved."
      );
      assert(
        normalized.requiresUpdateByPersonId["person-2"].informedAt === null,
        "Expected blank informedAt to normalize to null."
      );
    }),

    runCheck(
      "action create/get/list/update sanity checks via IndexedDB wrapper API simulation",
      async () => {
        const wrapperApi = createIndexedDbWrapperSimulation();
        const actionData = createActionDataHelpers(wrapperApi);

        const created = await actionData.createAction({
          description: "  Follow up after steering meeting  ",
          ownerPersonId: " person-a ",
          status: " Open ",
          dueDate: " 2026-04-01 ",
          meetingId: " meeting-x ",
          projectIds: [" project-1 ", "project-1", "project-2"],
          requiresUpdateByPersonId: {
            " person-a ": { required: true, informedAt: "" },
            "person-b": { required: false, informedAt: " 2026-03-07T09:00:00.000Z " },
          },
        });

        assert(!!created.id, "Expected created action to include an id.");
        assert(
          created.description === "Follow up after steering meeting",
          "Expected created action description to be normalized."
        );

        const loaded = await actionData.getAction(created.id);
        assert(loaded !== null, "Expected created action to be retrievable via getAction.");
        assert(loaded?.projectIds.length === 2, "Expected projectIds dedupe to persist on create.");

        const listed = await actionData.listActions();
        assert(listed.length === 1, "Expected one action to be returned by listActions.");

        const updated = await actionData.updateAction(created.id, {
          description: "  Follow up after steering meeting (Updated)  ",
          projectIds: [" project-2 ", "project-3", "project-2"],
          requiresUpdateByPersonId: {
            " person-c ": { required: true, informedAt: " 2026-03-08T11:30:00.000Z " },
            "person-c": { required: false, informedAt: "" },
          },
          id: "attempted-overwrite",
          createdAt: "attempted-overwrite",
        });

        assert(updated.id === created.id, "Expected updateAction to preserve immutable id.");
        assert(
          updated.createdAt === created.createdAt,
          "Expected updateAction to preserve immutable createdAt."
        );
        assert(
          updated.updatedAt !== created.updatedAt,
          "Expected updateAction to refresh updatedAt timestamp."
        );
        assert(
          updated.description === "Follow up after steering meeting (Updated)",
          "Expected updateAction description normalization to trim incoming values."
        );
        assert(
          updated.projectIds.length === 2 &&
            updated.projectIds[0] === "project-2" &&
            updated.projectIds[1] === "project-3",
          "Expected updated projectIds to remain normalized and deduplicated."
        );
        assert(
          Object.keys(updated.requiresUpdateByPersonId).length === 1 &&
            updated.requiresUpdateByPersonId["person-c"].required === false,
          "Expected updated requiresUpdateByPersonId to remain normalized and deduplicated by person id."
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
    throw new Error(`${failedChecks.length} action record check(s) failed.`);
  }

  console.log(`\nAction record checks passed (${results.length}/${results.length}).`);
}

runChecks().catch((error) => {
  console.error(`\nAction record checks failed: ${error.message}`);
  process.exitCode = 1;
});
