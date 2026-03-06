import { renderPageFrame } from "../../layout.js";
import { listMeetings } from "../meetings/data.js";
import { listPeople } from "../people/data.js";
import { listProjects } from "../projects/data.js";
import { listActions, updateAction } from "./data.js";
import { openNewActionModal } from "./new-action-modal.js";

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
 * Renders static frame for the actions route.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderActionsPageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "Actions",
    bodyHtml: `
      <section class="actions-page" aria-label="Actions management">
        <section class="people-toolbar" aria-label="Action actions">
          <button class="people-button" type="button" data-role="new-action-trigger">New Action</button>
          <label class="visually-hidden" for="actions-meeting-filter">Filter actions by meeting</label>
          <select id="actions-meeting-filter" class="people-input" data-role="actions-meeting-filter"></select>
          <p class="small-note" data-role="actions-status" aria-live="polite"></p>
        </section>

        <section class="actions-list" data-role="actions-list" aria-label="Actions records"></section>
      </section>
    `,
    detailHtml: `
      <section data-role="action-detail" aria-label="Action detail panel">
        <p class="small-note" data-role="action-detail-empty">
          Select an action to view details.
        </p>
      </section>
    `,
  });
}

/**
 * @param {HTMLSelectElement} filterSelect
 * @param {Array<{id: string, title?: string}>} meetings
 * @param {string} selectedMeetingFilter
 */
function renderMeetingFilterOptions(filterSelect, meetings, selectedMeetingFilter) {
  const options = [
    '<option value="">All meetings</option>',
    ...meetings.map((meeting) => {
      const title = escapeHtml(meeting.title?.trim() || "Untitled meeting");
      return `<option value="${meeting.id}">${title}</option>`;
    }),
  ].join("");

  filterSelect.innerHTML = options;
  filterSelect.value = selectedMeetingFilter;

  if (filterSelect.value !== selectedMeetingFilter) {
    filterSelect.value = "";
  }
}

/**
 * @param {number} totalCount
 * @param {number} filteredCount
 * @param {boolean} isFilterActive
 * @returns {string}
 */
function getActionsStatusText(totalCount, filteredCount, isFilterActive) {
  const label = `${filteredCount} action${filteredCount === 1 ? "" : "s"}`;

  if (totalCount === 0) {
    return "No actions stored yet.";
  }

  if (!isFilterActive) {
    return `${label} loaded.`;
  }

  return `${label} shown (filtered by meeting, ${totalCount} total).`;
}

/**
 * @param {HTMLElement} listContainer
 * @param {Array<{id: string, description?: string, status?: string, dueDate?: string, ownerPersonId?: string}>} actions
 * @param {Map<string, string>} peopleById
 * @param {string|null} selectedActionId
 */
