import { renderPageFrame } from "../../layout.js";
import { updateAction } from "../actions/data.js";
import { listActions } from "../actions/data.js";
import { updateDecision } from "../decisions/data.js";
import { listDecisions } from "../decisions/data.js";
import { listPeople } from "../people/data.js";
import { listProjects } from "../projects/data.js";
import { updateUpdate } from "../updates/data.js";
import { listUpdates } from "../updates/data.js";
import { listMeetings } from "./data.js";
import { openNewMeetingModal } from "./new-meeting-modal.js";
import { sortActionsForDisplay, sortRecordsOldestFirst } from "../review-sort.js";

/**
 * Escapes user-controlled strings before insertion into template literals.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Renders the static frame for the meetings route.
 *
 * This split keeps route paint immediate and allows asynchronous hydration from
 * IndexedDB after mount checks pass.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderMeetingsPageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "Meetings",
    bodyHtml: `
      <section class="meetings-page" aria-label="Meetings management">
        <section class="people-toolbar" aria-label="Meeting actions">
          <button class="people-button" type="button" data-role="new-meeting-trigger">New Meeting</button>
          <p class="small-note" data-role="meetings-status" aria-live="polite"></p>
        </section>

        <section class="meetings-list" data-role="meetings-list" aria-label="Meetings records"></section>
      </section>
    `,
    detailHtml: `
      <section data-role="meeting-detail" aria-label="Meeting detail panel">
        <p class="small-note" data-role="meeting-detail-empty">
          Select a meeting to view details.
        </p>
      </section>
    `,
  });
}

/**
 * Renders the meetings table or explicit empty state.
 *
 * @param {HTMLElement} listContainer
 * @param {Array<{id: string, title?: string, date?: string, type?: string, attendeeIds?: string[]}>} meetings
 * @param {string|null} selectedMeetingId
 */
