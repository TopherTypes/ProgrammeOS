import { renderPageFrame } from "../../layout.js";

/**
 * Renders the projects page placeholder.
 * @param {HTMLElement} container
 */
export function renderProjectsPage(container) {
  renderPageFrame(container, {
    title: "Projects",
    bodyHtml:
      '<p class="small-note">Projects feature module scaffold is in place.</p>',
  });
}
