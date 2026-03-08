/**
 * IndexedDB-backed repository for ProgrammeOS data.
 *
 * The repository persists a normalized graph (people linked by ids across entities)
 * and exposes denormalized selectors that keep the existing render layer stable.
 */
import { data as mockData } from './mockData.js';

const DB_NAME = 'programmeos';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const RECORD_KEY = 'main';
const SCHEMA_VERSION = 1;

const ENTITY_KEYS = {
  projects: 'projects',
  people: 'people',
  meetings: 'meetings',
  updates: 'updates',
  decisions: 'decisions',
  actions: 'actions',
  raidItems: 'raidItems'
};

let dbPromise;
let cache;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCollection() {
  return { byId: {}, allIds: [] };
}

function createEmptyNormalized() {
  return {
    schemaVersion: SCHEMA_VERSION,
    counters: {
      project: 0,
      person: 0,
      meeting: 0,
      update: 0,
      decision: 0,
      action: 0,
      raid: 0
    },
    entities: {
      projects: createCollection(),
      people: createCollection(),
      meetings: createCollection(),
      updates: createCollection(),
      decisions: createCollection(),
      actions: createCollection(),
      raidItems: createCollection()
    },
    aggregates: {
      informs: [],
      meetingWorkspace: null
    }
  };
}

function nextId(normalized, type) {
  normalized.counters[type] += 1;
  return `${type}-${normalized.counters[type]}`;
}

function insertEntity(collection, entity) {
  collection.byId[entity.id] = entity;
  if (!collection.allIds.includes(entity.id)) collection.allIds.push(entity.id);
}

