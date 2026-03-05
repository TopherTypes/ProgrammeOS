import { listEntities } from "../../db.js";
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

  const listItems = projects
    .map((project) => {
      const label = escapeHtml(project.name?.trim() || "Untitled project");
      const status = escapeHtml(project.status?.trim() || "No status");
      const isSelected = project.id === selectedProjectId;

      return `
        <li>
          <button
            class="projects-list-item"
            type="button"
            data-role="project-item"
            data-project-id="${project.id}"
            aria-pressed="${isSelected ? "true" : "false"}"
          >
            <strong>${label}</strong>
            <span class="small-note">${status}</span>
          </button>
        </li>
      `;
    })
    .join("");

  listContainer.innerHTML = `
    <ul class="projects-list-items" data-role="projects-list-items">
      ${listItems}
    </ul>
  `;
}

/**
 * Renders detail content for the currently selected project.
 *
 * @param {HTMLElement} detailContainer
 * @param {{id: string, name?: string, description?: string, status?: string}|null} project
 */
function renderProjectDetail(detailContainer, project) {
  if (!project) {
    detailContainer.innerHTML = `
      <p class="small-note" data-role="project-detail-empty">
        Select a project to view details.
      </p>
    `;
    return;
  }

  const name = escapeHtml(project.name?.trim() || "Untitled project");
  const status = escapeHtml(project.status?.trim() || "No status");
  const description = escapeHtml(project.description?.trim() || "No description captured yet.");

  detailContainer.innerHTML = `
    <article class="project-detail-card" data-role="project-detail-card">
      <h3>${name}</h3>
      <p><strong>Status:</strong> ${status}</p>
      <p>${description}</p>
    </article>
  `;
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
  const projects = await listEntities("projects");
  const selectedProject = projects.find((project) => project.id === state.selectedProjectId) ?? null;

  // If the current selection no longer exists, default to the first record.
  if (!selectedProject && projects.length > 0) {
    state.selectedProjectId = projects[0].id;
  }

  const hydratedSelection =
    projects.find((project) => project.id === state.selectedProjectId) ?? null;

  renderProjectsList(listContainer, projects, state.selectedProjectId);
  renderProjectDetail(detailContainer, hydratedSelection);

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
  };

  refreshProjectsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
    statusText.textContent = `Unable to load projects: ${error.message}`;
  });

  listContainer.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const projectItem = target.closest('[data-role="project-item"]');

    if (!(projectItem instanceof HTMLButtonElement)) {
      return;
    }

    state.selectedProjectId = projectItem.dataset.projectId ?? null;

    refreshProjectsView({ listContainer, detailContainer, statusText, state }).catch((error) => {
      statusText.textContent = `Unable to load project details: ${error.message}`;
    });
  });

  // Creation modal is not delivered yet; this keeps intent explicit in the UI.
  newProjectTrigger.addEventListener("click", () => {
    statusText.textContent =
      "Project creation flow is not available yet. Milestone 3 will add the modal.";
  });
}