function renderActionsList(listContainer, actions, peopleById, selectedActionId) {
  if (actions.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="actions-empty-state">
        No actions have been captured yet. Use New Action to add the first follow-up.
      </p>
    `;
    return;
  }

  const rowsHtml = actions
    .map((action) => {
      const description = escapeHtml(action.description?.trim() || "Untitled action");
      const status = escapeHtml(action.status?.trim() || "Open");
      const dueDate = escapeHtml(action.dueDate?.trim() || "No due date");
      const owner = action.ownerPersonId
        ? escapeHtml(peopleById.get(action.ownerPersonId) || "Unknown person")
        : "Unassigned";
      const isSelected = action.id === selectedActionId;

      return `
        <tr data-role="action-row" data-action-id="${action.id}" aria-selected="${
          isSelected ? "true" : "false"
        }" class="${isSelected ? "is-selected" : ""}">
          <td>
            <button
              class="projects-list-item"
              type="button"
              data-role="action-item"
              data-action-id="${action.id}"
              aria-pressed="${isSelected ? "true" : "false"}"
            >
              ${description}
            </button>
          </td>
          <td>${status}</td>
          <td>${dueDate}</td>
          <td>${owner}</td>
        </tr>
      `;
    })
    .join("");

  listContainer.innerHTML = `
    <table class="people-table actions-table" data-role="actions-list-items">
      <caption class="visually-hidden">Action list</caption>
      <thead>
        <tr>
          <th scope="col">Description</th>
          <th scope="col">Status</th>
          <th scope="col">Due</th>
          <th scope="col">Owner</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * @param {HTMLElement} detailContainer
 * @param {{id: string, description?: string, status?: string, dueDate?: string, ownerPersonId?: string, meetingId?: string, projectIds?: string[]}|null} action
 * @param {Map<string, string>} peopleById
 * @param {Map<string, string>} projectsById
 * @param {boolean} isMissingSelection
 */
function renderActionDetail(detailContainer, action, peopleById, projectsById, isMissingSelection) {
  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="action-detail-missing">
        Action detail view is unavailable because the selected action could not be found.
      </p>
    `;
    return;
  }

  if (!action) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="action-detail-empty">
        Select an action from the list to view details.
      </p>
    `;
    return;
  }

  const description = escapeHtml(action.description?.trim() || "Untitled action");
  const status = escapeHtml(action.status?.trim() || "Open");
  const dueDate = escapeHtml(action.dueDate?.trim() || "No due date set");
  const ownerName = action.ownerPersonId
    ? escapeHtml(peopleById.get(action.ownerPersonId) || "Unknown person")
    : "Unassigned";
  const meetingLabel = action.meetingId
    ? escapeHtml(action.meetingId)
    : "Not linked";
  const linkedProjects = (action.projectIds ?? [])
    .map((projectId) => projectsById.get(projectId) || "Unknown project")
    .map((projectName) => escapeHtml(projectName));
  const projectsHtml =
    linkedProjects.length === 0
      ? `<p class="small-note">No linked projects yet.</p>`
      : `<ul>${linkedProjects.map((projectName) => `<li>${projectName}</li>`).join("")}</ul>`;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="action-detail-card">
      <h3>${description}</h3>
      <div class="modal-actions" aria-label="Action quick actions">
        <button
          class="people-button people-button-muted"
          type="button"
          data-role="action-toggle-status-trigger"
          data-action-id="${action.id}"
        >
          ${status.toLowerCase() === "done" ? "Mark Open" : "Mark Done"}
        </button>
      </div>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Due date:</strong> ${dueDate}</p>
      <p><strong>Owner:</strong> ${ownerName}</p>
      <p><strong>Meeting link:</strong> ${meetingLabel}</p>
      <section aria-label="Action linked projects">
        <h4>Linked projects (${linkedProjects.length})</h4>
        ${projectsHtml}
      </section>
    </article>
  `;
}

/**
 * @param {Event} event
 * @returns {string|null}
 */
function getSelectedActionIdFromEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const actionItem = target.closest('[data-role="action-item"]');

  if (!(actionItem instanceof HTMLButtonElement)) {
    return null;
  }

  return actionItem.dataset.actionId ?? null;
}

/**
 * Hydrates actions from storage and re-renders list + detail.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {HTMLSelectElement} config.meetingFilterSelect
 * @param {{selectedActionId: string|null, selectedMeetingFilter: string, actions: Array<object>, peopleById: Map<string,string>, projectsById: Map<string,string>}} config.state
 */
async function refreshActionsView({
  listContainer,
  detailContainer,
  statusText,
  meetingFilterSelect,
  state,
}) {
  const [actions, meetings, people, projects] = await Promise.all([
    listActions(),
    listMeetings(),
    listPeople(),
    listProjects(),
  ]);

  state.actions = actions;
  state.peopleById = new Map(people.map((person) => [person.id, person.name]));
  state.projectsById = new Map(projects.map((project) => [project.id, project.name]));
  renderMeetingFilterOptions(meetingFilterSelect, meetings, state.selectedMeetingFilter);

  const isFilterActive = Boolean(state.selectedMeetingFilter);
  const visibleActions = isFilterActive
    ? actions.filter((action) => action.meetingId === state.selectedMeetingFilter)
    : actions;

  const selectedActionInList =
    visibleActions.find((action) => action.id === state.selectedActionId) ?? null;
  const hadExplicitSelection = Boolean(state.selectedActionId);
  let shouldShowMissingSelectionFallback = false;

  if (!selectedActionInList && visibleActions.length > 0 && !hadExplicitSelection) {
    state.selectedActionId = visibleActions[0].id;
  }

  if (!selectedActionInList && hadExplicitSelection) {
    shouldShowMissingSelectionFallback = true;
    state.selectedActionId = null;
  }

  const selectedAction = state.selectedActionId
    ? visibleActions.find((action) => action.id === state.selectedActionId) ?? null
    : null;

  renderActionsList(listContainer, visibleActions, state.peopleById, state.selectedActionId);
  renderActionDetail(
    detailContainer,
    selectedAction,
    state.peopleById,
    state.projectsById,
    shouldShowMissingSelectionFallback
  );

  statusText.textContent = getActionsStatusText(actions.length, visibleActions.length, isFilterActive);
}

/**
 * Renders actions route and wires list/detail + modal interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderActionsPage(outlets) {
  renderActionsPageFrame(outlets);

  const listContainer = outlets.mainOutlet.querySelector('[data-role="actions-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="actions-status"]');
  const meetingFilterSelect = outlets.mainOutlet.querySelector('[data-role="actions-meeting-filter"]');
  const newActionTrigger = outlets.mainOutlet.querySelector('[data-role="new-action-trigger"]');
  const detailContainer = outlets.detailOutlet.querySelector('[data-role="action-detail"]');

  if (
    !listContainer ||
    !statusText ||
    !detailContainer ||
    !(meetingFilterSelect instanceof HTMLSelectElement) ||
    !(newActionTrigger instanceof HTMLButtonElement)
  ) {
    throw new Error("Actions page failed to mount required containers.");
  }

  const state = {
    selectedActionId: null,
    selectedMeetingFilter: "",
    actions: [],
    peopleById: new Map(),
    projectsById: new Map(),
  };

  refreshActionsView({ listContainer, detailContainer, statusText, meetingFilterSelect, state }).catch((error) => {
    statusText.textContent = `Unable to load actions: ${error.message}`;
  });

  meetingFilterSelect.addEventListener("change", () => {
    state.selectedMeetingFilter = meetingFilterSelect.value;

    refreshActionsView({ listContainer, detailContainer, statusText, meetingFilterSelect, state }).catch(
      (error) => {
        statusText.textContent = `Unable to apply actions meeting filter: ${error.message}`;
      }
    );
  });

  listContainer.addEventListener("click", (event) => {
    const selectedActionId = getSelectedActionIdFromEvent(event);

    if (!selectedActionId) {
      return;
    }

    state.selectedActionId = selectedActionId;

    refreshActionsView({ listContainer, detailContainer, statusText, meetingFilterSelect, state }).catch((error) => {
      statusText.textContent = `Unable to load action details: ${error.message}`;
    });
  });

  detailContainer.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    if (target.dataset.role !== "action-toggle-status-trigger") {
      return;
    }

    const actionId = target.dataset.actionId;

    if (!actionId) {
      return;
    }

    const action = state.actions.find((record) => record.id === actionId);

    if (!action) {
      statusText.textContent = "Unable to update action: selected action was not found.";
      return;
    }

    const nextStatus = action.status?.trim().toLowerCase() === "done" ? "Open" : "Done";

    updateAction(actionId, { status: nextStatus })
      .then(async () => {
        statusText.textContent = `Action updated (${nextStatus}).`;
        await refreshActionsView({ listContainer, detailContainer, statusText, meetingFilterSelect, state });
      })
      .catch((error) => {
        statusText.textContent = `Unable to update action: ${error.message}`;
      });
  });

  newActionTrigger.addEventListener("click", () => {
    openNewActionModal({
      onRehydrate: async (createdAction) => {
        state.selectedActionId = createdAction.id;
        await refreshActionsView({ listContainer, detailContainer, statusText, meetingFilterSelect, state });
        statusText.textContent = "Action created successfully.";
      },
    }).catch((error) => {
      statusText.textContent = `Unable to open New Action modal: ${error.message}`;
    });
  });
}
