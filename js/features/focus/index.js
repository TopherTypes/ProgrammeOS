import { renderPageFrame } from "../../layout.js";

/**
 * Renders the focus page placeholder.
 * @param {HTMLElement} container
 */
export function renderFocusPage(container) {
  renderPageFrame(container, {
    title: "Focus",
    bodyHtml:
      '<p class="small-note">Focus feature module scaffold is in place.</p>',
    detailHtml:
      '<p class="small-note">Optional detail panel slot reserved for Focus summaries.</p>',
  });
}
