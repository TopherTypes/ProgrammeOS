import { assertValidDecision, normalizeDecision } from "./decision-record.js";

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
  const stores = new Map([["decisions", new Map()]]);

  function assertDecisionsStore(store) {
    if (store !== "decisions") {
      throw new Error(`Unknown object store: ${store}`);
    }
  }

  return {
    async createEntity(store, data) {
      assertDecisionsStore(store);

      if (!data || typeof data !== "object") {
        throw new Error("Entity data must be an object.");
      }

      if (typeof data.id !== "string" || !data.id.trim()) {
        throw new Error('Entity for store "decisions" must include "id".');
      }

      stores.get(store).set(data.id, { ...data });
      return data.id;
    },

    async getEntity(store, id) {
      assertDecisionsStore(store);

      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Entity id is required.");
      }

      return stores.get(store).get(id) ?? null;
    },

    async listEntities(store) {
      assertDecisionsStore(store);
      return Array.from(stores.get(store).values());
    },

    async updateEntity(store, id, patch) {
      assertDecisionsStore(store);

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
 * Builds lightweight decision data helpers around the simulated wrapper API.
 * This mirrors create/get/list/update behaviour from `js/features/decisions/data.js`
 * while remaining executable in Node without browser IndexedDB globals.
 *
 * @param {ReturnType<typeof createIndexedDbWrapperSimulation>} db
 */
function createDecisionDataHelpers(db) {
  const DECISIONS_STORE = "decisions";
  let idSequence = 0;

  return {
    async createDecision(decisionInput) {
      assertValidDecision(decisionInput);

      const nowIso = new Date().toISOString();
      const normalizedInput = normalizeDecision(decisionInput);

      idSequence += 1;
      const decisionRecord = {
        id: `decision-${idSequence}`,
        description: normalizedInput.description,
        meetingId: normalizedInput.meetingId,
        projectIds: normalizedInput.projectIds,
        requiresUpdateByPersonId: normalizedInput.requiresUpdateByPersonId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.createEntity(DECISIONS_STORE, decisionRecord);
      return decisionRecord;
    },

    async getDecision(decisionId) {
      const normalizedDecisionId = typeof decisionId === "string" ? decisionId.trim() : "";

      if (!normalizedDecisionId) {
        throw new Error("Decision id is required to retrieve a decision.");
      }

      const decision = await db.getEntity(DECISIONS_STORE, normalizedDecisionId);
      return decision ? normalizeDecision(decision) : null;
    },

    async listDecisions() {
      const decisions = await db.listEntities(DECISIONS_STORE);
      return decisions.map(normalizeDecision);
    },

    async updateDecision(decisionId, patch) {
      const normalizedDecisionId = typeof decisionId === "string" ? decisionId.trim() : "";

      if (!normalizedDecisionId) {
        throw new Error("Decision id is required to update a decision.");
      }

      const existingDecisionRecord = await db.getEntity(DECISIONS_STORE, normalizedDecisionId);

      if (!existingDecisionRecord) {
        throw new Error(`Decision not found for id "${normalizedDecisionId}".`);
      }

      const existingDecision = normalizeDecision(existingDecisionRecord);
      const incomingPatch = normalizeDecision(patch);

      const hasDescriptionUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "description");
      const hasMeetingIdUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "meetingId");
      const hasProjectIdsUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "projectIds");
      const hasRequiresUpdateByPersonIdUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "requiresUpdateByPersonId");

      const updatedDecision = {
        id: existingDecision.id,
        description: hasDescriptionUpdate
          ? incomingPatch.description
          : existingDecision.description,
        meetingId: hasMeetingIdUpdate ? incomingPatch.meetingId : existingDecision.meetingId,
        projectIds: hasProjectIdsUpdate ? incomingPatch.projectIds : existingDecision.projectIds,
        requiresUpdateByPersonId: hasRequiresUpdateByPersonIdUpdate
          ? incomingPatch.requiresUpdateByPersonId
          : existingDecision.requiresUpdateByPersonId,
        createdAt: existingDecision.createdAt,
        updatedAt: new Date().toISOString(),
      };

      assertValidDecision(updatedDecision);

      const savedDecision = await db.updateEntity(
        DECISIONS_STORE,
        normalizedDecisionId,
        updatedDecision
      );

      return normalizeDecision(savedDecision);
    },
  };
}

