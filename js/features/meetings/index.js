import { renderPageFrame } from "../../layout.js";
import { listMeetings } from "./data.js";

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
 * @param {{id: string, title?: string, date?: string, type?: string, attendeeIds?: string[], notes?: string}|null} meeting
 * @param {boolean} isMissingSelection
 */
function renderMeetingDetail(detailContainer, meeting, isMissingSelection) {
  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="meeting-detail-missing">
        Meeting detail view is unavailable because the selected meeting could not be found.
      </p>
    `;
    return;
  }

  if (!meeting) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="meeting-detail-empty">
        Select a meeting from the list to view details.
      </p>
    `;
    return;
  }

  const title = escapeHtml(meeting.title?.trim() || "Untitled meeting");
  const date = escapeHtml(meeting.date?.trim() || "No date");
  const type = escapeHtml(meeting.type?.trim() || "General");
  const notes = escapeHtml(meeting.notes?.trim() || "No notes captured yet.");
  const attendeeCount = meeting.attendeeIds?.length ?? 0;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="meeting-detail-card">
      <h3>${title}</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Attendees:</strong> ${attendeeCount}</p>
      <p>${notes}</p>
    </article>
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
 * Hydrates meetings from storage and re-renders list + detail panels.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {{ selectedMeetingId: string|null, meetings: Array<object> }} config.state
 */
async function refreshMeetingsView({ listContainer, detailContainer, statusText, state }) {
  const meetings = await listMeetings();

  state.meetings = meetings;

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
  renderMeetingDetail(detailContainer, selectedMeeting, shouldShowMissingSelectionFallback);

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
  };

  refreshMeetingsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
    statusText.textContent = `Unable to load meetings: ${error.message}`;
  });

  listContainer.addEventListener("click", (event) => {
    const selectedMeetingId = getSelectedMeetingIdFromEvent(event);

    if (!selectedMeetingId) {
      return;
    }

    state.selectedMeetingId = selectedMeetingId;

    refreshMeetingsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
      statusText.textContent = `Unable to load meeting details: ${error.message}`;
    });
  });

  newMeetingTrigger.addEventListener("click", () => {
    statusText.textContent = "New Meeting flow will be wired in a follow-up milestone.";
  });
}
