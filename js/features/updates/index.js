import { renderPageFrame } from "../../layout.js";
import { listMeetings } from "../meetings/data.js";
import { listProjects } from "../projects/data.js";
import { listUpdates } from "./data.js";
import { openNewUpdateModal } from "./new-update-modal.js";

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
 * Renders static frame for the updates route.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderUpdatesPageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "Updates",
    bodyHtml: `
      <section class="updates-page" aria-label="Updates management">
        <section class="people-toolbar" aria-label="Update actions">
          <button class="people-button" type="button" data-role="new-update-trigger">New Update</button>
          <p class="small-note" data-role="updates-status" aria-live="polite"></p>
        </section>

        <section class="updates-list" data-role="updates-list" aria-label="Update records"></section>
      </section>
    `,
    detailHtml: `
      <section data-role="update-detail" aria-label="Update detail panel">
        <p class="small-note" data-role="update-detail-empty">
          Select an update to view details.
        </p>
      </section>
    `,
  });
}

/**
 * @param {HTMLElement} listContainer
 * @param {Array<{id: string, description?: string, meetingId?: string, projectIds?: string[]}>} updates
 * @param {Map<string, string>} meetingsById
 * @param {string|null} selectedUpdateId
 */
function renderUpdatesList(listContainer, updates, meetingsById, selectedUpdateId) {
  if (updates.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="updates-empty-state">
        No updates have been captured yet. Use New Update to record the first update.
      </p>
    `;
    return;
  }

  const rowsHtml = updates
    .map((update) => {
      const description = escapeHtml(update.description?.trim() || "Untitled update");
      const meetingLabel = update.meetingId
        ? escapeHtml(meetingsById.get(update.meetingId) || "Unknown meeting")
        : "Not linked";
      const projectCount = update.projectIds?.length ?? 0;
      const isSelected = update.id === selectedUpdateId;

      return `
        <tr data-role="update-row" data-update-id="${update.id}" aria-selected="${
          isSelected ? "true" : "false"
        }" class="${isSelected ? "is-selected" : ""}">
          <td>
            <button
              class="projects-list-item"
              type="button"
              data-role="update-item"
              data-update-id="${update.id}"
              aria-pressed="${isSelected ? "true" : "false"}"
            >
              ${description}
            </button>
          </td>
          <td>${meetingLabel}</td>
          <td>${projectCount}</td>
        </tr>
      `;
    })
    .join("");

  listContainer.innerHTML = `
    <table class="people-table updates-table" data-role="updates-list-items">
      <caption class="visually-hidden">Update list</caption>
      <thead>
        <tr>
          <th scope="col">Description</th>
          <th scope="col">Meeting</th>
          <th scope="col">Projects</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * @param {HTMLElement} detailContainer
 * @param {{id: string, description?: string, meetingId?: string, projectIds?: string[]}|null} update
 * @param {Map<string, string>} meetingsById
 * @param {Map<string, string>} projectsById
 * @param {boolean} isMissingSelection
 */
function renderUpdateDetail(
  detailContainer,
  update,
  meetingsById,
  projectsById,
  isMissingSelection
) {
  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="update-detail-missing">
        Update detail view is unavailable because the selected update could not be found.
      </p>
    `;
    return;
  }

  if (!update) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="update-detail-empty">
        Select an update from the list to view details.
      </p>
    `;
    return;
  }

  const description = escapeHtml(update.description?.trim() || "Untitled update");
  const meetingLabel = update.meetingId
    ? escapeHtml(meetingsById.get(update.meetingId) || "Unknown meeting")
    : "Not linked";
  const linkedProjects = (update.projectIds ?? [])
    .map((projectId) => projectsById.get(projectId) || "Unknown project")
    .map((projectName) => escapeHtml(projectName));
  const projectsHtml =
    linkedProjects.length === 0
      ? `<p class="small-note">No linked projects yet.</p>`
      : `<ul>${linkedProjects.map((projectName) => `<li>${projectName}</li>`).join("")}</ul>`;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="update-detail-card">
      <h3>${description}</h3>
      <p><strong>Meeting link:</strong> ${meetingLabel}</p>
      <section aria-label="Update linked projects">
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
function getSelectedUpdateIdFromEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const updateItem = target.closest('[data-role="update-item"]');

  if (!(updateItem instanceof HTMLButtonElement)) {
    return null;
  }

  return updateItem.dataset.updateId ?? null;
}

