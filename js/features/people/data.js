import {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
} from "../../db.js";
import { assertValidPerson, normalizePerson } from "./person-record.js";

const PEOPLE_STORE = "people";

/**
 * Creates a new person record with immutable identity and timestamp metadata.
 *
 * @param {{ name: string, organisation?: string, notes?: string }} personInput
 * @returns {Promise<{ id: string, name: string, organisation: string, notes: string, createdAt: string, updatedAt: string }>}
 */
export async function createPerson(personInput) {
  assertValidPerson(personInput);

  const nowIso = new Date().toISOString();
  const normalizedInput = normalizePerson(personInput);

  const personRecord = {
    id: crypto.randomUUID(),
    name: normalizedInput.name,
    organisation: normalizedInput.organisation,
    notes: normalizedInput.notes,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await createEntity(PEOPLE_STORE, personRecord);

  return personRecord;
}

/**
 * Updates an existing person while preserving immutable fields (`id`, `createdAt`).
 *
 * @param {string} personId
 * @param {{ name?: string, organisation?: string, notes?: string, id?: string, createdAt?: string }} personInput
 * @returns {Promise<{ id: string, name: string, organisation: string, notes: string, createdAt: string, updatedAt: string }>}
 */
export async function updatePerson(personId, personInput) {
  const existingPersonRecord = await getEntity(PEOPLE_STORE, personId);

  if (!existingPersonRecord) {
    throw new Error(`Person not found for id "${personId}".`);
  }

  const existingPerson = normalizePerson(existingPersonRecord);
  const incomingPerson = normalizePerson(personInput);
  const hasNameUpdate =
    !!personInput && Object.prototype.hasOwnProperty.call(personInput, "name");
  const hasOrganisationUpdate =
    !!personInput &&
    Object.prototype.hasOwnProperty.call(personInput, "organisation");
  const hasNotesUpdate =
    !!personInput && Object.prototype.hasOwnProperty.call(personInput, "notes");

  const updatedPerson = {
    id: existingPerson.id,
    name: hasNameUpdate ? incomingPerson.name : existingPerson.name,
    organisation: hasOrganisationUpdate
      ? incomingPerson.organisation
      : existingPerson.organisation,
    notes: hasNotesUpdate ? incomingPerson.notes : existingPerson.notes,
    createdAt: existingPerson.createdAt,
    updatedAt: new Date().toISOString(),
  };

  assertValidPerson(updatedPerson);

  const savedPerson = await updateEntity(PEOPLE_STORE, personId, updatedPerson);

  return normalizePerson(savedPerson);
}

/**
 * Returns a single person in canonical UI shape.
 *
 * @param {string} personId
 * @returns {Promise<{ id: string, name: string, organisation: string, notes: string, createdAt: string, updatedAt: string }|null>}
 */
export async function getPerson(personId) {
  const person = await getEntity(PEOPLE_STORE, personId);
  return person ? normalizePerson(person) : null;
}

/**
 * Returns all people in canonical UI shape.
 *
 * @returns {Promise<Array<{ id: string, name: string, organisation: string, notes: string, createdAt: string, updatedAt: string }>>}
 */
export async function listPeople() {
  const people = await listEntities(PEOPLE_STORE);
  return people.map(normalizePerson);
}
