import { renderPageFrame } from "../../layout.js";

/**
 * Renders the actions page placeholder.
 * @param {HTMLElement} container
 */
export function renderActionsPage(container) {
  renderPageFrame(container, {
    title: "Actions",
    bodyHtml:
      '<p class="small-note">Actions feature module scaffold is in place.</p>',
  });
}
