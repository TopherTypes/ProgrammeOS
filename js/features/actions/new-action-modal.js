import { createAction } from "./data.js";
import { listMeetings } from "../meetings/data.js";

/**
 * @typedef {Object} OpenNewActionModalOptions
 * @property {(action: {
 *   id: string,
 *   description: string,
 *   ownerPersonId: string,
 *   status: string,
 *   dueDate: string,
 *   meetingId: string,
 *   projectIds: string[],
 *   requiresUpdateByPersonId: Record<string, { required: boolean, informedAt: string|null }>,
 *   createdAt: string,
 *   updatedAt: string,
 * }) => (void|Promise<void>)} [onRehydrate]
 * @property {() => void} [onClose]
 * @property {string} [lockedMeetingId] Meeting id enforced by a parent workflow (for example Meeting Review).
 * @property {string} [lockedMeetingLabel] Optional meeting label rendered while `lockedMeetingId` is enforced.
 */

/**
 * Escapes user-controlled values before inline status rendering.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Opens the New Action modal and handles full create lifecycle.
 *
 * @param {OpenNewActionModalOptions} [options]
 * @returns {Promise<{ close: () => void }>}
 */
export async function openNewActionModal(options = {}) {
  const { onRehydrate, onClose, lockedMeetingId, lockedMeetingLabel } = options;
  const meetings = await listMeetings();

  const normalizedLockedMeetingId = typeof lockedMeetingId === "string" ? lockedMeetingId.trim() : "";
  const hasLockedMeeting = normalizedLockedMeetingId.length > 0;
  const lockedMeeting = hasLockedMeeting
    ? meetings.find((meeting) => meeting.id === normalizedLockedMeetingId) ?? null
    : null;
  const meetingFieldLabel =
    (typeof lockedMeetingLabel === "string" ? lockedMeetingLabel.trim() : "") ||
    lockedMeeting?.title?.trim() ||
    "Untitled meeting";

  const meetingOptionsHtml = meetings
    .map((meeting) => {
      const label = escapeHtml(meeting.title?.trim() || "Untitled meeting");
      return `<option value="${meeting.id}">${label}</option>`;
    })
    .join("");

  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "new-action-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-action-title">
      <div class="modal-header">
        <h2 id="new-action-title" class="modal-title">New Action</h2>
      </div>
      <form class="modal-form" data-role="new-action-form">
        <div class="modal-form-row">
          <label class="people-label" for="new-action-description">Description</label>
          <textarea
            id="new-action-description"
            name="description"
            class="people-input"
            rows="4"
            required
            aria-describedby="new-action-description-error"
          ></textarea>
          <p id="new-action-description-error" class="small-note" data-role="new-action-description-error" aria-live="polite"></p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-action-status">Status</label>
          <input id="new-action-status" name="status" class="people-input" type="text" placeholder="Open" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-action-due-date">Due date</label>
          <input id="new-action-due-date" name="dueDate" class="people-input" type="date" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-action-meeting">Meeting</label>
          ${
            hasLockedMeeting
              ? `<input id="new-action-meeting" class="people-input" type="text" value="${escapeHtml(
                  meetingFieldLabel
                )}" disabled aria-disabled="true" />`
              : `<select id="new-action-meeting" name="meetingId" class="people-input">
            <option value="">Not linked</option>
            ${meetingOptionsHtml}
          </select>`
          }
        </div>
        <p class="small-note" data-role="modal-status" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="people-button people-button-muted" data-role="modal-cancel">Cancel</button>
          <button type="submit" class="people-button" data-role="modal-submit">Save action</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="new-action-form"]');
  const descriptionInput = overlay.querySelector("#new-action-description");
  const descriptionError = overlay.querySelector('[data-role="new-action-description-error"]');
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(descriptionInput instanceof HTMLTextAreaElement) ||
    !(descriptionError instanceof HTMLElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("New action modal failed to initialise required elements.");
  }

  let isClosing = false;

  function close() {
    if (isClosing) {
      return;
    }

    isClosing = true;
    document.removeEventListener("keydown", onDocumentKeydown);
    overlay.remove();

    if (previousActiveElement) {
      previousActiveElement.focus();
    }

    if (typeof onClose === "function") {
      onClose();
    }
  }

  /**
   * @returns {boolean}
   */
  function validate() {
    const description = descriptionInput.value.trim();
    descriptionError.textContent = description ? "" : "Description is required.";

    if (!description) {
      descriptionInput.focus();
      return false;
    }

    return true;
  }

  /**
   * @param {KeyboardEvent} event
   */
  function onDocumentKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  /**
   * @param {SubmitEvent} event
   */
  async function onFormSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      statusText.textContent = "Please complete required fields before saving.";
      return;
    }

    const dueDateInput = form.elements.namedItem("dueDate");
    const statusInput = form.elements.namedItem("status");
    const meetingIdInput = form.elements.namedItem("meetingId");

    // Meeting Review launches can lock meeting context so this payload cannot
    // drift even if future UI changes expose editable fields.
    const meetingId = hasLockedMeeting
      ? normalizedLockedMeetingId
      : meetingIdInput instanceof HTMLSelectElement
      ? meetingIdInput.value.trim()
      : "";

    const actionInput = {
      description: descriptionInput.value.trim(),
      status: statusInput instanceof HTMLInputElement ? statusInput.value.trim() : "",
      dueDate: dueDateInput instanceof HTMLInputElement ? dueDateInput.value.trim() : "",
      meetingId,
    };

    statusText.textContent = "Saving action...";
    submitButton.disabled = true;
    cancelButton.disabled = true;

    try {
      const createdAction = await createAction(actionInput);

      if (typeof onRehydrate === "function") {
        await onRehydrate(createdAction);
      }

      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText.innerHTML = `Unable to save action: ${escapeHtml(message)}`;
      submitButton.disabled = false;
      cancelButton.disabled = false;
    }
  }

  cancelButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  descriptionInput.addEventListener("input", () => {
    descriptionError.textContent = "";
  });
  form.addEventListener("submit", onFormSubmit);

  document.body.append(overlay);
  document.addEventListener("keydown", onDocumentKeydown);
  descriptionInput.focus();

  return { close };
}
