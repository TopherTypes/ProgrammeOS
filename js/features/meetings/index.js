import { renderPageFrame } from "../../layout.js";

/**
 * Renders the meetings page placeholder.
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderMeetingsPage(outlets) {
  renderPageFrame(outlets, {
    title: "Meetings",
    bodyHtml:
      '<p class="small-note">Meetings feature module scaffold is in place.</p>',
  });
}
