import { renderPageFrame } from "../../layout.js";
import { listActions } from "../actions/data.js";
import { listDecisions } from "../decisions/data.js";
import { listPeople } from "../people/data.js";
import { listProjects } from "../projects/data.js";
import { listUpdates } from "../updates/data.js";
import { listMeetings } from "./data.js";
import { openNewMeetingModal } from "./new-meeting-modal.js";

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
  reviewItems
) {
  const selectedMeetingId = meeting?.id ?? "";
  const actionsForMeeting = reviewItems.actions.filter((action) => action.meetingId === selectedMeetingId);
  const decisionsForMeeting = reviewItems.decisions.filter(
    (decision) => decision.meetingId === selectedMeetingId
  );
  const updatesForMeeting = reviewItems.updates.filter((update) => update.meetingId === selectedMeetingId);

  const reviewHtml = renderMeetingReviewSectionGroup({
    actionsForMeeting,
    decisionsForMeeting,
    updatesForMeeting,
    isUnavailable: isMissingSelection || !meeting,
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
  isUnavailable,
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
          const description = escapeHtml(action.description?.trim() || "Untitled action");
          const status = escapeHtml(action.status?.trim() || "Open");
          const dueDate = escapeHtml(action.dueDate?.trim() || "No due date");

          return `
            <tr>
              <td>${description}</td>
              <td>${status}</td>
              <td>${dueDate}</td>
              <td>
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
          const description = escapeHtml(decision.description?.trim() || "Untitled decision");
          const createdAt = escapeHtml(decision.createdAt?.trim() || "Unknown");

          return `
            <tr>
              <td>${description}</td>
              <td>${createdAt}</td>
              <td>
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
          const description = escapeHtml(update.description?.trim() || "Untitled update");
          const createdAt = escapeHtml(update.createdAt?.trim() || "Unknown");

          return `
            <tr>
              <td>${description}</td>
              <td>${createdAt}</td>
              <td>
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
    }
  );

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
