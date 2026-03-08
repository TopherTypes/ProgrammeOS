import test from 'node:test';
import assert from 'node:assert/strict';

function createElementStub() {
  return {
    innerHTML: '',
    textContent: '',
    className: '',
    style: {},
    classList: { add() {}, remove() {} }
  };
}

test('project edit body renders concrete editable controls for all project tabs', async () => {
  const nodes = new Map();
  globalThis.document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, createElementStub());
      return nodes.get(id);
    }
  };

  const { setAppData } = await import('../src/state/store.js');
  const { projectEditBody } = await import('../src/render/app.js');

  setAppData({
    projects: [{
      name: 'Alpha',
      owner: 'Jane',
      status: 'In progress',
      lastReview: '01 Jan 2026',
      cadence: 'Monthly',
      description: 'Desc',
      startDate: '01 Jan 2026',
      targetDate: '31 Dec 2026',
      stage: 'Delivery',
      health: 'Amber',
      updates: [],
      decisions: [],
      actions: [],
      raid: [],
      meetings: [],
      people: [{ name: 'Jane', role: 'Owner' }]
    }]
  });

  for (const tab of ['overview', 'raid', 'updates', 'meetings', 'people', 'actions', 'decisions']) {
    const html = projectEditBody(0, tab);
    assert.match(html, /data-crud-field=/, `expected editable field binding for ${tab}`);
    assert.doesNotMatch(html, /fully mocked|intended CRUD behaviour/i, `placeholder content should be removed for ${tab}`);
  }
});
