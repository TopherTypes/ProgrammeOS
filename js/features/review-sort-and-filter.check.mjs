import { sortActionsForDisplay, sortRecordsOldestFirst } from "./review-sort.js";

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
 * Mirrors route-level meeting filter semantics used by Actions/Decisions/Updates:
 * records are sorted first, then optionally filtered by exact meetingId match.
 *
 * @template T
 * @param {T[]} records
 * @param {string} selectedMeetingFilter
 * @param {(records: T[]) => T[]} sorter
 * @returns {T[]}
 */
function applyMeetingFilter(records, selectedMeetingFilter, sorter) {
  const sortedRecords = sorter(records);
  const isFilterActive = Boolean(selectedMeetingFilter);

  return isFilterActive
    ? sortedRecords.filter((record) => record?.meetingId === selectedMeetingFilter)
    : sortedRecords;
}

async function runChecks() {
  const checks = [
    runCheck("meeting-linked filtering shows only matching linked records", () => {
      const records = [
        { id: "record-1", meetingId: "meeting-a", createdAt: "2026-03-06T10:00:00.000Z" },
        { id: "record-2", meetingId: "meeting-b", createdAt: "2026-03-06T09:00:00.000Z" },
        { id: "record-3", meetingId: "", createdAt: "2026-03-06T08:00:00.000Z" },
      ];

      const visible = applyMeetingFilter(records, "meeting-a", sortRecordsOldestFirst);

      assert(visible.length === 1, "Expected only one record to remain after meeting filter.");
      assert(
        visible[0].id === "record-1",
        "Expected filter to keep only records with exact matching meetingId."
      );
    }),

    runCheck("meeting-linked filtering returns all records when no filter is selected", () => {
      const records = [
        { id: "record-1", meetingId: "meeting-a", createdAt: "2026-03-06T10:00:00.000Z" },
        { id: "record-2", meetingId: "meeting-b", createdAt: "2026-03-06T09:00:00.000Z" },
        { id: "record-3", meetingId: "", createdAt: "2026-03-06T08:00:00.000Z" },
      ];

      const visible = applyMeetingFilter(records, "", sortRecordsOldestFirst);

      assert(visible.length === 3, 'Expected "All meetings" mode to keep every record.');
      assert(
        visible.map((record) => record.id).join(",") === "record-3,record-2,record-1",
        "Expected unfiltered records to still use deterministic oldest-first sorting."
      );
    }),

    runCheck("sortActionsForDisplay applies status buckets then deterministic tie-breakers", () => {
      const sorted = sortActionsForDisplay([
        {
          id: "action-z",
          status: "done",
          createdAt: "2026-03-06T10:00:00.000Z",
        },
        {
          id: "action-a",
          status: "open",
          createdAt: "2026-03-06T10:00:00.000Z",
        },
        {
          id: "action-b",
          status: "open",
          createdAt: "2026-03-06T10:00:00.000Z",
        },
        {
          id: "action-c",
          status: "in-progress",
          createdAt: "2026-03-06T09:00:00.000Z",
        },
      ]);

      assert(
        sorted.map((action) => action.id).join(",") === "action-a,action-b,action-c,action-z",
        "Expected actions to sort by status bucket order, then stable createdAt/id tie-breakers."
      );
    }),

    runCheck("sortRecordsOldestFirst keeps deterministic order for invalid timestamp ties", () => {
      const sorted = sortRecordsOldestFirst([
        {
          id: "record-c",
          createdAt: "",
        },
        {
          id: "record-a",
          createdAt: "",
        },
        {
          id: "record-b",
          createdAt: "2026-03-06T09:00:00.000Z",
        },
      ]);

      assert(
        sorted.map((record) => record.id).join(",") === "record-b,record-c,record-a",
        "Expected oldest valid timestamps first, with invalid timestamp ties preserving stable input order."
      );
    }),
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
    throw new Error(`${failedChecks.length} review sort/filter check(s) failed.`);
  }

  console.log(`\nReview sort/filter checks passed (${results.length}/${results.length}).`);
}

runChecks().catch((error) => {
  console.error(`\nReview sort/filter checks failed: ${error.message}`);
  process.exitCode = 1;
});

