import {
  assertValidMeeting,
  DEFAULT_REVIEW_CHECKLIST,
  normalizeMeeting,
  normalizeReviewChecklist,
} from "./meeting-record.js";

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
  const stores = new Map([["meetings", new Map()]]);

  function assertMeetingsStore(store) {
    if (store !== "meetings") {
      throw new Error(`Unknown object store: ${store}`);
    }
  }

  return {
    async createEntity(store, data) {
      assertMeetingsStore(store);

      if (!data || typeof data !== "object") {
        throw new Error("Entity data must be an object.");
      }

      if (typeof data.id !== "string" || !data.id.trim()) {
        throw new Error('Entity for store "meetings" must include "id".');
      }

      stores.get(store).set(data.id, { ...data });
      return data.id;
    },

    async getEntity(store, id) {
      assertMeetingsStore(store);

      if (typeof id !== "string" || !id.trim()) {
        throw new Error("Entity id is required.");
      }

      return stores.get(store).get(id) ?? null;
    },

    async listEntities(store) {
      assertMeetingsStore(store);
      return Array.from(stores.get(store).values());
    },

    async updateEntity(store, id, patch) {
      assertMeetingsStore(store);

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
 * Builds lightweight meeting data helpers around the simulated wrapper API.
 * This mirrors create/get/list/update behaviour from `js/features/meetings/data.js`
 * while remaining executable in Node without browser IndexedDB globals.
 *
 * @param {ReturnType<typeof createIndexedDbWrapperSimulation>} db
 */
function createMeetingDataHelpers(db) {
  const MEETINGS_STORE = "meetings";
  let idSequence = 0;

  return {
    async createMeeting(meetingInput) {
      assertValidMeeting(meetingInput);

      const nowIso = new Date().toISOString();
      const normalizedInput = normalizeMeeting(meetingInput);

      idSequence += 1;
      const meetingRecord = {
        id: `meeting-${idSequence}`,
        title: normalizedInput.title,
        date: normalizedInput.date,
        type: normalizedInput.type,
        attendeeIds: normalizedInput.attendeeIds,
        projectIds: normalizedInput.projectIds,
        notes: normalizedInput.notes,
        reviewChecklist: normalizedInput.reviewChecklist,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.createEntity(MEETINGS_STORE, meetingRecord);
      return meetingRecord;
    },

    async getMeeting(meetingId) {
      const normalizedMeetingId =
        typeof meetingId === "string" ? meetingId.trim() : "";

      if (!normalizedMeetingId) {
        throw new Error("Meeting id is required to retrieve a meeting.");
      }

      const meeting = await db.getEntity(MEETINGS_STORE, normalizedMeetingId);
      return meeting ? normalizeMeeting(meeting) : null;
    },

    async listMeetings() {
      const meetings = await db.listEntities(MEETINGS_STORE);
      return meetings.map(normalizeMeeting);
    },

    async updateMeeting(meetingId, patch) {
      const normalizedMeetingId =
        typeof meetingId === "string" ? meetingId.trim() : "";

      if (!normalizedMeetingId) {
        throw new Error("Meeting id is required to update a meeting.");
      }

      const existingMeetingRecord = await db.getEntity(
        MEETINGS_STORE,
        normalizedMeetingId
      );

      if (!existingMeetingRecord) {
        throw new Error(`Meeting not found for id "${normalizedMeetingId}".`);
      }

      const existingMeeting = normalizeMeeting(existingMeetingRecord);
      const incomingPatch = normalizeMeeting(patch);

      const hasTitleUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "title");
      const hasDateUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "date");
      const hasTypeUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "type");
      const hasAttendeeIdsUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "attendeeIds");
      const hasProjectIdsUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "projectIds");
      const hasNotesUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "notes");
      const hasReviewChecklistUpdate =
        !!patch && Object.prototype.hasOwnProperty.call(patch, "reviewChecklist");

      const reviewChecklist = hasReviewChecklistUpdate
        ? normalizeReviewChecklist(patch?.reviewChecklist, existingMeeting.reviewChecklist)
        : normalizeReviewChecklist(existingMeeting.reviewChecklist, DEFAULT_REVIEW_CHECKLIST);

      const updatedMeeting = {
        id: existingMeeting.id,
        title: hasTitleUpdate ? incomingPatch.title : existingMeeting.title,
        date: hasDateUpdate ? incomingPatch.date : existingMeeting.date,
        type: hasTypeUpdate ? incomingPatch.type : existingMeeting.type,
        attendeeIds: hasAttendeeIdsUpdate
          ? incomingPatch.attendeeIds
          : existingMeeting.attendeeIds,
        projectIds: hasProjectIdsUpdate
          ? incomingPatch.projectIds
          : existingMeeting.projectIds,
        notes: hasNotesUpdate ? incomingPatch.notes : existingMeeting.notes,
        reviewChecklist,
        createdAt: existingMeeting.createdAt,
        updatedAt: new Date().toISOString(),
      };

      assertValidMeeting(updatedMeeting);

      const savedMeeting = await db.updateEntity(
        MEETINGS_STORE,
        normalizedMeetingId,
        updatedMeeting
      );

      return normalizeMeeting(savedMeeting);
    },
  };
}

