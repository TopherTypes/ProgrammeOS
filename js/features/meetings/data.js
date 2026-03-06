import { createEntity, getEntity, listEntities, updateEntity } from "../../db.js";
import { assertValidMeeting, normalizeMeeting } from "./meeting-record.js";

const MEETINGS_STORE = "meetings";

/**
 * Creates a new meeting record with immutable identity and timestamp metadata.
 *
 * @param {{
 *   title: string,
 *   date: string,
 *   type?: string,
 *   attendeeIds?: string[],
 *   projectIds?: string[],
 *   notes?: string
 * }} meetingInput
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function createMeeting(meetingInput) {
  assertValidMeeting(meetingInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizeMeeting(meetingInput);

  const meetingRecord = {
    id: crypto.randomUUID(),
    title: normalizedInput.title,
    date: normalizedInput.date,
    type: normalizedInput.type,
    attendeeIds: normalizedInput.attendeeIds,
    projectIds: normalizedInput.projectIds,
    notes: normalizedInput.notes,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await createEntity(MEETINGS_STORE, meetingRecord);
  } catch (error) {
    throw new Error(
      `Failed to persist meeting "${meetingRecord.title}" dated "${meetingRecord.date}".`,
      { cause: error }
    );
  }

  return meetingRecord;
}

/**
 * Returns a single meeting in canonical UI shape.
 *
 * @param {string} meetingId
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }|null>}
 */
export async function getMeeting(meetingId) {
  const normalizedMeetingId =
    typeof meetingId === "string" ? meetingId.trim() : "";

  if (!normalizedMeetingId) {
    throw new Error("Meeting id is required to retrieve a meeting.");
  }

  try {
    const meeting = await getEntity(MEETINGS_STORE, normalizedMeetingId);
    return meeting ? normalizeMeeting(meeting) : null;
  } catch (error) {
    throw new Error(
      `Failed to retrieve meeting for id "${normalizedMeetingId}".`,
      {
        cause: error,
      }
    );
  }
}

/**
 * Returns all meetings in canonical UI shape.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }>>}
 */
export async function listMeetings() {
  try {
    const meetings = await listEntities(MEETINGS_STORE);
    return meetings.map(normalizeMeeting);
  } catch (error) {
    throw new Error("Failed to list meetings.", {
      cause: error,
    });
  }
}

/**
 * Updates an existing meeting while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} meetingId
 * @param {{
 *   title?: string,
 *   date?: string,
 *   type?: string,
 *   attendeeIds?: string[],
 *   projectIds?: string[],
 *   notes?: string,
 *   id?: string,
 *   createdAt?: string
 * }} patch
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }>}
 */
export async function updateMeeting(meetingId, patch) {
  const normalizedMeetingId =
    typeof meetingId === "string" ? meetingId.trim() : "";

  if (!normalizedMeetingId) {
    throw new Error("Meeting id is required to update a meeting.");
  }

  let existingMeetingRecord;

  try {
    existingMeetingRecord = await getEntity(MEETINGS_STORE, normalizedMeetingId);
  } catch (error) {
    throw new Error(
      `Failed to load existing meeting for id "${normalizedMeetingId}" before update.`,
      {
        cause: error,
      }
    );
  }

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
    createdAt: existingMeeting.createdAt,
    updatedAt: new Date().toISOString(),
  };

  assertValidMeeting(updatedMeeting);

  try {
    const savedMeeting = await updateEntity(
      MEETINGS_STORE,
      normalizedMeetingId,
      updatedMeeting
    );

    return normalizeMeeting(savedMeeting);
  } catch (error) {
    throw new Error(
      `Failed to persist meeting update for id "${normalizedMeetingId}".`,
      {
        cause: error,
      }
    );
  }
}
