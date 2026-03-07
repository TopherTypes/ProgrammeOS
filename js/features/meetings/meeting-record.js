/**
 * Meetings feature: shared record shaping and validation helpers.
 *
 * These helpers are intentionally pure so both browser runtime modules and
 * lightweight Node verification scripts can rely on identical behaviour.
 */

/**
 * Converts unknown values into a trimmed string.
 *
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalizes a value into a unique array of trimmed non-empty string ids.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function asNormalizedIdArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedIds = value
    .map(asTrimmedString)
    .filter((id) => id.length > 0);

  return [...new Set(normalizedIds)];
}

/**
 * Canonical checklist keys used for meeting review completion tracking.
 */
export const REVIEW_CHECKLIST_KEYS = [
  "actionsReviewed",
  "decisionsReviewed",
  "updatesReviewed",
];

/**
 * Canonical default checklist state for every meeting record.
 */
export const DEFAULT_REVIEW_CHECKLIST = Object.freeze({
  actionsReviewed: false,
  decisionsReviewed: false,
  updatesReviewed: false,
});

/**
 * Normalizes unknown checklist input into a safe canonical boolean map.
 *
 * The optional fallback allows partial updates to inherit existing values,
 * preserving backward compatibility for previously persisted meetings.
 *
 * @param {unknown} value
 * @param {{actionsReviewed?: boolean, decisionsReviewed?: boolean, updatesReviewed?: boolean}} [fallback]
 * @returns {{actionsReviewed: boolean, decisionsReviewed: boolean, updatesReviewed: boolean}}
 */
export function normalizeReviewChecklist(value, fallback = DEFAULT_REVIEW_CHECKLIST) {
  const source = value && typeof value === "object" ? value : null;

  return {
    actionsReviewed:
      source && source.actionsReviewed === true
        ? true
        : Boolean(fallback.actionsReviewed),
    decisionsReviewed:
      source && source.decisionsReviewed === true
        ? true
        : Boolean(fallback.decisionsReviewed),
    updatesReviewed:
      source && source.updatesReviewed === true
        ? true
        : Boolean(fallback.updatesReviewed),
  };
}

/**
 * Normalises a meeting-like object into the canonical meeting shape.
 *
 * @param {Record<string, unknown>|undefined|null} meeting
 * @returns {{
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   reviewChecklist: {
 *     actionsReviewed: boolean,
 *     decisionsReviewed: boolean,
 *     updatesReviewed: boolean,
 *   },
 *   createdAt: string,
 *   updatedAt: string,
 * }}
 */
export function normalizeMeeting(meeting) {
  return {
    id: asTrimmedString(meeting?.id),
    title: asTrimmedString(meeting?.title),
    date: asTrimmedString(meeting?.date),
    type: asTrimmedString(meeting?.type),
    attendeeIds: asNormalizedIdArray(meeting?.attendeeIds),
    projectIds: asNormalizedIdArray(meeting?.projectIds),
    notes: asTrimmedString(meeting?.notes),
    reviewChecklist: normalizeReviewChecklist(meeting?.reviewChecklist),
    createdAt: asTrimmedString(meeting?.createdAt),
    updatedAt: asTrimmedString(meeting?.updatedAt),
  };
}

/**
 * Validates required meeting fields before persistence.
 *
 * @param {Record<string, unknown>|undefined|null} meeting
 */
export function assertValidMeeting(meeting) {
  const normalizedMeeting = normalizeMeeting(meeting);

  if (!normalizedMeeting.title) {
    throw new Error('Meeting "title" is required.');
  }

  if (!normalizedMeeting.date) {
    throw new Error('Meeting "date" is required.');
  }
}
