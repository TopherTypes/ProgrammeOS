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
 * @typedef {Object} OpenProjectModalOptions
 * @property {ProjectModalPerson[]} people
 * @property {ProjectFormValues} [initialValues]
 * @property {string} title
 * @property {string} submitLabel
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
 * Opens a project form modal that supports both create and edit workflows.
 *
 * @param {OpenProjectModalOptions} options
 * @returns {{ close: () => void }}
 */
export function openProjectModal(options) {
  const { people, initialValues, title, submitLabel, onSubmit, onClose } = options;

  if (!Array.isArray(people)) {
    throw new Error("openProjectModal requires a people array.");
  }

  if (typeof onSubmit !== "function") {
    throw new Error("openProjectModal requires an onSubmit handler.");
  }

  const values = {
    name: initialValues?.name?.trim() ?? "",
    description: initialValues?.description?.trim() ?? "",
    status: initialValues?.status?.trim() || "active",
    stakeholderIds: Array.isArray(initialValues?.stakeholderIds)
      ? [...new Set(initialValues.stakeholderIds)]
      : [],
  };

  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const stakeholderOptionsHtml = people
    .map((person) => {
      const safeName = escapeHtml(person.name?.trim() || "Unnamed person");
      const isSelected = values.stakeholderIds.includes(person.id) ? " selected" : "";
      return `<option value="${person.id}"${isSelected}>${safeName}</option>`;
    })
    .join("");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "project-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
      <div class="modal-header">
        <h2 id="project-modal-title" class="modal-title">${escapeHtml(title)}</h2>
      </div>
      <form class="modal-form" data-role="project-form">
        <div class="modal-form-row">
          <label class="people-label" for="project-name">Name</label>
          <input
            id="project-name"
            name="name"
            class="people-input"
            type="text"
            required
            value="${escapeHtml(values.name)}"
            aria-describedby="project-name-error"
          />
          <p id="project-name-error" class="small-note" data-role="project-name-error" aria-live="polite"></p>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="project-description">Description</label>
          <textarea id="project-description" name="description" class="people-input" rows="4">${escapeHtml(
            values.description
          )}</textarea>
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="project-status">Status</label>
          <input id="project-status" name="status" class="people-input" type="text" value="${escapeHtml(
            values.status
          )}" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="project-stakeholder-ids">Stakeholders</label>
          <select
            id="project-stakeholder-ids"
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
          <button type="submit" class="people-button" data-role="modal-submit">${escapeHtml(
            submitLabel
          )}</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="project-form"]');
  const nameInput = overlay.querySelector("#project-name");
  const nameError = overlay.querySelector('[data-role="project-name-error"]');
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');
  const stakeholderSelect = overlay.querySelector('[data-role="project-stakeholder-select"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(nameError instanceof HTMLElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(stakeholderSelect instanceof HTMLSelectElement)
  ) {
    throw new Error("Project modal failed to initialise required elements.");
  }

  let isClosing = false;

  /**
   * Validates name and provides a deterministic inline validation message.
   *
   * @returns {boolean}
   */
  function validateName() {
    if (nameInput.value.trim()) {
      nameError.textContent = "";
      nameInput.removeAttribute("aria-invalid");
      return true;
    }

    nameError.textContent = "Project name is required.";
    nameInput.setAttribute("aria-invalid", "true");
    return false;
  }

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
   * Centralized submit flow handling validation, async submit, and errors.
   *
   * @param {SubmitEvent} event
   */
  async function onFormSubmit(event) {
    event.preventDefault();

    if (!validateName()) {
      nameInput.focus();
      return;
    }

    const formData = new FormData(form);
    const submitValues = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      status: String(formData.get("status") || "").trim(),
      stakeholderIds: [...stakeholderSelect.selectedOptions].map((option) => option.value),
    };

    statusText.textContent = "Saving project...";
    submitButton.disabled = true;
    cancelButton.disabled = true;
    stakeholderSelect.disabled = true;

    try {
      await onSubmit(submitValues);
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
  nameInput.addEventListener("input", () => {
    validateName();
  });
  form.addEventListener("submit", onFormSubmit);

  document.body.append(overlay);
  document.addEventListener("keydown", onDocumentKeydown);
  nameInput.focus();

  return { close };
}
