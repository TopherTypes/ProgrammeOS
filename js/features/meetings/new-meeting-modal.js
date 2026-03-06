import { listPeople } from "../people/data.js";
import { listProjects } from "../projects/data.js";
import { createMeeting } from "./data.js";

/**
 * @typedef {{ id: string, name?: string }} PersonOption
 * @typedef {{ id: string, name?: string }} ProjectOption
 *
 * @typedef {Object} OpenNewMeetingModalOptions
 * @property {(meeting: {
 *   id: string,
 *   title: string,
 *   date: string,
 *   type: string,
 *   attendeeIds: string[],
 *   projectIds: string[],
 *   notes: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }) => (void|Promise<void>)} [onRehydrate]
 * @property {() => void} [onClose]
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
 * Builds multi-select option markup.
 *
 * @param {(PersonOption|ProjectOption)[]} options
 * @param {string} emptyLabel
 * @returns {string}
 */
function renderSelectOptions(options, emptyLabel) {
  if (options.length === 0) {
    return `<option value="" disabled>${escapeHtml(emptyLabel)}</option>`;
  }

  return options
    .map((option) => {
      const label = escapeHtml(option.name?.trim() || "Unnamed record");
      return `<option value="${option.id}">${label}</option>`;
    })
    .join("");
}

/**
 * Opens the New Meeting modal and handles the complete create lifecycle.
 *
 * @param {OpenNewMeetingModalOptions} [options]
 * @returns {Promise<{ close: () => void }>}
 */
export async function openNewMeetingModal(options = {}) {
  const { onRehydrate, onClose } = options;

  const [people, projects] = await Promise.all([listPeople(), listProjects()]);

  // Snapshot focus before opening so every close path can restore keyboard context.
  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "new-meeting-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-meeting-title">
      <div class="modal-header">
        <h2 id="new-meeting-title" class="modal-title">New Meeting</h2>
      </div>
      <form class="modal-form" data-role="new-meeting-form">
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-title-input">Title</label>
          <input
            id="new-meeting-title-input"
            name="title"
            class="people-input"
            type="text"
            required
            aria-describedby="new-meeting-title-error"
          />
          <p id="new-meeting-title-error" class="small-note" data-role="new-meeting-title-error" aria-live="polite"></p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-date">Date</label>
          <input
            id="new-meeting-date"
            name="date"
            class="people-input"
            type="date"
            required
            aria-describedby="new-meeting-date-error"
          />
          <p id="new-meeting-date-error" class="small-note" data-role="new-meeting-date-error" aria-live="polite"></p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-type">Type</label>
          <input id="new-meeting-type" name="type" class="people-input" type="text" value="General" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-attendees">Attendees</label>
          <select id="new-meeting-attendees" name="attendeeIds" class="people-input" multiple size="6" data-role="new-meeting-attendee-select">
            ${renderSelectOptions(people, "No people available")}
          </select>
          <p class="small-note">Hold Ctrl/Cmd to select multiple attendees.</p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-projects">Projects</label>
          <select id="new-meeting-projects" name="projectIds" class="people-input" multiple size="6" data-role="new-meeting-project-select">
            ${renderSelectOptions(projects, "No projects available")}
          </select>
          <p class="small-note">Optional linkage to related projects.</p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-meeting-notes">Notes</label>
          <textarea id="new-meeting-notes" name="notes" class="people-input" rows="4"></textarea>
        </div>
        <p class="small-note" data-role="modal-status" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="people-button people-button-muted" data-role="modal-cancel">Cancel</button>
          <button type="submit" class="people-button" data-role="modal-submit">Save meeting</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="new-meeting-form"]');
  const titleInput = overlay.querySelector("#new-meeting-title-input");
  const dateInput = overlay.querySelector("#new-meeting-date");
  const titleError = overlay.querySelector('[data-role="new-meeting-title-error"]');
  const dateError = overlay.querySelector('[data-role="new-meeting-date-error"]');
  const attendeeSelect = overlay.querySelector('[data-role="new-meeting-attendee-select"]');
  const projectSelect = overlay.querySelector('[data-role="new-meeting-project-select"]');
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(titleInput instanceof HTMLInputElement) ||
    !(dateInput instanceof HTMLInputElement) ||
    !(titleError instanceof HTMLElement) ||
    !(dateError instanceof HTMLElement) ||
    !(attendeeSelect instanceof HTMLSelectElement) ||
    !(projectSelect instanceof HTMLSelectElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("New meeting modal failed to initialise required elements.");
  }

  let isClosing = false;

  /**
   * Centralized teardown keeps listeners/focus handling consistent for all exits.
   */
  function close() {
    if (isClosing) {
      return;
    }

    isClosing = true;
    document.removeEventListener("keydown", onDocumentKeydown);
    overlay.remove();

    // Restore focus to the trigger (or prior element) for keyboard continuity.
    if (previousActiveElement) {
      previousActiveElement.focus();
    }

    if (typeof onClose === "function") {
      onClose();
    }
  }

  /**
   * Validates required form controls and updates inline field messaging.
   *
   * @returns {boolean}
   */
  function validate() {
    const titleValue = titleInput.value.trim();
    const dateValue = dateInput.value.trim();

    titleError.textContent = titleValue ? "" : "Title is required.";
    dateError.textContent = dateValue ? "" : "Date is required.";

    if (!titleValue) {
      titleInput.focus();
      return false;
    }

    if (!dateValue) {
      dateInput.focus();
      return false;
    }

    return true;
  }

  /**
   * Escape key dismissal mirrors the established modal keyboard pattern.
   *
   * @param {KeyboardEvent} event
   */
  function onDocumentKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  /**
   * Handles create persistence and post-save route hydration callback.
   *
   * @param {SubmitEvent} event
   */
  async function onFormSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      statusText.textContent = "Please complete required fields before saving.";
      return;
    }

    const attendeeIds = Array.from(attendeeSelect.selectedOptions)
      .map((option) => option.value.trim())
      .filter(Boolean);
    const projectIds = Array.from(projectSelect.selectedOptions)
      .map((option) => option.value.trim())
      .filter(Boolean);

    const meetingInput = {
      title: titleInput.value.trim(),
      date: dateInput.value.trim(),
      type: (form.elements.namedItem("type") instanceof HTMLInputElement
        ? form.elements.namedItem("type").value
        : ""
      ).trim(),
      attendeeIds,
      projectIds,
      notes: (form.elements.namedItem("notes") instanceof HTMLTextAreaElement
        ? form.elements.namedItem("notes").value
        : ""
      ).trim(),
    };

    statusText.textContent = "Saving meeting...";
    submitButton.disabled = true;
    cancelButton.disabled = true;

    try {
      const createdMeeting = await createMeeting(meetingInput);

      if (typeof onRehydrate === "function") {
        await onRehydrate(createdMeeting);
      }

      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText.innerHTML = `Unable to save meeting: ${escapeHtml(message)}`;
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
  titleInput.addEventListener("input", () => {
    titleError.textContent = "";
  });
  dateInput.addEventListener("input", () => {
    dateError.textContent = "";
  });
  form.addEventListener("submit", onFormSubmit);

  // Lifecycle start: append overlay first, then register global Escape handling.
  document.body.append(overlay);
  document.addEventListener("keydown", onDocumentKeydown);
  titleInput.focus();

  return { close };
}