function renderMeetingsList(listContainer, meetings, selectedMeetingId) {
  if (meetings.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="meetings-empty-state">
        No meetings have been logged yet. Use New Meeting to capture the first one.
      </p>
    `;
    return;
  }

  const rowsHtml = meetings
    .map((meeting) => {
      const title = escapeHtml(meeting.title?.trim() || "Untitled meeting");
      const date = escapeHtml(meeting.date?.trim() || "No date");
      const type = escapeHtml(meeting.type?.trim() || "General");
      const attendeeCount = meeting.attendeeIds?.length ?? 0;
      const isSelected = meeting.id === selectedMeetingId;

      return `
        <tr data-role="meeting-row" data-meeting-id="${meeting.id}" aria-selected="${
          isSelected ? "true" : "false"
        }" class="${isSelected ? "is-selected" : ""}">
          <td>
            <button
              class="projects-list-item"
              type="button"
              data-role="meeting-item"
              data-meeting-id="${meeting.id}"
              aria-pressed="${isSelected ? "true" : "false"}"
            >
              ${title}
            </button>
          </td>
          <td>${date}</td>
          <td>${type}</td>
          <td>${attendeeCount}</td>
        </tr>
      `;
    })
    .join("");

  listContainer.innerHTML = `
    <table class="people-table meetings-table" data-role="meetings-list-items">
      <caption class="visually-hidden">Meeting list</caption>
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Date</th>
          <th scope="col">Type</th>
          <th scope="col">Attendees</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * Renders detail content for the selected meeting.
 *
 * @param {HTMLElement} detailContainer
 * @param {{id: string, title?: string, date?: string, type?: string, attendeeIds?: string[], projectIds?: string[], notes?: string}|null} meeting
 * @param {Map<string, string>} attendeeNamesById
 * @param {Map<string, string>} projectNamesById
 * @param {boolean} isMissingSelection
 */
function renderMeetingDetail(
  detailContainer,
  meeting,
  attendeeNamesById,
  projectNamesById,
  isMissingSelection,
  reviewItems,
  editState
) {
  const selectedMeetingId = meeting?.id ?? "";
  const actionsForMeeting = sortActionsForDisplay(
    reviewItems.actions.filter((action) => action.meetingId === selectedMeetingId)
  );
  const decisionsForMeeting = sortRecordsOldestFirst(
    reviewItems.decisions.filter((decision) => decision.meetingId === selectedMeetingId)
  );
  const updatesForMeeting = sortRecordsOldestFirst(
    reviewItems.updates.filter((update) => update.meetingId === selectedMeetingId)
  );

  const reviewHtml = renderMeetingReviewSectionGroup({
    actionsForMeeting,
    decisionsForMeeting,
    updatesForMeeting,
    peopleById: attendeeNamesById,
    isUnavailable: isMissingSelection || !meeting,
    editState,
  });

  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <article class="project-detail-card" data-role="meeting-detail-card">
        <p class="small-note" data-role="meeting-detail-missing">
          Meeting detail view is unavailable because the selected meeting could not be found.
        </p>
        ${reviewHtml}
      </article>
    `;
    return;
  }

  if (!meeting) {
    detailContainer.innerHTML = `
      <article class="project-detail-card" data-role="meeting-detail-card">
        <p class="small-note" data-role="meeting-detail-empty">
          Select a meeting from the list to view details.
        </p>
        ${reviewHtml}
      </article>
    `;
    return;
  }

  const title = escapeHtml(meeting.title?.trim() || "Untitled meeting");
  const date = escapeHtml(meeting.date?.trim() || "No date");
  const type = escapeHtml(meeting.type?.trim() || "General");
  const notes = escapeHtml(meeting.notes?.trim() || "No notes captured yet.");
  const attendeeNames = (meeting.attendeeIds ?? [])
    .map((attendeeId) => attendeeNamesById.get(attendeeId) || "Unknown person")
    .map((nameValue) => escapeHtml(nameValue));
  const projectNames = (meeting.projectIds ?? [])
    .map((projectId) => projectNamesById.get(projectId) || "Unknown project")
    .map((nameValue) => escapeHtml(nameValue));

  const attendeesHtml =
    attendeeNames.length === 0
      ? `<p class="small-note">No attendees linked yet.</p>`
      : `<ul>${attendeeNames.map((attendeeName) => `<li>${attendeeName}</li>`).join("")}</ul>`;
  const projectsHtml =
    projectNames.length === 0
      ? `<p class="small-note">No linked projects yet.</p>`
      : `<ul>${projectNames.map((projectName) => `<li>${projectName}</li>`).join("")}</ul>`;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="meeting-detail-card">
      <h3>${title}</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Type:</strong> ${type}</p>
      <section aria-label="Meeting attendees">
        <h4>Attendees (${attendeeNames.length})</h4>
        ${attendeesHtml}
      </section>
      <section aria-label="Meeting linked projects">
        <h4>Linked projects (${projectNames.length})</h4>
        ${projectsHtml}
      </section>
      <h4>Notes</h4>
      <p>${notes}</p>
      ${reviewHtml}
    </article>
  `;
}

/**
 * Renders the grouped Meeting Review sections shown under meeting metadata.
 *
 * @param {object} config
 * @param {Array<{id: string, description?: string, status?: string, ownerPersonId?: string, dueDate?: string}>} config.actionsForMeeting
 * @param {Array<{id: string, description?: string, createdAt?: string}>} config.decisionsForMeeting
 * @param {Array<{id: string, description?: string, createdAt?: string}>} config.updatesForMeeting
 * @param {boolean} config.isUnavailable
 * @returns {string}
 */
function renderMeetingReviewSectionGroup({
  actionsForMeeting,
  decisionsForMeeting,
  updatesForMeeting,
  peopleById,
  isUnavailable,
  editState,
}) {
  if (isUnavailable) {
    return `
      <section aria-label="Meeting review">
        <h4>Meeting Review</h4>
        <p class="small-note">Meeting review content appears when a meeting is selected.</p>
      </section>
    `;
  }

  return `
    <section aria-label="Meeting review" data-role="meeting-review">
      <h4>Meeting Review</h4>

      ${renderMeetingReviewTableSection({
        sectionLabel: "Actions",
        emptyMessage: "No linked actions for this meeting.",
        rowHeaders: ["Description", "Status", "Due", "Actions"],
        rowData: actionsForMeeting,
        rowHtmlBuilder: (action) => {
          const isEditing =
            editState.recordType === "action" && editState.recordId === action.id;
          const draft = isEditing ? editState.draft : action;
          const errorText = isEditing ? editState.error : "";
          const description = escapeHtml(draft.description?.trim() || "Untitled action");
          const status = escapeHtml(draft.status?.trim() || "Open");
          const dueDate = escapeHtml(draft.dueDate?.trim() || "No due date");

          const ownerOptions = [
            '<option value="">Unassigned</option>',
            ...[...peopleById.entries()].map(([personId, personName]) => {
              const isSelected = personId === (draft.ownerPersonId || "");
              return `<option value="${escapeHtml(personId)}" ${
                isSelected ? "selected" : ""
              }>${escapeHtml(personName || "Unnamed person")}</option>`;
            }),
          ].join("");

          if (isEditing) {
            return `
              <tr data-role="meeting-review-row" data-record-type="action" data-record-id="${action.id}">
                <td>
                  <label class="visually-hidden" for="meeting-action-description-${action.id}">Action description</label>
                  <input
                    id="meeting-action-description-${action.id}"
                    class="people-input"
                    type="text"
                    value="${escapeHtml(draft.description || "")}"
                    data-role="review-edit-input"
                    data-field="description"
                  />
                </td>
                <td>
                  <label class="visually-hidden" for="meeting-action-status-${action.id}">Action status</label>
                  <input
                    id="meeting-action-status-${action.id}"
                    class="people-input"
                    type="text"
                    value="${escapeHtml(draft.status || "")}" 
                    data-role="review-edit-input"
                    data-field="status"
                  />
                </td>
                <td>
                  <label class="visually-hidden" for="meeting-action-due-${action.id}">Action due date</label>
                  <input
                    id="meeting-action-due-${action.id}"
                    class="people-input"
                    type="text"
                    value="${escapeHtml(draft.dueDate || "")}" 
                    data-role="review-edit-input"
                    data-field="dueDate"
                    placeholder="YYYY-MM-DD"
                  />
                </td>
                <td>
                  <label class="visually-hidden" for="meeting-action-owner-${action.id}">Action owner</label>
                  <select
                    id="meeting-action-owner-${action.id}"
                    class="people-input"
                    data-role="review-edit-input"
                    data-field="ownerPersonId"
                  >
                    ${ownerOptions}
                  </select>
                  <div style="margin-top:0.4rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
                    <button type="button" class="people-button" data-role="review-save" data-record-type="action" data-record-id="${action.id}">Save</button>
                    <button type="button" class="people-button people-button-muted" data-role="review-cancel" data-record-type="action" data-record-id="${action.id}">Cancel</button>
                    <a class="people-button people-button-muted" href="#/actions">Open</a>
                  </div>
                  ${
                    errorText
                      ? `<p class="small-note" style="color:#b03030;" data-role="review-inline-error">${escapeHtml(
                          errorText
                        )}</p>`
                      : ""
                  }
                </td>
              </tr>
            `;
          }

          return `
            <tr data-role="meeting-review-row" data-record-type="action" data-record-id="${action.id}">
              <td>${description}</td>
              <td>${status}</td>
              <td>${dueDate}</td>
              <td>
                <button type="button" class="people-button people-button-muted" data-role="review-edit" data-record-type="action" data-record-id="${action.id}">Edit</button>
                <a class="people-button people-button-muted" href="#/actions">Open</a>
              </td>
            </tr>
          `;
        },
      })}

      ${renderMeetingReviewTableSection({
        sectionLabel: "Decisions",
        emptyMessage: "No linked decisions for this meeting.",
        rowHeaders: ["Statement", "Created", "Actions"],
        rowData: decisionsForMeeting,
        rowHtmlBuilder: (decision) => {
          const isEditing =
            editState.recordType === "decision" && editState.recordId === decision.id;
          const draft = isEditing ? editState.draft : decision;
          const errorText = isEditing ? editState.error : "";
          const description = escapeHtml(draft.description?.trim() || "Untitled decision");
          const createdAt = escapeHtml(decision.createdAt?.trim() || "Unknown");

          if (isEditing) {
            return `
              <tr data-role="meeting-review-row" data-record-type="decision" data-record-id="${decision.id}">
                <td>
                  <label class="visually-hidden" for="meeting-decision-description-${decision.id}">Decision statement</label>
                  <input id="meeting-decision-description-${decision.id}" class="people-input" type="text" value="${escapeHtml(
                    draft.description || ""
                  )}" data-role="review-edit-input" data-field="description" />
                </td>
                <td>${createdAt}</td>
                <td>
                  <button type="button" class="people-button" data-role="review-save" data-record-type="decision" data-record-id="${decision.id}">Save</button>
                  <button type="button" class="people-button people-button-muted" data-role="review-cancel" data-record-type="decision" data-record-id="${decision.id}">Cancel</button>
                  <a class="people-button people-button-muted" href="#/decisions">Open</a>
                  ${
                    errorText
                      ? `<p class="small-note" style="color:#b03030;" data-role="review-inline-error">${escapeHtml(
                          errorText
                        )}</p>`
                      : ""
                  }
                </td>
              </tr>
            `;
          }

          return `
            <tr data-role="meeting-review-row" data-record-type="decision" data-record-id="${decision.id}">
              <td>${description}</td>
              <td>${createdAt}</td>
              <td>
                <button type="button" class="people-button people-button-muted" data-role="review-edit" data-record-type="decision" data-record-id="${decision.id}">Edit</button>
                <a class="people-button people-button-muted" href="#/decisions">Open</a>
              </td>
            </tr>
          `;
        },
      })}

      ${renderMeetingReviewTableSection({
        sectionLabel: "Updates",
        emptyMessage: "No linked updates for this meeting.",
        rowHeaders: ["Description", "Created", "Actions"],
        rowData: updatesForMeeting,
        rowHtmlBuilder: (update) => {
          const isEditing = editState.recordType === "update" && editState.recordId === update.id;
          const draft = isEditing ? editState.draft : update;
          const errorText = isEditing ? editState.error : "";
          const description = escapeHtml(draft.description?.trim() || "Untitled update");
          const createdAt = escapeHtml(update.createdAt?.trim() || "Unknown");

          if (isEditing) {
            return `
              <tr data-role="meeting-review-row" data-record-type="update" data-record-id="${update.id}">
                <td>
                  <label class="visually-hidden" for="meeting-update-description-${update.id}">Update description</label>
                  <input id="meeting-update-description-${update.id}" class="people-input" type="text" value="${escapeHtml(
                    draft.description || ""
                  )}" data-role="review-edit-input" data-field="description" />
                </td>
                <td>${createdAt}</td>
                <td>
                  <button type="button" class="people-button" data-role="review-save" data-record-type="update" data-record-id="${update.id}">Save</button>
                  <button type="button" class="people-button people-button-muted" data-role="review-cancel" data-record-type="update" data-record-id="${update.id}">Cancel</button>
                  <a class="people-button people-button-muted" href="#/updates">Open</a>
                  ${
                    errorText
                      ? `<p class="small-note" style="color:#b03030;" data-role="review-inline-error">${escapeHtml(
                          errorText
                        )}</p>`
                      : ""
                  }
                </td>
              </tr>
            `;
          }

          return `
            <tr data-role="meeting-review-row" data-record-type="update" data-record-id="${update.id}">
              <td>${description}</td>
              <td>${createdAt}</td>
              <td>
                <button type="button" class="people-button people-button-muted" data-role="review-edit" data-record-type="update" data-record-id="${update.id}">Edit</button>
                <a class="people-button people-button-muted" href="#/updates">Open</a>
              </td>
            </tr>
          `;
        },
      })}
    </section>
  `;
}

