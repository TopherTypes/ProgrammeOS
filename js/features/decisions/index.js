import { renderPageFrame } from "../../layout.js";

/**
 * Renders the decisions page placeholder.
 * @param {HTMLElement} container
 */
export function renderDecisionsPage(container) {
  renderPageFrame(container, {
    title: "Decisions",
    bodyHtml:
      '<p class="small-note">Decisions feature module scaffold is in place.</p>',
  });
}
