import { renderPageFrame } from "../../layout.js";
import { listMeetings } from "../meetings/data.js";
import { listProjects } from "../projects/data.js";
import { listDecisions } from "./data.js";
import { openNewDecisionModal } from "./new-decision-modal.js";

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
 * Renders static frame for the decisions route.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderDecisionsPageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "Decisions",
    bodyHtml: `
      <section class="decisions-page" aria-label="Decisions management">
        <section class="people-toolbar" aria-label="Decision actions">
          <button class="people-button" type="button" data-role="new-decision-trigger">New Decision</button>
          <p class="small-note" data-role="decisions-status" aria-live="polite"></p>
        </section>

        <section class="decisions-list" data-role="decisions-list" aria-label="Decisions records"></section>
      </section>
    `,
    detailHtml: `
      <section data-role="decision-detail" aria-label="Decision detail panel">
        <p class="small-note" data-role="decision-detail-empty">
          Select a decision to view details.
        </p>
      </section>
    `,
  });
}

/**
 * @param {HTMLElement} listContainer
 * @param {Array<{id: string, description?: string, meetingId?: string, projectIds?: string[]}>} decisions
 * @param {Map<string, string>} meetingsById
 * @param {string|null} selectedDecisionId
 */
function renderDecisionsList(listContainer, decisions, meetingsById, selectedDecisionId) {
  if (decisions.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="decisions-empty-state">
        No decisions have been captured yet. Use New Decision to record the first decision.
      </p>
    `;
    return;
  }

  const rowsHtml = decisions
    .map((decision) => {
      const description = escapeHtml(decision.description?.trim() || "Untitled decision");
      const meetingLabel = decision.meetingId
        ? escapeHtml(meetingsById.get(decision.meetingId) || "Unknown meeting")
        : "Not linked";
      const projectCount = decision.projectIds?.length ?? 0;
      const isSelected = decision.id === selectedDecisionId;

      return `
        <tr data-role="decision-row" data-decision-id="${decision.id}" aria-selected="${
          isSelected ? "true" : "false"
        }" class="${isSelected ? "is-selected" : ""}">
          <td>
            <button
              class="projects-list-item"
              type="button"
              data-role="decision-item"
              data-decision-id="${decision.id}"
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
    <table class="people-table decisions-table" data-role="decisions-list-items">
      <caption class="visually-hidden">Decision list</caption>
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
 * @param {{id: string, description?: string, meetingId?: string, projectIds?: string[]}|null} decision
 * @param {Map<string, string>} meetingsById
 * @param {Map<string, string>} projectsById
 * @param {boolean} isMissingSelection
 */
function renderDecisionDetail(
  detailContainer,
  decision,
  meetingsById,
  projectsById,
  isMissingSelection
) {
  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="decision-detail-missing">
        Decision detail view is unavailable because the selected decision could not be found.
      </p>
    `;
    return;
  }

  if (!decision) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="decision-detail-empty">
        Select a decision from the list to view details.
      </p>
    `;
    return;
  }

  const description = escapeHtml(decision.description?.trim() || "Untitled decision");
  const meetingLabel = decision.meetingId
    ? escapeHtml(meetingsById.get(decision.meetingId) || "Unknown meeting")
    : "Not linked";
  const linkedProjects = (decision.projectIds ?? [])
    .map((projectId) => projectsById.get(projectId) || "Unknown project")
    .map((projectName) => escapeHtml(projectName));
  const projectsHtml =
    linkedProjects.length === 0
      ? `<p class="small-note">No linked projects yet.</p>`
      : `<ul>${linkedProjects.map((projectName) => `<li>${projectName}</li>`).join("")}</ul>`;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="decision-detail-card">
      <h3>${description}</h3>
      <p><strong>Meeting link:</strong> ${meetingLabel}</p>
      <section aria-label="Decision linked projects">
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
function getSelectedDecisionIdFromEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const decisionItem = target.closest('[data-role="decision-item"]');

  if (!(decisionItem instanceof HTMLButtonElement)) {
    return null;
  }

  return decisionItem.dataset.decisionId ?? null;
}

