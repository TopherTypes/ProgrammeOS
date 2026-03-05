import { renderPeoplePage } from "./features/people/index.js";
import { renderProjectsPage } from "./features/projects/index.js";
import { renderMeetingsPage } from "./features/meetings/index.js";
import { renderActionsPage } from "./features/actions/index.js";
import { renderDecisionsPage } from "./features/decisions/index.js";
import { renderUpdatesPage } from "./features/updates/index.js";

/** @type {Record<string, (container: HTMLElement) => void>} */
const ROUTE_MAP = {
  "#/dashboard": renderDashboardPage,
  "#/people": renderPeoplePage,
  "#/projects": renderProjectsPage,
  "#/meetings": renderMeetingsPage,
  "#/actions": renderActionsPage,
  "#/decisions": renderDecisionsPage,
  "#/updates": renderUpdatesPage,
};

/**
 * Returns a lightweight hash router implementation.
 * @param {HTMLElement} contentOutlet
 */
export function createRouter(contentOutlet) {
  /** Renders the route matching current hash. */
  const renderCurrentRoute = () => {
    const hash = window.location.hash || "#/dashboard";
    const renderFn = ROUTE_MAP[hash] ?? renderNotFoundPage;

    renderFn(contentOutlet);
  };

  return {
    start() {
      window.addEventListener("hashchange", renderCurrentRoute);

      if (!window.location.hash) {
        window.location.hash = "#/dashboard";
      } else {
        renderCurrentRoute();
      }
    },
  };
}

function renderDashboardPage(container) {
  container.innerHTML = `
    <h2 class="page-title">Dashboard</h2>
    <p class="small-note">Application shell loaded successfully.</p>
  `;
}

function renderNotFoundPage(container) {
  container.innerHTML = `
    <h2 class="page-title">Not Found</h2>
    <p class="small-note">The requested route is not available yet.</p>
  `;
}