/**
 * Hydrates updates from storage and re-renders list + detail.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {{selectedUpdateId: string|null, updates: Array<object>, meetingsById: Map<string,string>, projectsById: Map<string,string>}} config.state
 */
async function refreshUpdatesView({ listContainer, detailContainer, statusText, state }) {
  const [updates, meetings, projects] = await Promise.all([
    listUpdates(),
    listMeetings(),
    listProjects(),
  ]);

  state.updates = updates;
  state.meetingsById = new Map(meetings.map((meeting) => [meeting.id, meeting.title]));
  state.projectsById = new Map(projects.map((project) => [project.id, project.name]));

  const selectedUpdateInList = updates.find((update) => update.id === state.selectedUpdateId) ?? null;
  const hadExplicitSelection = Boolean(state.selectedUpdateId);
  let shouldShowMissingSelectionFallback = false;

  // Preserve predictable selection behavior: first-load auto-select, but
  // stale explicit selections should render a user-visible missing-state message.
  if (!selectedUpdateInList && updates.length > 0 && !hadExplicitSelection) {
    state.selectedUpdateId = updates[0].id;
  }

  if (!selectedUpdateInList && hadExplicitSelection) {
    shouldShowMissingSelectionFallback = true;
    state.selectedUpdateId = null;
  }

  const selectedUpdate = state.selectedUpdateId
    ? updates.find((update) => update.id === state.selectedUpdateId) ?? null
    : null;

  renderUpdatesList(listContainer, updates, state.meetingsById, state.selectedUpdateId);
  renderUpdateDetail(
    detailContainer,
    selectedUpdate,
    state.meetingsById,
    state.projectsById,
    shouldShowMissingSelectionFallback
  );

  statusText.textContent =
    updates.length === 0
      ? "No updates stored yet."
      : `${updates.length} update${updates.length === 1 ? "" : "s"} loaded.`;
}

/**
 * Renders updates route and wires list/detail + modal interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderUpdatesPage(outlets) {
  renderUpdatesPageFrame(outlets);

  const listContainer = outlets.mainOutlet.querySelector('[data-role="updates-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="updates-status"]');
  const newUpdateTrigger = outlets.mainOutlet.querySelector('[data-role="new-update-trigger"]');
  const detailContainer = outlets.detailOutlet.querySelector('[data-role="update-detail"]');

  if (
    !listContainer ||
    !statusText ||
    !detailContainer ||
    !(newUpdateTrigger instanceof HTMLButtonElement)
  ) {
    throw new Error("Updates page failed to mount required containers.");
  }

  const state = {
    selectedUpdateId: null,
    updates: [],
    meetingsById: new Map(),
    projectsById: new Map(),
  };

  refreshUpdatesView({ listContainer, detailContainer, statusText, state }).catch((error) => {
    statusText.textContent = `Unable to load updates: ${error.message}`;
  });

  listContainer.addEventListener("click", (event) => {
    const selectedUpdateId = getSelectedUpdateIdFromEvent(event);

    if (!selectedUpdateId) {
      return;
    }

    state.selectedUpdateId = selectedUpdateId;

    refreshUpdatesView({ listContainer, detailContainer, statusText, state }).catch((error) => {
      statusText.textContent = `Unable to load update details: ${error.message}`;
    });
  });

  newUpdateTrigger.addEventListener("click", () => {
    openNewUpdateModal({
      onRehydrate: async (createdUpdate) => {
        state.selectedUpdateId = createdUpdate.id;
        await refreshUpdatesView({ listContainer, detailContainer, statusText, state });
        statusText.textContent = "Update created successfully.";
      },
    }).catch((error) => {
      statusText.textContent = `Unable to open New Update modal: ${error.message}`;
    });
  });
}
