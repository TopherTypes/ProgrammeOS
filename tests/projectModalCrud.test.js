import test from 'node:test';
import assert from 'node:assert/strict';

function createElementStub() {
  return {
    innerHTML: '',
    textContent: '',
    className: '',
    style: {},
    dataset: {},
    value: '',
    files: [],
    classList: { add() {}, remove() {} },
    addEventListener() {},
    click() {}
  };
}

test('project modal edit/delete actions route through CRUD mode and repository remove', async () => {
  const listeners = new Map();
  const nodes = new Map();

  globalThis.document = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createElementStub());
      return nodes.get(id);
    },
    querySelectorAll() {
      return [];
    },
    body: {
      appendChild() {}
    },
    createElement() {
      return createElementStub();
    }
  };

  globalThis.window = {
    confirm: () => true,
    alert() {}
  };

  globalThis.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };

  globalThis.URL = {
    createObjectURL: () => 'blob:test',
    revokeObjectURL() {}
  };

  const { state, setAppData } = await import('../src/state/store.js');
  const { repository } = await import('../src/data/repository.js');
  const { wireInteractions } = await import('../src/events/wireInteractions.js');

  const removedIds = [];
  repository.projects.list = async () => [{ id: 'project-1' }, { id: 'project-2' }];
  repository.projects.remove = async (id) => {
    removedIds.push(id);
    return true;
  };
  repository.getAppData = async () => ({
    projects: [{ id: 'project-1', name: 'Alpha', owner: 'Jane', status: 'Planning', stage: 'Design', health: 'Green', cadence: 'Monthly', startDate: '01 Jan 2026', targetDate: '31 Dec 2026', lastReview: '-', description: 'A', updates: [], decisions: [], actions: [], raid: [], meetings: [], people: [] }],
    people: [],
    updates: [],
    decisions: [],
    actions: [],
    raidGlobal: [],
    informs: [],
    meeting: { title: '-', context: '-', date: '-', agenda: [], updates: [], decisions: [], actions: [] }
  });

  setAppData({
    projects: [
      { name: 'Alpha', owner: 'Jane', status: 'Planning', stage: 'Design', health: 'Green', cadence: 'Monthly', startDate: '01 Jan 2026', targetDate: '31 Dec 2026', lastReview: '-', description: 'A' },
      { name: 'Bravo', owner: 'Chris', status: 'In progress', stage: 'Delivery', health: 'Amber', cadence: 'Weekly', startDate: '02 Jan 2026', targetDate: '30 Nov 2026', lastReview: '15 Jan 2026', description: 'B' }
    ],
    people: [],
    updates: [],
    decisions: [],
    actions: [],
    raidGlobal: [],
    informs: [],
    meeting: { title: '-', context: '-', date: '-', agenda: [], updates: [], decisions: [], actions: [] }
  });

  state.modalState = { type: 'project', index: 1, tab: 'overview', edit: false };

  wireInteractions();

  const clickListener = listeners.get('click');
  assert.ok(clickListener, 'click listener should be registered');

  await clickListener({
    target: {
      closest(selector) {
        if (selector === '[data-modal-action]') return { dataset: { modalAction: 'edit' } };
        return null;
      }
    }
  });

  assert.equal(state.crudState.mode, 'edit');
  assert.equal(state.crudState.type, 'Project');
  assert.equal(state.crudState.entityId, 'project-2');
  assert.deepEqual(state.crudState.values, {
    name: 'Bravo',
    owner: 'Chris',
    status: 'In progress',
    stage: 'Delivery',
    health: 'Amber',
    cadence: 'Weekly',
    startDate: '02 Jan 2026',
    targetDate: '30 Nov 2026',
    lastReview: '15 Jan 2026',
    description: 'B'
  });

  await clickListener({
    target: {
      closest(selector) {
        if (selector === '[data-modal-action]') return { dataset: { modalAction: 'delete' } };
        return null;
      }
    }
  });

  assert.deepEqual(removedIds, ['project-2']);
});