/**
 * Reusable dense inline table renderer for review sections.
 *
 * @param {object} config
 * @param {string} config.sectionLabel
 * @param {string} config.emptyMessage
 * @param {string[]} config.rowHeaders
 * @param {Array<object>} config.rowData
 * @param {(row: object) => string} config.rowHtmlBuilder
 * @returns {string}
 */
function renderMeetingReviewTableSection({
  sectionLabel,
  emptyMessage,
  rowHeaders,
  rowData,
  rowHtmlBuilder,
}) {
  const safeSectionLabel = escapeHtml(sectionLabel);

  if (rowData.length === 0) {
    return `
      <section aria-label="Meeting review ${safeSectionLabel}">
        <h5>${safeSectionLabel} (0)</h5>
        <p class="small-note">${escapeHtml(emptyMessage)}</p>
      </section>
    `;
  }

  return `
    <section aria-label="Meeting review ${safeSectionLabel}">
      <h5>${safeSectionLabel} (${rowData.length})</h5>
      <table class="people-table meetings-table meetings-review-table">
        <caption class="visually-hidden">${safeSectionLabel} linked to selected meeting</caption>
        <thead>
          <tr>
            ${rowHeaders.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowData.map((row) => rowHtmlBuilder(row)).join("")}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Reads selected meeting id from delegated click events.
 *
 * @param {Event} event
 * @returns {string|null}
 */
function getSelectedMeetingIdFromEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const meetingItem = target.closest('[data-role="meeting-item"]');

  if (!(meetingItem instanceof HTMLButtonElement)) {
    return null;
  }

  return meetingItem.dataset.meetingId ?? null;
}

/**
 * Builds a serializable edit draft from a linked meeting review record.
 *
 * @param {"action"|"decision"|"update"} recordType
 * @param {Record<string, unknown>} record
 * @returns {Record<string, string>}
 */
function getDraftFromRecord(recordType, record) {
  if (recordType === "action") {
    return {
      description: typeof record.description === "string" ? record.description : "",
      status: typeof record.status === "string" ? record.status : "",
      dueDate: typeof record.dueDate === "string" ? record.dueDate : "",
      ownerPersonId: typeof record.ownerPersonId === "string" ? record.ownerPersonId : "",
    };
  }

  return {
    description: typeof record.description === "string" ? record.description : "",
  };
}

/**
 * Returns the in-memory linked record matching the edit type + id.
 *
 * @param {{ actions: Array<object>, decisions: Array<object>, updates: Array<object> }} state
 * @param {"action"|"decision"|"update"} recordType
 * @param {string} recordId
 * @returns {Record<string, unknown>|null}
 */
function findReviewRecord(state, recordType, recordId) {
  if (recordType === "action") {
    return state.actions.find((action) => action.id === recordId) ?? null;
  }

  if (recordType === "decision") {
    return state.decisions.find((decision) => decision.id === recordId) ?? null;
  }

  if (recordType === "update") {
    return state.updates.find((update) => update.id === recordId) ?? null;
  }

  return null;
}

/**
 * Restores focus to a control after re-render to keep keyboard interaction stable.
 *
 * @param {HTMLElement} detailContainer
 * @param {{ role: string, recordType: string, recordId: string }|null} focusTarget
 */
function restoreReviewFocus(detailContainer, focusTarget) {
  if (!focusTarget) {
    return;
  }

  const control = detailContainer.querySelector(
    `[data-role="${focusTarget.role}"][data-record-type="${focusTarget.recordType}"][data-record-id="${focusTarget.recordId}"]`
  );

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

/**
 * Hydrates meetings from storage and re-renders list + detail panels.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {{ selectedMeetingId: string|null, meetings: Array<object> }} config.state
 */
async function refreshMeetingsView({ listContainer, detailContainer, statusText, state }) {
  const [meetings, people, projects, actions, decisions, updates] = await Promise.all([
    listMeetings(),
    listPeople(),
    listProjects(),
    listActions(),
    listDecisions(),
    listUpdates(),
  ]);

  state.meetings = meetings;
  state.peopleById = new Map(people.map((person) => [person.id, person.name]));
  state.projectsById = new Map(projects.map((project) => [project.id, project.name]));
  state.actions = actions;
  state.decisions = decisions;
  state.updates = updates;

  const selectedMeetingInList =
    meetings.find((meeting) => meeting.id === state.selectedMeetingId) ?? null;
  const hadExplicitSelection = Boolean(state.selectedMeetingId);
  let shouldShowMissingSelectionFallback = false;

  // Preserve existing robustness pattern from Projects: default to first item on
  // initial hydration, but show a fallback message if an explicit selection was lost.
  if (!selectedMeetingInList && meetings.length > 0 && !hadExplicitSelection) {
    state.selectedMeetingId = meetings[0].id;
  }

  if (!selectedMeetingInList && hadExplicitSelection) {
    shouldShowMissingSelectionFallback = true;
    state.selectedMeetingId = null;
  }

  const selectedMeeting = state.selectedMeetingId
    ? meetings.find((meeting) => meeting.id === state.selectedMeetingId) ?? null
    : null;

  renderMeetingsList(listContainer, meetings, state.selectedMeetingId);
  renderMeetingDetail(
    detailContainer,
    selectedMeeting,
    state.peopleById,
    state.projectsById,
    shouldShowMissingSelectionFallback,
    {
      actions: state.actions,
      decisions: state.decisions,
      updates: state.updates,
    },
    state.reviewEdit
  );

  if (state.reviewFocusTarget) {
    restoreReviewFocus(detailContainer, state.reviewFocusTarget);
    state.reviewFocusTarget = null;
  }

  statusText.textContent =
    meetings.length === 0
      ? "No meetings stored yet."
      : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"} loaded.`;
}

