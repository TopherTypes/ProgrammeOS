/**
 * @typedef {Object} ProjectModalPerson
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} ProjectFormValues
 * @property {string} name
 * @property {string} description
 * @property {string} status
 * @property {string[]} stakeholderIds
 */

/**
 * @typedef {Object} NewProjectModalOptions
 * @property {ProjectModalPerson[]} people
 * @property {(values: ProjectFormValues) => Promise<void>} onSubmit
 * @property {() => void} [onClose]
 */

/**
 * Escapes user-provided values before rendering them in inline status text.
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
 * Creates and opens the modal for creating a project.
 *
 * Modal lifecycle summary:
 * 1) Build and inject modal DOM elements.
 * 2) Attach close and keyboard listeners while modal is visible.
 * 3) Validate + submit form values through the caller-provided async handler.
 * 4) Clean up listeners and DOM nodes when closed, restoring prior focus.
 *
 * @param {NewProjectModalOptions} options
 * @returns {{ close: () => void }}
 */
export function openNewProjectModal(options) {
  const { people, onSubmit, onClose } = options;

  if (!Array.isArray(people)) {
    throw new Error("openNewProjectModal requires a people array.");
  }

  if (typeof onSubmit !== "function") {
    throw new Error("openNewProjectModal requires an onSubmit handler.");
  }

  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const stakeholderOptionsHtml = people
    .map((person) => {
      const safeName = escapeHtml(person.name?.trim() || "Unnamed person");
      return `<option value="${person.id}">${safeName}</option>`;
    })
    .join("");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "new-project-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
      <div class="modal-header">
        <h2 id="new-project-title" class="modal-title">New Project</h2>
      </div>
      <form class="modal-form" data-role="new-project-form">
        <div class="modal-form-row">
          <label class="people-label" for="new-project-name">Name</label>
          <input id="new-project-name" name="name" class="people-input" type="text" required />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-project-description">Description</label>
          <textarea id="new-project-description" name="description" class="people-input" rows="4"></textarea>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-project-status">Status</label>
          <input id="new-project-status" name="status" class="people-input" type="text" value="active" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-project-stakeholder-ids">Stakeholders</label>
          <select
            id="new-project-stakeholder-ids"
            name="stakeholderIds"
            class="people-input"
            multiple
            size="6"
            data-role="project-stakeholder-select"
          >
            ${stakeholderOptionsHtml}
          </select>
          <p class="small-note">Hold Ctrl/Cmd to select multiple stakeholders.</p>
        </div>
        <p class="small-note" data-role="modal-status" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="people-button people-button-muted" data-role="modal-cancel">Cancel</button>
          <button type="submit" class="people-button" data-role="modal-submit">Save project</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="new-project-form"]');
  const nameInput = overlay.querySelector("#new-project-name");
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');
  const stakeholderSelect = overlay.querySelector('[data-role="project-stakeholder-select"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(stakeholderSelect instanceof HTMLSelectElement)
  ) {
    throw new Error("New project modal failed to initialise required elements.");
  }

  let isClosing = false;

  /**
   * Performs deterministic modal teardown so every close path behaves the same.
   */
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
   * Escape closes the modal to preserve keyboard-friendly dismissal behaviour.
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
   * Centralised submit flow for inline validation, async save, and post-save close.
   *
   * @param {SubmitEvent} event
   */
  async function onFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const values = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      status: String(formData.get("status") || "").trim(),
      stakeholderIds: [...stakeholderSelect.selectedOptions].map((option) => option.value),
    };

    if (!values.name) {
      statusText.textContent = "Please provide a valid name before saving.";
      nameInput.focus();
      return;
    }

    statusText.textContent = "Saving project...";
    submitButton.disabled = true;
    cancelButton.disabled = true;
    stakeholderSelect.disabled = true;

    try {
      await onSubmit(values);
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText.innerHTML = `Unable to save project: ${escapeHtml(message)}`;
      submitButton.disabled = false;
      cancelButton.disabled = false;
      stakeholderSelect.disabled = false;
    }
  }

  cancelButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  form.addEventListener("submit", onFormSubmit);

  document.body.append(overlay);
  document.addEventListener("keydown", onDocumentKeydown);
  nameInput.focus();

  return { close };
}
