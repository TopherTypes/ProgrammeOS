import { renderPageFrame } from "../../layout.js";

/**
 * Renders the actions page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderActionsPage(outlets) {
  renderPageFrame(outlets, {
    title: "Actions",
    bodyHtml:
      '<p class="small-note">Actions feature module scaffold is in place.</p>',
  });
}
