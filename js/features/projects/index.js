import { listPeople } from "../people/data.js";
import { getProject, listProjects } from "./data.js";
import { renderPageFrame } from "../../layout.js";

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
 * Renders the static shell for the projects route.
 *
 * Splitting frame render from hydration allows the route to paint quickly,
 * then populate IndexedDB-backed content asynchronously.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderProjectsPageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "Projects",
    bodyHtml: `
      <section class="projects-page" aria-label="Projects management">
        <section class="projects-toolbar" aria-label="Project actions">
          <button class="people-button" type="button" data-role="new-project-trigger">New Project</button>
          <p class="small-note" data-role="projects-status" aria-live="polite"></p>
        </section>

        <section class="projects-list" data-role="projects-list" aria-label="Projects records"></section>
      </section>
    `,
    detailHtml: `
      <section data-role="project-detail" aria-label="Project detail panel">
        <p class="small-note" data-role="project-detail-empty">
          Select a project to view details.
        </p>
      </section>
    `,
  });
}

/**
 * Renders the projects list container.
 *
 * @param {HTMLElement} listContainer
 * @param {Array<{id: string, name?: string, status?: string}>} projects
 * @param {string|null} selectedProjectId
 */
function renderProjectsList(listContainer, projects, selectedProjectId) {
  if (projects.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="projects-empty-state">
        No projects have been added yet. Create the first project using the New Project button.
      </p>
    `;
    return;
  }

  const rowsHtml = projects
    .map((project) => {
      const label = escapeHtml(project.name?.trim() || "Untitled project");
      const status = escapeHtml(project.status?.trim() || "No status");
      const isSelected = project.id === selectedProjectId;
      const stakeholderCount = project.stakeholderIds?.length ?? 0;

      return `
        <tr data-role="project-row" data-project-id="${project.id}" aria-selected="${
          isSelected ? "true" : "false"
        }" class="${isSelected ? "is-selected" : ""}">
          <td>
            <button
              class="projects-list-item"
              type="button"
              data-role="project-item"
              data-project-id="${project.id}"
              aria-pressed="${isSelected ? "true" : "false"}"
            >
              ${label}
            </button>
          </td>
          <td>${status}</td>
          <td>${stakeholderCount}</td>
        </tr>
      `;
    })
    .join("");

  listContainer.innerHTML = `
    <table class="people-table projects-table" data-role="projects-list-items">
      <caption class="visually-hidden">Project list</caption>
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Status</th>
          <th scope="col">Stakeholders</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * Renders detail content for the currently selected project.
 *
 * @param {HTMLElement} detailContainer
 * @param {{id: string, name?: string, description?: string, status?: string, stakeholderIds?: string[]}|null} project
 * @param {Map<string, string>} stakeholderNamesById
 * @param {boolean} isMissingSelection
 */
function renderProjectDetail(detailContainer, project, stakeholderNamesById, isMissingSelection) {
  if (isMissingSelection) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="project-detail-missing">
        Project detail view is unavailable because the selected project could not be found.
      </p>
    `;
    return;
  }

  if (!project) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="project-detail-empty">
        Select a project from the project list to view details.
      </p>
    `;
    return;
  }

  const name = escapeHtml(project.name?.trim() || "Untitled project");
  const status = escapeHtml(project.status?.trim() || "No status");
  const description = escapeHtml(project.description?.trim() || "No description captured yet.");
  const stakeholderNames = (project.stakeholderIds ?? [])
    .map((stakeholderId) => stakeholderNamesById.get(stakeholderId) || "Unknown person")
    .map((nameValue) => escapeHtml(nameValue));

  const stakeholderListHtml =
    stakeholderNames.length === 0
      ? `<p class="small-note">No key stakeholders linked yet.</p>`
      : `<ul>${stakeholderNames.map((stakeholderName) => `<li>${stakeholderName}</li>`).join("")}</ul>`;

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="project-detail-card">
      <h3>${name}</h3>
      <p><strong>Status:</strong> ${status}</p>
      <p>${description}</p>
      <p><strong>Stakeholder count:</strong> ${stakeholderNames.length}</p>
      <section aria-label="Project key stakeholders">
        <h4>Key stakeholders</h4>
        ${stakeholderListHtml}
      </section>
    </article>
  `;
}

/**
 * Handles both click and keyboard interactions for project selection.
 *
 * @param {Event} event
 * @returns {string|null}
 */
function getSelectedProjectIdFromEvent(event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
  }

  const projectItem = target.closest('[data-role="project-item"]');

  if (!(projectItem instanceof HTMLButtonElement)) {
    return null;
  }

  return projectItem.dataset.projectId ?? null;
}

/**
 * Pulls latest projects from storage and re-renders list + detail panes.
 *
 * @param {object} config
 * @param {HTMLElement} config.listContainer
 * @param {HTMLElement} config.detailContainer
 * @param {HTMLElement} config.statusText
 * @param {{ selectedProjectId: string|null }} config.state
 */
async function refreshProjectsView({ listContainer, detailContainer, statusText, state }) {
  const projects = await listProjects();
  const people = await listPeople();

  state.projects = projects;
  state.peopleById = new Map(people.map((person) => [person.id, person.name]));

  const selectedProjectInList =
    projects.find((project) => project.id === state.selectedProjectId) ?? null;
  const hadExplicitSelection = Boolean(state.selectedProjectId);
  let shouldShowMissingSelectionFallback = false;

  // If the current selection no longer exists, default to the first record.
  if (!selectedProjectInList && projects.length > 0 && !hadExplicitSelection) {
    state.selectedProjectId = projects[0].id;
  }

  if (!selectedProjectInList && hadExplicitSelection) {
    shouldShowMissingSelectionFallback = true;
    state.selectedProjectId = null;
  }

  let hydratedSelection = null;

  if (state.selectedProjectId) {
    hydratedSelection = await getProject(state.selectedProjectId);

    // Guard against races where the selected record is deleted between list and detail reads.
    if (!hydratedSelection) {
      shouldShowMissingSelectionFallback = true;
      state.selectedProjectId = null;
    }
  }

  renderProjectsList(listContainer, projects, state.selectedProjectId);
  renderProjectDetail(
    detailContainer,
    hydratedSelection,
    state.peopleById,
    shouldShowMissingSelectionFallback
  );

  statusText.textContent =
    projects.length === 0
      ? "No projects stored yet."
      : `${projects.length} project${projects.length === 1 ? "" : "s"} loaded.`;
}

/**
 * Renders the projects page and wires list/detail interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderProjectsPage(outlets) {
  renderProjectsPageFrame(outlets);

  const listContainer = outlets.mainOutlet.querySelector('[data-role="projects-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="projects-status"]');
  const newProjectTrigger = outlets.mainOutlet.querySelector(
    '[data-role="new-project-trigger"]'
  );
  const detailContainer = outlets.detailOutlet.querySelector('[data-role="project-detail"]');

  if (
    !listContainer ||
    !statusText ||
    !detailContainer ||
    !(newProjectTrigger instanceof HTMLButtonElement)
  ) {
    throw new Error("Projects page failed to mount required containers.");
  }

  const state = {
    selectedProjectId: null,
    projects: [],
    peopleById: new Map(),
  };

  refreshProjectsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
    statusText.textContent = `Unable to load projects: ${error.message}`;
  });

  listContainer.addEventListener("click", (event) => {
    const selectedProjectId = getSelectedProjectIdFromEvent(event);

    if (!selectedProjectId) {
      return;
    }

    state.selectedProjectId = selectedProjectId;

    refreshProjectsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
      statusText.textContent = `Unable to load project details: ${error.message}`;
    });
  });

  listContainer.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) {
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const buttons = [...listContainer.querySelectorAll('[data-role="project-item"]')].filter(
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

  // Creation modal is not delivered yet; this keeps intent explicit in the UI.
  newProjectTrigger.addEventListener("click", () => {
    statusText.textContent =
      "Project creation flow is not available yet. Milestone 3 will add the modal.";
  });
}