function normaliseFromMock(source) {
  const normalized = createEmptyNormalized();
  const personNameToId = new Map();
  const projectNameToId = new Map();
  const meetingTitleToId = new Map();

  const ensurePerson = (name, fallback = {}) => {
    const normalizedName = (name || 'Unknown').trim();
    const key = normalizedName.toLowerCase();
    if (personNameToId.has(key)) {
      const id = personNameToId.get(key);
      const existing = normalized.entities.people.byId[id];
      normalized.entities.people.byId[id] = { ...existing, ...fallback, id, name: existing.name };
      return id;
    }
    const id = nextId(normalized, 'person');
    insertEntity(normalized.entities.people, {
      id,
      name: normalizedName,
      role: fallback.role || 'Other',
      lastMeeting: fallback.lastMeeting || '-',
      cadence: fallback.cadence || 'Monthly',
      lastInteraction: fallback.lastInteraction || '-',
      cadenceSnoozeDays: Number(fallback.cadenceSnoozeDays) || 0,
      summary: fallback.summary || ''
    });
    personNameToId.set(key, id);
    return id;
  };

  const ensureProjectId = (projectName) => {
    const key = (projectName || 'Programme').toLowerCase();
    return projectNameToId.get(key) || null;
  };

  source.people.forEach((person) => ensurePerson(person.name, person));

  source.projects.forEach((project) => {
    const projectId = nextId(normalized, 'project');
    projectNameToId.set(project.name.toLowerCase(), projectId);

    const ownerPersonId = ensurePerson(project.owner, { role: 'Owner' });

    const peopleIds = project.people.map((projectPerson) => ensurePerson(projectPerson.name, projectPerson));

    const meetingIds = project.meetings.map((meeting) => {
      const id = nextId(normalized, 'meeting');
      const attendeePersonIds = String(meeting.attendees || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ensurePerson(name));
      insertEntity(normalized.entities.meetings, {
        id,
        projectId,
        date: meeting.date,
        title: meeting.title,
        attendeePersonIds,
        outputs: meeting.outputs,
        source: 'project'
      });
      meetingTitleToId.set(meeting.title.toLowerCase(), id);
      return id;
    });

    const updateIds = project.updates.map((update) => {
      const id = nextId(normalized, 'update');
      insertEntity(normalized.entities.updates, {
        id,
        projectId,
        dateLogged: update.dateLogged,
        text: update.text,
        meeting: update.meeting,
        meetingId: meetingTitleToId.get(String(update.meeting || '').toLowerCase()) || null,
        inform: update.inform,
        status: update.status,
        source: 'project'
      });
      return id;
    });

    const decisionIds = project.decisions.map((decision) => {
      const id = nextId(normalized, 'decision');
      insertEntity(normalized.entities.decisions, {
        id,
        projectId,
        dateLogged: decision.dateLogged,
        decision: decision.decision,
        rationale: decision.rationale,
        impact: decision.impact,
        source: 'project'
      });
      return id;
    });

    const actionIds = project.actions.map((action) => {
      const id = nextId(normalized, 'action');
      insertEntity(normalized.entities.actions, {
        id,
        projectId,
        title: action.title,
        ownerPersonId: ensurePerson(action.owner),
        due: action.due,
        status: action.status,
        source: 'project'
      });
      return id;
    });

    const raidItemIds = project.raid.map((raidItem) => {
      const id = nextId(normalized, 'raid');
      insertEntity(normalized.entities.raidItems, {
        id,
        projectId,
        type: raidItem.type,
        text: raidItem.title,
        dateLogged: raidItem.dateLogged,
        ownerPersonId: ensurePerson(raidItem.owner),
        due: raidItem.due,
        status: raidItem.status,
        severity: raidItem.severity,
        mitigation: raidItem.mitigation,
        meeting: raidItem.meeting,
        lastUpdated: raidItem.lastUpdated,
        impact: raidItem.mitigation,
        source: 'project'
      });
      return id;
    });

    insertEntity(normalized.entities.projects, {
      id: projectId,
      name: project.name,
      ownerPersonId,
      status: project.status,
      lastReview: project.lastReview,
      cadence: project.cadence,
      description: project.description,
      startDate: project.startDate,
      targetDate: project.targetDate,
      stage: project.stage,
      health: project.health,
      updateIds,
      decisionIds,
      actionIds,
      raidItemIds,
      meetingIds,
      peopleIds
    });
  });

  source.actions.forEach((action) => {
    const id = nextId(normalized, 'action');
    insertEntity(normalized.entities.actions, {
      id,
      title: action.title,
      ownerPersonId: ensurePerson(action.owner),
      due: action.due,
      status: action.status,
      projectId: ensureProjectId(action.project),
      project: action.project,
      summary: action.summary,
      progress: clone(action.progress || []),
      source: 'global'
    });
  });

  source.updates.forEach((update) => {
    const id = nextId(normalized, 'update');
    const informPersonIds = String(update.people || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ensurePerson(name));

    insertEntity(normalized.entities.updates, {
      id,
      title: update.title,
      date: update.date,
      projectId: ensureProjectId(update.project),
      project: update.project,
      meeting: update.meeting,
      meetingId: meetingTitleToId.get(String(update.meeting || '').toLowerCase()) || null,
      informPersonIds,
      status: update.status,
      source: 'global'
    });
  });

  source.decisions.forEach((decision) => {
    const id = nextId(normalized, 'decision');
    insertEntity(normalized.entities.decisions, {
      id,
      title: decision.title,
      date: decision.date,
      projectId: ensureProjectId(decision.project),
      project: decision.project,
      rationale: decision.rationale,
      status: decision.status,
      source: 'global'
    });
  });

  source.raidGlobal.forEach((raid) => {
    const id = nextId(normalized, 'raid');
    insertEntity(normalized.entities.raidItems, {
      id,
      type: raid.type,
      text: raid.text,
      ownerPersonId: ensurePerson(raid.owner),
      due: raid.due,
      status: raid.status,
      projectId: ensureProjectId(raid.project),
      project: raid.project,
      impact: raid.impact,
      source: 'global'
    });
  });

  normalized.aggregates.informs = source.informs.map((inform) => ({
    personId: ensurePerson(inform.person),
    pending: inform.pending,
    next: inform.next
  }));

  normalized.aggregates.meetingWorkspace = {
    title: source.meeting.title,
    context: source.meeting.context,
    date: source.meeting.date,
    agenda: clone(source.meeting.agenda || []),
    updates: clone(source.meeting.updates || []),
    decisions: clone(source.meeting.decisions || []),
    actions: clone(source.meeting.actions || [])
  };

  return normalized;
}