async function runChecks() {
  const checks = [
    runCheck("normalizeDecision trims fields and applies defaults", () => {
      const normalized = normalizeDecision({
        id: " decision-1 ",
        description: " Confirm launch scope ",
        meetingId: " meeting-7 ",
        projectIds: undefined,
        createdAt: null,
        updatedAt: null,
      });

      assert(normalized.id === "decision-1", "Expected id to be trimmed.");
      assert(
        normalized.description === "Confirm launch scope",
        "Expected description to be trimmed."
      );
      assert(normalized.meetingId === "meeting-7", "Expected meetingId to be trimmed.");
      assert(
        Array.isArray(normalized.projectIds) && normalized.projectIds.length === 0,
        "Expected missing projectIds to default to an empty array."
      );
      assert(normalized.createdAt === "", "Expected missing createdAt to default to empty string.");
      assert(normalized.updatedAt === "", "Expected missing updatedAt to default to empty string.");
    }),

    runCheck("assertValidDecision rejects missing description", () => {
      let descriptionRejected = false;

      try {
        assertValidDecision({ description: "   " });
      } catch (_error) {
        descriptionRejected = true;
      }

      assert(descriptionRejected, "Expected blank description to fail validation.");
    }),

    runCheck("normalizeDecision normalizes requiresUpdateByPersonId entries", () => {
      const normalized = normalizeDecision({
        description: "Confirm launch scope",
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

    runCheck("normalizeDecision deduplicates project id arrays", () => {
      const normalized = normalizeDecision({
        description: "Confirm launch scope",
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
      "decision create/get/list/update sanity checks via IndexedDB wrapper API simulation",
      async () => {
        const wrapperApi = createIndexedDbWrapperSimulation();
        const decisionData = createDecisionDataHelpers(wrapperApi);

        const created = await decisionData.createDecision({
          description: "  Confirm launch scope  ",
          meetingId: " meeting-x ",
          projectIds: [" project-1 ", "project-1", "project-2"],
          requiresUpdateByPersonId: {
            " person-1 ": { required: true, informedAt: " 2026-03-07T09:00:00.000Z " },
            "   ": { required: true, informedAt: "ignored" },
          },
        });

        assert(!!created.id, "Expected created decision to include an id.");
        assert(
          created.description === "Confirm launch scope",
          "Expected created decision description to be normalized."
        );

        const loaded = await decisionData.getDecision(created.id);
        assert(loaded !== null, "Expected created decision to be retrievable via getDecision.");
        assert(loaded?.projectIds.length === 2, "Expected projectIds dedupe to persist on create.");
        assert(
          Object.keys(loaded?.requiresUpdateByPersonId ?? {}).length === 1 &&
            loaded?.requiresUpdateByPersonId["person-1"].informedAt === "2026-03-07T09:00:00.000Z",
          "Expected requiresUpdateByPersonId normalization to persist on create/get."
        );

        const listed = await decisionData.listDecisions();
        assert(listed.length === 1, "Expected one decision to be returned by listDecisions.");

        const updated = await decisionData.updateDecision(created.id, {
          description: "  Confirm launch scope (Updated)  ",
          projectIds: [" project-2 ", "project-3", "project-2"],
          requiresUpdateByPersonId: {
            " person-2 ": { required: false, informedAt: "   " },
            " person-3 ": { required: true, informedAt: " 2026-03-08T10:00:00.000Z " },
          },
          id: "attempted-overwrite",
          createdAt: "attempted-overwrite",
        });

        assert(updated.id === created.id, "Expected updateDecision to preserve immutable id.");
        assert(
          updated.createdAt === created.createdAt,
          "Expected updateDecision to preserve immutable createdAt."
        );
        assert(
          updated.updatedAt !== created.updatedAt,
          "Expected updateDecision to refresh updatedAt timestamp."
        );
        assert(
          updated.description === "Confirm launch scope (Updated)",
          "Expected updateDecision description normalization to trim incoming values."
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
          "Expected updateDecision to round-trip normalized requiresUpdateByPersonId values."
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
    throw new Error(`${failedChecks.length} decision record check(s) failed.`);
  }

  console.log(`\nDecision record checks passed (${results.length}/${results.length}).`);
}

runChecks().catch((error) => {
  console.error(`\nDecision record checks failed: ${error.message}`);
  process.exitCode = 1;
});
