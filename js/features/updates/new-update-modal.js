import { listMeetings } from "../meetings/data.js";
import { listProjects } from "../projects/data.js";
import { createUpdate } from "./data.js";

/**
 * @typedef {object} OpenNewUpdateModalOptions
 * @property {(createdUpdate: {
 *   id: string,
 *   description: string,
 *   meetingId: string,
 *   projectIds: string[],
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
 * @template T
 * @param {Array<{id: string} & T>} options
 * @param {string} emptyLabel
 * @param {(option: {id: string} & T) => string} getLabel
 * @returns {string}
 */
function renderSelectOptions(options, emptyLabel, getLabel) {
  if (options.length === 0) {
    return `<option value="" disabled>${escapeHtml(emptyLabel)}</option>`;
  }

  return options
    .map((option) => `<option value="${option.id}">${escapeHtml(getLabel(option))}</option>`)
    .join("");
}

/**
 * Reads selected values from a multi-select element.
 *
 * @param {HTMLSelectElement} selectElement
 * @returns {string[]}
 */
function getSelectedValues(selectElement) {
  return [...selectElement.selectedOptions]
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Opens the New Update modal and handles full create lifecycle.
 *
 * @param {OpenNewUpdateModalOptions} [options]
 * @returns {Promise<{ close: () => void }>}
 */
export async function openNewUpdateModal(options = {}) {
  const { onRehydrate, onClose } = options;

  const [meetings, projects] = await Promise.all([listMeetings(), listProjects()]);

  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "new-update-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-update-title">
      <div class="modal-header">
        <h2 id="new-update-title" class="modal-title">New Update</h2>
      </div>
      <form class="modal-form" data-role="new-update-form">
        <div class="modal-form-row">
          <label class="people-label" for="new-update-description">Description</label>
          <textarea
            id="new-update-description"
            name="description"
            class="people-input"
            rows="4"
            required
            aria-describedby="new-update-description-error"
          ></textarea>
          <p id="new-update-description-error" class="small-note" data-role="new-update-description-error" aria-live="polite"></p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-update-meeting">Meeting</label>
          <select id="new-update-meeting" name="meetingId" class="people-input">
            <option value="">Not linked</option>
            ${renderSelectOptions(
              meetings,
              "No meetings available",
              (meeting) => meeting.title?.trim() || "Untitled meeting"
            )}
          </select>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-update-projects">Projects</label>
          <select id="new-update-projects" name="projectIds" class="people-input" multiple size="6" data-role="new-update-project-select">
            ${renderSelectOptions(
              projects,
              "No projects available",
              (project) => project.name?.trim() || "Unnamed project"
            )}
          </select>
          <p class="small-note">Optional linkage to related projects.</p>
        </div>
        <p class="small-note" data-role="modal-status" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="people-button people-button-muted" data-role="modal-cancel">Cancel</button>
          <button type="submit" class="people-button" data-role="modal-submit">Save update</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="new-update-form"]');
  const descriptionInput = overlay.querySelector("#new-update-description");
  const descriptionError = overlay.querySelector('[data-role="new-update-description-error"]');
  const projectSelect = overlay.querySelector('[data-role="new-update-project-select"]');
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(descriptionInput instanceof HTMLTextAreaElement) ||
    !(descriptionError instanceof HTMLElement) ||
    !(projectSelect instanceof HTMLSelectElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("New update modal failed to initialise required elements.");
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

    const meetingIdInput = form.elements.namedItem("meetingId");

    const updateInput = {
      description: descriptionInput.value.trim(),
      meetingId: meetingIdInput instanceof HTMLSelectElement ? meetingIdInput.value.trim() : "",
      projectIds: getSelectedValues(projectSelect),
    };

    statusText.textContent = "Saving update...";
    submitButton.disabled = true;
    cancelButton.disabled = true;

    try {
      const createdUpdate = await createUpdate(updateInput);

      if (typeof onRehydrate === "function") {
        await onRehydrate(createdUpdate);
      }

      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText.innerHTML = `Unable to save update: ${escapeHtml(message)}`;
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
