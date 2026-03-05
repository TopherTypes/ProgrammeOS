import { renderPageFrame } from "../../layout.js";

/**
 * Renders the decisions page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderDecisionsPage(outlets) {
  renderPageFrame(outlets, {
    title: "Decisions",
    bodyHtml:
      '<p class="small-note">Decisions feature module scaffold is in place.</p>',
  });
}
