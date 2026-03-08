import test from 'node:test';
import assert from 'node:assert/strict';

function createElementStub() {
  return {
    innerHTML: '',
    textContent: '',
    className: '',
    style: {},
    classList: { add() {}, remove() {} },
    addEventListener() {}
  };
}

test('project modal patch builder applies editable tab fields and owner mapping', async () => {
  const nodes = new Map();
  globalThis.document = {
    addEventListener() {},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createElementStub());
      return nodes.get(id);
    },
    querySelectorAll() {
      return [];
    }
  };

  const { buildProjectUpdatePatch } = await import('../src/events/wireInteractions.js');
  const current = {
    id: 'project-1',
    name: 'Alpha',
    status: 'Planning',
    stage: 'Design',
    health: 'Green',
    cadence: 'Monthly',
    startDate: '01 Jan 2026',
    targetDate: '31 Dec 2026',
    lastReview: '-',
    description: 'Baseline',
    ownerPersonId: 'person-1'
  };
  const people = [
    { id: 'person-1', name: 'Jane' },
    { id: 'person-2', name: 'Chris' }
  ];

  const patch = buildProjectUpdatePatch(current, {
    name: 'Alpha 2',
    owner: 'Chris',
    status: 'In progress',
    stage: 'Delivery',
    health: 'Amber',
    cadence: 'Weekly',
    startDate: '02 Jan 2026',
    targetDate: '30 Nov 2026',
    lastReview: '20 Jan 2026',
    description: 'Updated from tabs'
  }, people);

  assert.deepEqual(patch, {
    name: 'Alpha 2',
    status: 'In progress',
    stage: 'Delivery',
    health: 'Amber',
    cadence: 'Weekly',
    startDate: '02 Jan 2026',
    targetDate: '30 Nov 2026',
    lastReview: '20 Jan 2026',
    description: 'Updated from tabs',
    ownerPersonId: 'person-2'
  });
});
