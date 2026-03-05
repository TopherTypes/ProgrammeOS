import { renderPageFrame } from "../../layout.js";

/**
 * Renders the people page placeholder.
 * @param {HTMLElement} container
 */
export function renderPeoplePage(container) {
  renderPageFrame(container, {
    title: "People",
    bodyHtml:
      '<p class="small-note">People feature module scaffold is in place.</p>',
  });
}
