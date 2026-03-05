import { renderPageFrame } from "../../layout.js";

/**
 * Renders the updates page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderUpdatesPage(outlets) {
  renderPageFrame(outlets, {
    title: "Updates",
    bodyHtml:
      '<p class="small-note">Updates feature module scaffold is in place.</p>',
  });
}
