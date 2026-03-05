import { openProjectModal } from "./project-modal.js";

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
 * @typedef {Object} EditProjectModalOptions
 * @property {ProjectModalPerson[]} people
 * @property {ProjectFormValues} initialValues
 * @property {(values: ProjectFormValues) => Promise<void>} onSubmit
 * @property {() => void} [onClose]
 */

/**
 * Opens the edit project modal with pre-filled values.
 *
 * @param {EditProjectModalOptions} options
 * @returns {{ close: () => void }}
 */
export function openEditProjectModal(options) {
  return openProjectModal({
    people: options.people,
    initialValues: options.initialValues,
    title: "Edit Project",
    submitLabel: "Save changes",
    onSubmit: options.onSubmit,
    onClose: options.onClose,
  });
}
