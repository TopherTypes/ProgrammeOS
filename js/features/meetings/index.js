import { renderPageFrame } from "../../layout.js";

/**
 * Renders the meetings page placeholder.
 * @param {HTMLElement} container
 */
export function renderMeetingsPage(container) {
  renderPageFrame(container, {
    title: "Meetings",
    bodyHtml:
      '<p class="small-note">Meetings feature module scaffold is in place.</p>',
  });
}