function toLegacyShape(normalized) {
  const people = normalized.entities.people.allIds.map((id) => clone(normalized.entities.people.byId[id]));
  const peopleById = normalized.entities.people.byId;
  const projectsById = normalized.entities.projects.byId;

  const projectName = (projectId, fallback = 'Programme') => {
    if (!projectId) return fallback;
    return projectsById[projectId]?.name || fallback;
  };

  const personName = (personId, fallback = 'Unknown') => peopleById[personId]?.name || fallback;

  const projects = normalized.entities.projects.allIds.map((projectId) => {
    const project = normalized.entities.projects.byId[projectId];
    return {
      name: project.name,
      owner: personName(project.ownerPersonId),
      status: project.status,
      lastReview: project.lastReview,
      cadence: project.cadence,
      description: project.description,
      startDate: project.startDate,
      targetDate: project.targetDate,
      stage: project.stage,
      health: project.health,
      updates: project.updateIds
        .map((id) => normalized.entities.updates.byId[id])
        .filter(Boolean)
        .map((update) => ({
          dateLogged: update.dateLogged || update.date || '-',
          text: update.text || update.title,
          meeting: update.meeting || '-',
          inform: update.inform || '-',
          status: update.status || 'Open'
        })),
      decisions: project.decisionIds
        .map((id) => normalized.entities.decisions.byId[id])
        .filter(Boolean)
        .map((decision) => ({
          dateLogged: decision.dateLogged || decision.date || '-',
          decision: decision.decision || decision.title,
          rationale: decision.rationale || '-',
          impact: decision.impact || '-'
        })),
      actions: project.actionIds
        .map((id) => normalized.entities.actions.byId[id])
        .filter(Boolean)
        .map((action) => ({
          title: action.title,
          owner: personName(action.ownerPersonId),
          due: action.due,
          status: action.status
        })),
      raid: project.raidItemIds
        .map((id) => normalized.entities.raidItems.byId[id])
        .filter(Boolean)
        .map((item) => ({
          type: item.type,
          title: item.text,
          dateLogged: item.dateLogged || '-',
          owner: personName(item.ownerPersonId),
          due: item.due || '-',
          status: item.status,
          severity: item.severity || '-',
          mitigation: item.mitigation || '-',
          meeting: item.meeting || '-',
          lastUpdated: item.lastUpdated || '-',
          impact: item.impact || '-'
        })),
      meetings: project.meetingIds
        .map((id) => normalized.entities.meetings.byId[id])
        .filter(Boolean)
        .map((meeting) => ({
          date: meeting.date,
          title: meeting.title,
          attendees: (meeting.attendeePersonIds || []).map((id) => personName(id)).join(', '),
          outputs: meeting.outputs
        })),
      people: project.peopleIds
        .map((id) => peopleById[id])
        .filter(Boolean)
        .map((person) => ({
          name: person.name,
          role: person.role,
          latestMeeting: person.lastMeeting,
          pendingInforms: '0',
          openActions: '0'
        }))
    };
  });

  const actions = normalized.entities.actions.allIds
    .map((id) => normalized.entities.actions.byId[id])
    .filter((action) => action.source === 'global')
    .map((action) => ({
      title: action.title,
      owner: personName(action.ownerPersonId),
      due: action.due,
      status: action.status,
      project: projectName(action.projectId, action.project),
      summary: action.summary || '',
      progress: clone(action.progress || [])
    }));

  const updates = normalized.entities.updates.allIds
    .map((id) => normalized.entities.updates.byId[id])
    .filter((update) => update.source === 'global')
    .map((update) => ({
      title: update.title || update.text,
      date: update.date || update.dateLogged,
      project: projectName(update.projectId, update.project),
      meeting: update.meeting || '-',
      people: (update.informPersonIds || []).map((id) => personName(id)).join(', '),
      status: update.status || 'Open'
    }));

  const decisions = normalized.entities.decisions.allIds
    .map((id) => normalized.entities.decisions.byId[id])
    .filter((decision) => decision.source === 'global')
    .map((decision) => ({
      title: decision.title || decision.decision,
      date: decision.date || decision.dateLogged,
      project: projectName(decision.projectId, decision.project),
      rationale: decision.rationale || '-',
      status: decision.status || 'Open'
    }));

  const informs = normalized.aggregates.informs.map((inform) => ({
    person: personName(inform.personId),
    pending: inform.pending,
    next: inform.next
  }));

  const raidGlobal = normalized.entities.raidItems.allIds
    .map((id) => normalized.entities.raidItems.byId[id])
    .filter((item) => item.source === 'global')
    .map((item) => ({
      type: item.type,
      text: item.text,
      owner: personName(item.ownerPersonId),
      due: item.due || '-',
      status: item.status,
      project: projectName(item.projectId, item.project),
      impact: item.impact || '-'
    }));

  return {
    projects,
    people: people.map((person) => ({
      name: person.name,
      role: person.role,
      lastMeeting: person.lastMeeting,
      cadence: person.cadence,
      lastInteraction: person.lastInteraction || '-',
      cadenceSnoozeDays: Number(person.cadenceSnoozeDays) || 0,
      summary: person.summary
    })),
    actions,
    updates,
    decisions,
    informs,
    meeting: clone(normalized.aggregates.meetingWorkspace),
    raidGlobal
  };
}

async function readRecord() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function writeRecord(normalized) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_NAME).put({ id: RECORD_KEY, schemaVersion: SCHEMA_VERSION, normalized });
  });
}

