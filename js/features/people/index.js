import { renderPageFrame } from "../../layout.js";
import { createPerson, listPeople } from "./data.js";

/**
 * Builds the static frame for the people page.
 * Keeping frame rendering separate from data hydration keeps route rendering
 * snappy while IndexedDB reads complete.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
function renderPeoplePageFrame(outlets) {
  renderPageFrame(outlets, {
    title: "People",
    bodyHtml: `
      <section class="people-page" aria-label="People management">
        <form class="people-form" data-role="person-form">
          <div class="people-form-row">
            <label class="people-label" for="person-name">Name</label>
            <input id="person-name" name="name" class="people-input" type="text" required />
          </div>
          <div class="people-form-row">
            <label class="people-label" for="person-organisation">Organisation</label>
            <input id="person-organisation" name="organisation" class="people-input" type="text" />
          </div>
          <div class="people-form-actions">
            <button class="people-button" type="submit">Add person</button>
          </div>
          <p class="small-note" data-role="people-status" aria-live="polite"></p>
        </form>

        <section class="people-list" data-role="people-list" aria-label="People records"></section>
      </section>
    `,
  });
}


/**
 * Escapes user-provided strings before injecting into HTML templates.
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
 * Renders a dense table of people.
 * Falls back to an explicit empty-state message when no records exist.
 *
 * @param {HTMLElement} listContainer
 * @param {Array<{ id: string, name: string, organisation: string }>} people
 */
function renderPeopleList(listContainer, people) {
  if (people.length === 0) {
    listContainer.innerHTML = `
      <p class="small-note" data-role="people-empty-state">
        No people have been added yet. Create the first person using the form above.
      </p>
    `;
    return;
  }

  const rowsHtml = people
    .map(
      (person) => `
        <tr>
          <td>${escapeHtml(person.name)}</td>
          <td>${escapeHtml(person.organisation || "—")}</td>
        </tr>
      `
    )
    .join("");

  listContainer.innerHTML = `
    <table class="people-table">
      <caption class="visually-hidden">People records</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Organisation</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/**
 * Pulls fresh people data from the people data module and repaints the list.
 *
 * @param {HTMLElement} listContainer
 */
async function refreshPeopleList(listContainer) {
  const people = await listPeople();
  renderPeopleList(listContainer, people);
}

/**
 * Renders the people page and wires create/list interactions.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 */
export function renderPeoplePage(outlets) {
  renderPeoplePageFrame(outlets);

  const form = outlets.mainOutlet.querySelector('[data-role="person-form"]');
  const listContainer = outlets.mainOutlet.querySelector('[data-role="people-list"]');
  const statusText = outlets.mainOutlet.querySelector('[data-role="people-status"]');

  if (!(form instanceof HTMLFormElement) || !listContainer || !statusText) {
    throw new Error("People page failed to mount required containers.");
  }

  // Initial hydration for the route, without requiring a full app reload.
  refreshPeopleList(listContainer).catch((error) => {
    statusText.textContent = `Unable to load people: ${error.message}`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "");
    const organisation = String(formData.get("organisation") || "");

    try {
      await createPerson({ name, organisation });
      form.reset();
      statusText.textContent = "Person added.";

      // Re-render immediately so the new record is visible after create actions.
      await refreshPeopleList(listContainer);
    } catch (error) {
      statusText.textContent = `Unable to add person: ${error.message}`;
    }
  });
}
