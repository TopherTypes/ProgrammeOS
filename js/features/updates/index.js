import { renderPageFrame } from "../../layout.js";

/**
 * Renders the updates page placeholder.
 * @param {HTMLElement} container
 */
export function renderUpdatesPage(container) {
  renderPageFrame(container, {
    title: "Updates",
    bodyHtml:
      '<p class="small-note">Updates feature module scaffold is in place.</p>',
  });
}