async function ensureLoaded() {
  if (cache) return cache;

  const record = await readRecord();
  if (!record || !record.normalized) {
    cache = normaliseFromMock(mockData);
    await writeRecord(cache);
    return cache;
  }

  if (record.schemaVersion !== SCHEMA_VERSION || record.normalized.schemaVersion !== SCHEMA_VERSION) {
    // For now the migration target is the current mock-data baseline.
    cache = normaliseFromMock(mockData);
    await writeRecord(cache);
    return cache;
  }

  cache = record.normalized;
  return cache;
}

async function persistAndReturn() {
  await writeRecord(cache);
  return toLegacyShape(cache);
}

function resolveCollection(entityType) {
  const key = ENTITY_KEYS[entityType];
  if (!key) throw new Error(`Unknown entity type: ${entityType}`);
  return cache.entities[key];
}

function resolveCounterKey(entityType) {
  if (entityType === 'raidItems') return 'raid';
  return entityType.slice(0, -1);
}

async function listEntities(entityType) {
  await ensureLoaded();
  const collection = resolveCollection(entityType);
  return collection.allIds.map((id) => clone(collection.byId[id]));
}

async function getEntity(entityType, id) {
  await ensureLoaded();
  const collection = resolveCollection(entityType);
  return collection.byId[id] ? clone(collection.byId[id]) : null;
}

async function createEntity(entityType, payload) {
  await ensureLoaded();
  const collection = resolveCollection(entityType);
  const id = nextId(cache, resolveCounterKey(entityType));
  insertEntity(collection, { id, ...clone(payload) });
  await writeRecord(cache);
  return clone(collection.byId[id]);
}

async function updateEntity(entityType, id, patch) {
  await ensureLoaded();
  const collection = resolveCollection(entityType);
  if (!collection.byId[id]) return null;
  collection.byId[id] = { ...collection.byId[id], ...clone(patch), id };
  await writeRecord(cache);
  return clone(collection.byId[id]);
}

async function removeEntity(entityType, id) {
  await ensureLoaded();
  const collection = resolveCollection(entityType);
  if (!collection.byId[id]) return false;
  delete collection.byId[id];
  collection.allIds = collection.allIds.filter((existingId) => existingId !== id);
  await writeRecord(cache);
  return true;
}

export const repository = {
  async initialize() {
    await ensureLoaded();
    return toLegacyShape(cache);
  },
  async getAppData() {
    await ensureLoaded();
    return toLegacyShape(cache);
  },
  async loadSampleData() {
    cache = normaliseFromMock(mockData);
    return persistAndReturn();
  },
  async clearAllData() {
    cache = createEmptyNormalized();
    return persistAndReturn();
  },
  projects: {
    list: () => listEntities('projects'),
    getById: (id) => getEntity('projects', id),
    create: (payload) => createEntity('projects', payload),
    update: (id, patch) => updateEntity('projects', id, patch),
    remove: (id) => removeEntity('projects', id)
  },
  people: {
    list: () => listEntities('people'),
    getById: (id) => getEntity('people', id),
    create: (payload) => createEntity('people', payload),
    update: (id, patch) => updateEntity('people', id, patch),
    remove: (id) => removeEntity('people', id)
  },
  meetings: {
    list: () => listEntities('meetings'),
    getById: (id) => getEntity('meetings', id),
    create: (payload) => createEntity('meetings', payload),
    update: (id, patch) => updateEntity('meetings', id, patch),
    remove: (id) => removeEntity('meetings', id)
  },
  updates: {
    list: () => listEntities('updates'),
    getById: (id) => getEntity('updates', id),
    create: (payload) => createEntity('updates', payload),
    update: (id, patch) => updateEntity('updates', id, patch),
    remove: (id) => removeEntity('updates', id)
  },
  decisions: {
    list: () => listEntities('decisions'),
    getById: (id) => getEntity('decisions', id),
    create: (payload) => createEntity('decisions', payload),
    update: (id, patch) => updateEntity('decisions', id, patch),
    remove: (id) => removeEntity('decisions', id)
  },
  actions: {
    list: () => listEntities('actions'),
    getById: (id) => getEntity('actions', id),
    create: (payload) => createEntity('actions', payload),
    update: (id, patch) => updateEntity('actions', id, patch),
    remove: (id) => removeEntity('actions', id)
  },
  raidItems: {
    list: () => listEntities('raidItems'),
    getById: (id) => getEntity('raidItems', id),
    create: (payload) => createEntity('raidItems', payload),
    update: (id, patch) => updateEntity('raidItems', id, patch),
    remove: (id) => removeEntity('raidItems', id)
  },
  // Utility exposed for debugging/migration verification.
  async getNormalizedSnapshot() {
    await ensureLoaded();
    return clone(cache);
  }
};

export { SCHEMA_VERSION };
