/**
 * @typedef {Object} PersonFormValues
 * @property {string} name
 * @property {string} organisation
 * @property {string} notes
 */

/**
 * @typedef {Object} NewPersonModalOptions
 * @property {(values: PersonFormValues) => Promise<void>} onSubmit
 * @property {() => void} [onClose]
 */

/**
 * Escapes user-provided values before echoing them into inline validation text.
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
 * Creates and opens the modal for creating a person.
 *
 * Modal lifecycle summary:
 * 1) Build and inject modal DOM elements.
 * 2) Attach close and keyboard listeners while modal is visible.
 * 3) Validate + submit form values through the caller-provided async handler.
 * 4) Clean up listeners and DOM nodes when closed, restoring prior focus.
 *
 * @param {NewPersonModalOptions} options
 * @returns {{ close: () => void }}
 */
export function openNewPersonModal(options) {
  const { onSubmit, onClose } = options;

  if (typeof onSubmit !== "function") {
    throw new Error("openNewPersonModal requires an onSubmit handler.");
  }

  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("data-role", "new-person-modal-overlay");

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-person-title">
      <div class="modal-header">
        <h2 id="new-person-title" class="modal-title">New Person</h2>
      </div>
      <form class="modal-form" data-role="new-person-form">
        <div class="modal-form-row">
          <label class="people-label" for="new-person-name">Name</label>
          <input id="new-person-name" name="name" class="people-input" type="text" required />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-person-organisation">Organisation</label>
          <input id="new-person-organisation" name="organisation" class="people-input" type="text" />
        </div>
        <div class="modal-form-row">
          <label class="people-label" for="new-person-notes">Notes</label>
          <textarea id="new-person-notes" name="notes" class="people-input" rows="4"></textarea>
        </div>
        <p class="small-note" data-role="modal-status" aria-live="polite"></p>
        <div class="modal-actions">
          <button type="button" class="people-button people-button-muted" data-role="modal-cancel">Cancel</button>
          <button type="submit" class="people-button" data-role="modal-submit">Save person</button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('[data-role="new-person-form"]');
  const nameInput = overlay.querySelector("#new-person-name");
  const statusText = overlay.querySelector('[data-role="modal-status"]');
  const cancelButton = overlay.querySelector('[data-role="modal-cancel"]');
  const submitButton = overlay.querySelector('[data-role="modal-submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(statusText instanceof HTMLElement) ||
    !(cancelButton instanceof HTMLButtonElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("New person modal failed to initialise required elements.");
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
   * Escape closes the modal, preserving keyboard-friendly dismissal behaviour.
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
      organisation: String(formData.get("organisation") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };

    if (!values.name) {
      statusText.innerHTML = `Please provide a valid name before saving.`;
      nameInput.focus();
      return;
    }

    statusText.textContent = "Saving person...";
    submitButton.disabled = true;
    cancelButton.disabled = true;

    try {
      await onSubmit(values);
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText.innerHTML = `Unable to save person: ${escapeHtml(message)}`;
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
  form.addEventListener("submit", onFormSubmit);

  document.body.append(overlay);
  document.addEventListener("keydown", onDocumentKeydown);
  nameInput.focus();

  return { close };
}