/**
 * Renders meetings route and wires list/detail interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderMeetingsPage(outlets) {
  renderMeetingsPageFrame(outlets);

  const listContainer = outlets.mainOutlet.querySelector('[data-role="meetings-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="meetings-status"]');
  const newMeetingTrigger = outlets.mainOutlet.querySelector('[data-role="new-meeting-trigger"]');
  const detailContainer = outlets.detailOutlet.querySelector('[data-role="meeting-detail"]');

  // Deterministic mount checks mirror existing route robustness patterns so
  // template regressions fail loudly and predictably during development.
  if (
    !listContainer ||
    !statusText ||
    !detailContainer ||
    !(newMeetingTrigger instanceof HTMLButtonElement)
  ) {
    throw new Error("Meetings page failed to mount required containers.");
  }

  const state = {
    selectedMeetingId: null,
    meetings: [],
    peopleById: new Map(),
    projectsById: new Map(),
    actions: [],
    decisions: [],
    updates: [],
    reviewEdit: {
      recordType: null,
      recordId: null,
      draft: {},
      error: "",
    },
    reviewFocusTarget: null,
  };

  const refreshWithFeedback = async (failureLabel) => {
    try {
      await refreshMeetingsView({ listContainer, detailContainer, statusText, state });
    } catch (error) {
      statusText.textContent = `${failureLabel}: ${error.message}`;
    }
  };

  refreshWithFeedback("Unable to load meetings");

  listContainer.addEventListener("click", (event) => {
    const selectedMeetingId = getSelectedMeetingIdFromEvent(event);

    if (!selectedMeetingId) {
      return;
    }

    state.selectedMeetingId = selectedMeetingId;

    refreshWithFeedback("Unable to load meeting details");
  });

  detailContainer.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.dataset.role !== "review-edit-input") {
      return;
    }

    const fieldName = target.dataset.field;

    if (!fieldName || !state.reviewEdit.recordId) {
      return;
    }

    state.reviewEdit.draft = {
      ...state.reviewEdit.draft,
      [fieldName]: target.value,
    };

    if (fieldName === "description" && target.value.trim()) {
      state.reviewEdit.error = "";
    }
  });

  detailContainer.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) {
      return;
    }

    if (event.target.dataset.role !== "review-edit-input") {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    const saveButton = detailContainer.querySelector(
      `[data-role="review-save"][data-record-type="${state.reviewEdit.recordType}"][data-record-id="${state.reviewEdit.recordId}"]`
    );

    if (saveButton instanceof HTMLButtonElement) {
      saveButton.click();
      event.preventDefault();
    }
  });

  detailContainer.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const editButton = target.closest('[data-role="review-edit"]');

    if (editButton instanceof HTMLButtonElement) {
      const recordType = editButton.dataset.recordType;
      const recordId = editButton.dataset.recordId;

      if (
        (recordType !== "action" && recordType !== "decision" && recordType !== "update") ||
        !recordId
      ) {
        return;
      }

      const record = findReviewRecord(state, recordType, recordId);

      if (!record) {
        statusText.textContent = "Unable to start edit mode: linked record no longer exists.";
        return;
      }

      state.reviewEdit = {
        recordType,
        recordId,
        draft: getDraftFromRecord(recordType, record),
        error: "",
      };

      refreshWithFeedback("Unable to render edit mode");
      return;
    }

    const cancelButton = target.closest('[data-role="review-cancel"]');

    if (cancelButton instanceof HTMLButtonElement) {
      const recordType = cancelButton.dataset.recordType;
      const recordId = cancelButton.dataset.recordId;

      state.reviewEdit = {
        recordType: null,
        recordId: null,
        draft: {},
        error: "",
      };
      state.reviewFocusTarget =
        recordType && recordId
          ? { role: "review-edit", recordType, recordId }
          : null;

      refreshWithFeedback("Unable to cancel edit mode");
      return;
    }

    const saveButton = target.closest('[data-role="review-save"]');

    if (!(saveButton instanceof HTMLButtonElement)) {
      return;
    }

    const recordType = saveButton.dataset.recordType;
    const recordId = saveButton.dataset.recordId;

    if ((recordType !== "action" && recordType !== "decision" && recordType !== "update") || !recordId) {
      return;
    }

    const description = typeof state.reviewEdit.draft.description === "string"
      ? state.reviewEdit.draft.description.trim()
      : "";

    if (!description) {
      state.reviewEdit.error = "Description is required.";
      refreshWithFeedback("Unable to save linked record");
      return;
    }

    const persistUpdate = async () => {
      if (recordType === "action") {
        await updateAction(recordId, {
          description,
          status: typeof state.reviewEdit.draft.status === "string" ? state.reviewEdit.draft.status : "",
          dueDate:
            typeof state.reviewEdit.draft.dueDate === "string" ? state.reviewEdit.draft.dueDate : "",
          ownerPersonId:
            typeof state.reviewEdit.draft.ownerPersonId === "string"
              ? state.reviewEdit.draft.ownerPersonId
              : "",
        });
        return;
      }

      if (recordType === "decision") {
        await updateDecision(recordId, { description });
        return;
      }

      await updateUpdate(recordId, { description });
    };

    persistUpdate()
      .then(async () => {
        state.reviewEdit = {
          recordType: null,
          recordId: null,
          draft: {},
          error: "",
        };
        state.reviewFocusTarget = { role: "review-edit", recordType, recordId };

        await refreshMeetingsView({ listContainer, detailContainer, statusText, state });
        statusText.textContent = "Linked record updated.";
      })
      .catch(async (error) => {
        state.reviewEdit.error = error.message;
        await refreshMeetingsView({ listContainer, detailContainer, statusText, state });
        statusText.textContent = `Unable to save linked record: ${error.message}`;
      });
  });

  // Keyboard behavior mirrors the Projects list: Arrow keys move focus row-to-row,
  // while Enter/Space commits selection for the focused meeting item.
  listContainer.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) {
      return;
    }

    const meetingId = event.target.dataset.meetingId;

    if (!meetingId) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      state.selectedMeetingId = meetingId;

      refreshWithFeedback("Unable to load meeting details");

      event.preventDefault();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const buttons = [...listContainer.querySelectorAll('[data-role="meeting-item"]')].filter(
      (element) => element instanceof HTMLButtonElement
    );

    const currentIndex = buttons.indexOf(event.target);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex =
      event.key === "ArrowDown"
        ? Math.min(buttons.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    buttons[nextIndex]?.focus();
    event.preventDefault();
  });

  newMeetingTrigger.addEventListener("click", () => {
    openNewMeetingModal({
      onRehydrate: async () => {
        await refreshMeetingsView({ listContainer, detailContainer, statusText, state });
      },
    }).catch((error) => {
      statusText.textContent = `Unable to open New Meeting modal: ${error.message}`;
    });
  });

  // Keep Meeting Review sections current when linked entities mutate on other routes.
  const linkedRecordRefreshEvents = [
    "programmeos:actions-changed",
    "programmeos:decisions-changed",
    "programmeos:updates-changed",
  ];

  const handleLinkedRecordChange = () => {
    refreshWithFeedback("Unable to refresh linked meeting review");
  };

  for (const eventName of linkedRecordRefreshEvents) {
    window.addEventListener(eventName, handleLinkedRecordChange);
  }
}
