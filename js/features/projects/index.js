import { renderPageFrame } from "../../layout.js";

/**
 * Renders the projects page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderProjectsPage(outlets) {
  renderPageFrame(outlets, {
    title: "Projects",
    bodyHtml:
      '<p class="small-note">Projects feature module scaffold is in place.</p>',
  });
}
