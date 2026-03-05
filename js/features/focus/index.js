import { renderPageFrame } from "../../layout.js";

/**
 * Renders the focus page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderFocusPage(outlets) {
  renderPageFrame(outlets, {
    title: "Focus",
    bodyHtml:
      '<p class="small-note">Focus feature module scaffold is in place.</p>',
    detailHtml:
      '<p class="small-note">Optional detail panel slot reserved for Focus summaries.</p>',
  });
}
