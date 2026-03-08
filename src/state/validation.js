/**
 * Entity-focused validation rules used by CRUD flows and tests.
 * Rules include required fields, date validation, enum checks, and relationship integrity.
 */
const MONTHS = new Set(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

export const statusEnums = {
  Project: ['Planning', 'Active', 'Closed'],
  Action: ['Open', 'Due today', 'Overdue', 'Closed'],
  Update: ['Open', 'Pending informs', 'Partially informed', 'Closed'],
  Decision: ['Open', 'Pending informs', 'Partially informed', 'Closed'],
  'RAID item': ['Open', 'Monitoring', 'Overdue', 'Pending informs', 'Closed']
};

const requiredByType = {
  Project: ['name', 'owner'],
  Person: ['name'],
  Meeting: ['title', 'date'],
  Update: ['title'],
  Decision: ['title'],
  Action: ['title', 'owner'],
  'RAID item': ['type', 'text']
};

const dateFieldsByType = {
  Project: ['startDate', 'targetDate'],
  Person: ['lastMeeting', 'lastInteraction'],
  Meeting: ['date'],
  Action: ['due'],
  'RAID item': ['due']
};

const enumFieldsByType = {
  Project: { status: statusEnums.Project, stage: ['Design', 'Delivery', 'Closure'], health: ['Green', 'Amber', 'Red'], cadence: ['Weekly', 'Monthly', 'Quarterly'] },
  Person: { cadence: ['Optional', 'Monthly'] },
  'RAID item': { type: ['Risk', 'Action', 'Issue', 'Decision'] }
};

export const crudFieldsByTypeStep = {
  Project: [['name', 'owner', 'status', 'stage'], ['startDate', 'targetDate', 'cadence', 'health'], ['description'], ['personA', 'roleA', 'personB', 'roleB']],
  Update: [['title'], ['project', 'meeting'], ['people', 'loggedBy'], []],
  Decision: [['title'], ['project', 'meeting'], ['rationale', 'impact'], ['people']],
  Action: [['title'], ['owner', 'due'], ['project', 'meeting'], ['people']],
  Meeting: [['title', 'date'], ['context', 'related'], ['attendees'], []],
  Person: [['name', 'role'], ['notes', 'cadence', 'lastMeeting', 'lastInteraction', 'cadenceSnoozeDays'], []],
  'RAID item': [['type', 'text'], ['owner', 'due'], ['project', 'meeting'], []]
};

function isBlank(value) {
  return !String(value ?? '').trim();
}

export function isValidDisplayDate(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!value || value === '-') return true;
  const match = value.match(/^(\d{1,2})\s([A-Z][a-z]{2})\s(\d{4})(?:\s·\s\d{2}:\d{2}(?:[–-]\d{2}:\d{2})?)?$/);
  if (!match) return false;

  const [, dayText, month, yearText] = match;
  const day = Number(dayText);
  const year = Number(yearText);
  if (!MONTHS.has(month) || day < 1 || day > 31 || year < 1900) return false;

  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
  const candidate = new Date(Date.UTC(year, monthIndex, day));
  return candidate.getUTCDate() === day && candidate.getUTCMonth() === monthIndex && candidate.getUTCFullYear() === year;
}

function validateRequired(type, values, errors) {
  (requiredByType[type] || []).forEach((field) => {
    if (isBlank(values[field])) errors[field] = 'This field is required.';
  });
}

function validateDates(type, values, errors) {
  (dateFieldsByType[type] || []).forEach((field) => {
    if (!isValidDisplayDate(values[field])) errors[field] = 'Enter a valid date (e.g. 07 Mar 2026).';
  });
}

function validateEnums(type, values, errors) {
  const fieldEnums = enumFieldsByType[type] || {};
  Object.entries(fieldEnums).forEach(([field, options]) => {
    if (isBlank(values[field])) return;
    if (!options.includes(values[field])) errors[field] = `Choose a valid value (${options.join(', ')}).`;
  });
}

function validateRelationships(type, values, errors, options) {
  const personIds = new Set(options.personIds || []);
  const personNames = new Set((options.people || []).map((person) => String(person.name || '').trim().toLowerCase()));

  const ownerRef = values.ownerPersonId || values.ownerId || values.owner;
  if (String(ownerRef || '').startsWith('person-') && !personIds.has(ownerRef)) {
    errors.owner = 'Owner reference is invalid (unknown person ID).';
  }

  if (['Project', 'Action', 'RAID item'].includes(type) && !isBlank(values.owner) && !String(values.owner).startsWith('person-')) {
    const ownerName = String(values.owner).trim().toLowerCase();
    if (personNames.size > 0 && !personNames.has(ownerName)) {
      errors.owner = 'Owner must match an existing person.';
    }
  }
}

export function validateCrudValues(type, values, options = {}) {
  const errors = {};
  validateRequired(type, values, errors);
  validateDates(type, values, errors);
  validateEnums(type, values, errors);
  validateRelationships(type, values, errors, options);

  return errors;
}

export function validateCrudStep(type, step, values, options = {}) {
  const errors = validateCrudValues(type, values, options);
  const fields = crudFieldsByTypeStep[type]?.[step] || [];
  return Object.fromEntries(Object.entries(errors).filter(([field]) => fields.includes(field)));
}