async function runChecks() {
  const checks = [
    runCheck("normalizeMeeting trims fields and applies defaults", () => {
      const normalized = normalizeMeeting({
        id: " meeting-1 ",
        title: " Weekly Update ",
        date: " 2026-03-06 ",
        type: undefined,
        attendeeIds: undefined,
        projectIds: null,
        notes: null,
      });

      assert(normalized.id === "meeting-1", "Expected id to be trimmed.");
      assert(normalized.title === "Weekly Update", "Expected title to be trimmed.");
      assert(normalized.date === "2026-03-06", "Expected date to be trimmed.");
      assert(normalized.type === "", "Expected missing type to default to empty string.");
      assert(
        Array.isArray(normalized.attendeeIds) && normalized.attendeeIds.length === 0,
        "Expected missing attendeeIds to default to an empty array."
      );
      assert(
        Array.isArray(normalized.projectIds) && normalized.projectIds.length === 0,
        "Expected missing projectIds to default to an empty array."
      );
      assert(normalized.notes === "", "Expected missing notes to default to empty string.");
      assert(
        normalized.reviewChecklist.actionsReviewed === false &&
          normalized.reviewChecklist.decisionsReviewed === false &&
          normalized.reviewChecklist.updatesReviewed === false,
        "Expected missing reviewChecklist to default all values to false."
      );
    }),

    runCheck("normalizeMeeting normalizes reviewChecklist booleans", () => {
      const normalized = normalizeMeeting({
        title: "Weekly Update",
        date: "2026-03-06",
        reviewChecklist: {
          actionsReviewed: true,
          decisionsReviewed: "yes",
          updatesReviewed: true,
        },
      });

      assert(normalized.reviewChecklist.actionsReviewed === true, "Expected true value to persist.");
      assert(
        normalized.reviewChecklist.decisionsReviewed === false,
        "Expected non-boolean checklist values to normalize to false."
      );
      assert(normalized.reviewChecklist.updatesReviewed === true, "Expected true value to persist.");
    }),

    runCheck("assertValidMeeting rejects missing title/date", () => {
      let titleRejected = false;
      let dateRejected = false;

      try {
        assertValidMeeting({ title: "   ", date: "2026-03-06" });
      } catch (_error) {
        titleRejected = true;
      }

      try {
        assertValidMeeting({ title: "Weekly Update", date: "   " });
      } catch (_error) {
        dateRejected = true;
      }

      assert(titleRejected, "Expected blank title to fail validation.");
      assert(dateRejected, "Expected blank date to fail validation.");
    }),

    runCheck("normalizeMeeting deduplicates attendee/project id arrays", () => {
      const normalized = normalizeMeeting({
        title: "Weekly Update",
        date: "2026-03-06",
        attendeeIds: [" person-1 ", "", "person-2", "person-1"],
        projectIds: [" project-2", "project-1 ", "project-2"],
      });

      assert(
        normalized.attendeeIds.length === 2 &&
          normalized.attendeeIds[0] === "person-1" &&
          normalized.attendeeIds[1] === "person-2",
        "Expected attendeeIds to be trimmed, filtered, and deduplicated."
      );

      assert(
        normalized.projectIds.length === 2 &&
          normalized.projectIds[0] === "project-2" &&
          normalized.projectIds[1] === "project-1",
        "Expected projectIds to be trimmed, filtered, and deduplicated."
      );
    }),

    runCheck(
      "meeting create/get/list/update sanity checks via IndexedDB wrapper API simulation",
      async () => {
        const wrapperApi = createIndexedDbWrapperSimulation();
        const meetingData = createMeetingDataHelpers(wrapperApi);

        const created = await meetingData.createMeeting({
          title: "  Planning Sync  ",
          date: " 2026-03-08 ",
          type: "  Steering  ",
          attendeeIds: [" person-a ", "person-a", "person-b"],
          projectIds: [" project-x ", "project-x"],
          notes: " Initial notes ",
        });

        assert(!!created.id, "Expected created meeting to include an id.");
        assert(created.title === "Planning Sync", "Expected created meeting title to be normalized.");
        assert(
          created.reviewChecklist.actionsReviewed === false &&
            created.reviewChecklist.decisionsReviewed === false &&
            created.reviewChecklist.updatesReviewed === false,
          "Expected created meeting checklist defaults to be persisted."
        );

        const loaded = await meetingData.getMeeting(created.id);
        assert(loaded !== null, "Expected created meeting to be retrievable via getMeeting.");
        assert(loaded?.attendeeIds.length === 2, "Expected attendeeIds dedupe to persist on create.");

        const listed = await meetingData.listMeetings();
        assert(listed.length === 1, "Expected one meeting to be returned by listMeetings.");

        const updated = await meetingData.updateMeeting(created.id, {
          title: "  Planning Sync (Updated)  ",
          attendeeIds: [" person-b ", "person-c", "person-b"],
          reviewChecklist: {
            actionsReviewed: true,
            decisionsReviewed: true,
          },
          id: "attempted-overwrite",
          createdAt: "attempted-overwrite",
        });

        assert(updated.id === created.id, "Expected updateMeeting to preserve immutable id.");
        assert(
          updated.createdAt === created.createdAt,
          "Expected updateMeeting to preserve immutable createdAt."
        );
        assert(
          updated.updatedAt !== created.updatedAt,
          "Expected updateMeeting to refresh updatedAt timestamp."
        );
        assert(
          updated.title === "Planning Sync (Updated)",
          "Expected updateMeeting title normalization to trim incoming values."
        );
        assert(
          updated.attendeeIds.length === 2 &&
            updated.attendeeIds[0] === "person-b" &&
            updated.attendeeIds[1] === "person-c",
          "Expected updated attendeeIds to remain normalized and deduplicated."
        );
        assert(
          updated.reviewChecklist.actionsReviewed === true &&
            updated.reviewChecklist.decisionsReviewed === true &&
            updated.reviewChecklist.updatesReviewed === false,
          "Expected updateMeeting checklist patch to merge with existing defaults."
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
    throw new Error(`${failedChecks.length} meeting record check(s) failed.`);
  }

  console.log(`\nMeeting record checks passed (${results.length}/${results.length}).`);
}

runChecks().catch((error) => {
  console.error(`\nMeeting record checks failed: ${error.message}`);
  process.exitCode = 1;
});
