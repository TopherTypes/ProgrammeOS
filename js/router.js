import { renderPeoplePage } from "./features/people/index.js";
import { renderProjectsPage } from "./features/projects/index.js";
import { renderMeetingsPage } from "./features/meetings/index.js";
import { renderActionsPage } from "./features/actions/index.js";
import { renderDecisionsPage } from "./features/decisions/index.js";
import { renderUpdatesPage } from "./features/updates/index.js";
import { renderFocusPage } from "./features/focus/index.js";
import { renderPageFrame } from "./layout.js";

/** @type {Record<string, (container: HTMLElement) => void>} */
const ROUTE_MAP = {
  "#/dashboard": renderDashboardPage,
  "#/projects": renderProjectsPage,
  "#/people": renderPeoplePage,
  "#/meetings": renderMeetingsPage,
  "#/actions": renderActionsPage,
  "#/decisions": renderDecisionsPage,
  "#/updates": renderUpdatesPage,
  "#/focus": renderFocusPage,
};

/**
 * Returns a lightweight hash router implementation.
 * @param {HTMLElement} contentOutlet
 */
export function createRouter(contentOutlet) {
  /**
   * Normalises the current hash and returns a supported route key.
   * Unknown routes fall back to not-found rendering.
   * @returns {string}
   */
  const getCurrentRoute = () => window.location.hash || "#/dashboard";

  /** Renders the route matching current hash. */
  const renderCurrentRoute = () => {
    const route = getCurrentRoute();
    const renderFn = ROUTE_MAP[route] ?? renderNotFoundPage;

    renderFn(contentOutlet);
  };

  return {
    start() {
      window.addEventListener("hashchange", renderCurrentRoute);

      if (!window.location.hash) {
        window.location.hash = "#/dashboard";
        return;
      }

      renderCurrentRoute();
    },
  };
}

/**
 * Renders the dashboard placeholder page.
 * @param {HTMLElement} container
 */
function renderDashboardPage(container) {
  renderPageFrame(container, {
    title: "Dashboard",
    bodyHtml: '<p class="small-note">Application shell loaded successfully.</p>',
  });
}

/**
 * Renders a fallback page for unknown routes.
 * @param {HTMLElement} container
 */
function renderNotFoundPage(container) {
  renderPageFrame(container, {
    title: "Not Found",
    bodyHtml: '<p class="small-note">The requested route is not available yet.</p>',
  });
}