/**
 * Hydrates decisions from storage and re-renders list + detail.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {{selectedDecisionId: string|null, decisions: Array<object>, meetingsById: Map<string,string>, projectsById: Map<string,string>}} config.state
 */
async function refreshDecisionsView({ listContainer, detailContainer, statusText, state }) {
  const [decisions, meetings, projects] = await Promise.all([
    listDecisions(),
    listMeetings(),
    listProjects(),
  ]);

  state.decisions = decisions;
  state.meetingsById = new Map(meetings.map((meeting) => [meeting.id, meeting.title]));
  state.projectsById = new Map(projects.map((project) => [project.id, project.name]));

  const selectedDecisionInList =
    decisions.find((decision) => decision.id === state.selectedDecisionId) ?? null;
  const hadExplicitSelection = Boolean(state.selectedDecisionId);
  let shouldShowMissingSelectionFallback = false;

  // Mirror Projects/Meetings defensive behavior: auto-select only on first load,
  // but show missing-selection feedback if an explicit selection goes stale.
  if (!selectedDecisionInList && decisions.length > 0 && !hadExplicitSelection) {
    state.selectedDecisionId = decisions[0].id;
  }

  if (!selectedDecisionInList && hadExplicitSelection) {
    shouldShowMissingSelectionFallback = true;
    state.selectedDecisionId = null;
  }

  const selectedDecision = state.selectedDecisionId
    ? decisions.find((decision) => decision.id === state.selectedDecisionId) ?? null
    : null;

  renderDecisionsList(listContainer, decisions, state.meetingsById, state.selectedDecisionId);
  renderDecisionDetail(
    detailContainer,
    selectedDecision,
    state.meetingsById,
    state.projectsById,
    shouldShowMissingSelectionFallback
  );

  statusText.textContent =
    decisions.length === 0
      ? "No decisions stored yet."
      : `${decisions.length} decision${decisions.length === 1 ? "" : "s"} loaded.`;
}

/**
 * Renders decisions route and wires list/detail + modal interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderDecisionsPage(outlets) {
  renderDecisionsPageFrame(outlets);

  const listContainer = outlets.mainOutlet.querySelector('[data-role="decisions-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="decisions-status"]');
  const newDecisionTrigger = outlets.mainOutlet.querySelector('[data-role="new-decision-trigger"]');
  const detailContainer = outlets.detailOutlet.querySelector('[data-role="decision-detail"]');

  if (
    !listContainer ||
    !statusText ||
    !detailContainer ||
    !(newDecisionTrigger instanceof HTMLButtonElement)
  ) {
    throw new Error("Decisions page failed to mount required containers.");
  }

  const state = {
    selectedDecisionId: null,
    decisions: [],
    meetingsById: new Map(),
    projectsById: new Map(),
  };

  refreshDecisionsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
    statusText.textContent = `Unable to load decisions: ${error.message}`;
  });

  listContainer.addEventListener("click", (event) => {
    const selectedDecisionId = getSelectedDecisionIdFromEvent(event);

    if (!selectedDecisionId) {
      return;
    }

    state.selectedDecisionId = selectedDecisionId;

    refreshDecisionsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
      statusText.textContent = `Unable to load decision details: ${error.message}`;
    });
  });

  newDecisionTrigger.addEventListener("click", () => {
    openNewDecisionModal({
      onRehydrate: async (createdDecision) => {
        state.selectedDecisionId = createdDecision.id;
        await refreshDecisionsView({ listContainer, detailContainer, statusText, state });
        statusText.textContent = "Decision created successfully.";
      },
    }).catch((error) => {
      statusText.textContent = `Unable to open New Decision modal: ${error.message}`;
    });
  });
}
