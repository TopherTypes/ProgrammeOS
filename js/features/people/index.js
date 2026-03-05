import { renderPageFrame } from "../../layout.js";

/**
 * Renders the people page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderPeoplePage(outlets) {
  renderPageFrame(outlets, {
    title: "People",
    bodyHtml:
      '<p class="small-note">People feature module scaffold is in place.</p>',
  });
}
