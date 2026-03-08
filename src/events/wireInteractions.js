/** Delegated event wiring for all dynamic UI content; assumes renderers update DOM using stable data-* attributes. */
import { repository } from '../data/repository.js';
import { state, setAppData } from '../state/store.js';
import { handleDataClick, openCrud, render, renderCrud, renderModal, renderRaid, wireChecks } from '../render/app.js';

let wired = false;

const stepCounts = {
  Project: 4,
  'RAID item': 4,
  Meeting: 4,
  Update: 4,
  Decision: 4,
  Action: 4,
  Person: 3
};

const crudRepositoryMap = {
  Project: 'projects',
  Person: 'people',
  Meeting: 'meetings',
  Update: 'updates',
  Decision: 'decisions',
  Action: 'actions',
  'RAID item': 'raidItems'
};

const modalCrudTypeMap = {
  person: 'Person',
  meeting: 'Meeting',
  update: 'Update',
  decision: 'Decision',
  action: 'Action',
  raid: 'RAID item'
};

const modalCollectionMap = {
  person: 'people',
  update: 'updates',
  decision: 'decisions',
  action: 'actions',
  raid: 'raidGlobal'
};

function collectCrudStepValues() {
  document.querySelectorAll('#crud-content [data-crud-field]').forEach((field) => {
    state.crudState.values[field.dataset.crudField] = field.value;
  });
}

function validateCrudValues(type, values) {
  const requiredByType = {
    Project: ['name', 'owner'],
    Person: ['name'],
    Meeting: ['title', 'date'],
    Update: ['title'],
    Decision: ['title'],
    Action: ['title', 'owner'],
    'RAID item': ['type', 'text']
  };
  const errors = {};
  (requiredByType[type] || []).forEach((field) => {
    if (!String(values[field] || '').trim()) errors[field] = 'This field is required.';
  });
  return errors;
}

function payloadForCrud(type, values, mode) {
  const source = state.crudState.context === 'global' ? 'global' : 'project';
  if (type === 'Project') {
    return {
      name: values.name,
      owner: values.owner,
      status: values.status || 'Planning',
      stage: values.stage || 'Design',
      startDate: values.startDate || '-',
      targetDate: values.targetDate || '-',
      cadence: values.cadence || 'Monthly',
      health: values.health || 'Green',
      description: values.description || '',
      lastReview: '-',
      peopleIds: [],
      meetingIds: [],
      updateIds: [],
      decisionIds: [],
      actionIds: [],
      raidItemIds: []
    };
  }
  if (type === 'Person') {
    return {
      name: values.name,
      role: values.role || 'Other',
      summary: values.notes || '',
      cadence: values.cadence || 'Monthly',
      lastMeeting: values.lastMeeting || '-',
      lastInteraction: values.lastInteraction || '-',
      cadenceSnoozeDays: Number(values.cadenceSnoozeDays) || 0
    };
  }
  if (type === 'Meeting') return { title: values.title, date: values.date, project: values.related || 'Programme', context: values.context || 'Programme', attendeePersonIds: [], outputs: 'Capture pending', source };
  if (type === 'Update') return { title: values.title, text: values.title, project: values.project || 'Programme', meeting: values.meeting || '-', status: 'Open', inform: values.people || '-', source };
  if (type === 'Decision') return { title: values.title, decision: values.title, project: values.project || 'Programme', meeting: values.meeting || '-', rationale: values.rationale || '-', impact: values.impact || '-', status: 'Open', source };
  if (type === 'Action') return { title: values.title, project: values.project || 'Programme', meeting: values.meeting || '-', due: values.due || '-', status: 'Open', owner: values.owner || '-', summary: '', progress: [], source };
  if (type === 'RAID item') return { type: values.type || 'Risk', text: values.text, project: values.project || 'Programme', meeting: values.meeting || '-', owner: values.owner || '-', due: values.due || '-', status: 'Open', impact: '-', source };
  return mode === 'edit' ? {} : values;
}

async function resolveEntityIdForModalType(modalType, index) {
  const crudType = modalCrudTypeMap[modalType];
  if (!crudType) return null;
  const repoKey = crudRepositoryMap[crudType];
  const entities = await repository[repoKey].list();
  return entities[index]?.id || null;
}

function valuesFromModalData(modalType, index) {
  if (modalType === 'person') {
    const person = state.appData.people[index];
    return {
      name: person?.name || '',
      role: person?.role || '',
      notes: person?.summary || '',
      cadence: person?.cadence || 'Monthly',
      lastMeeting: person?.lastMeeting || '-',
      lastInteraction: person?.lastInteraction || '-',
      cadenceSnoozeDays: String(person?.cadenceSnoozeDays || 0)
    };
  }
  if (modalType === 'update') {
    const update = state.appData.updates[index];
    return { title: update?.title || '', project: update?.project || '', meeting: update?.meeting || '', people: update?.people || '' };
  }
  if (modalType === 'decision') {
    const decision = state.appData.decisions[index];
    return { title: decision?.title || '', project: decision?.project || '', rationale: decision?.rationale || '' };
  }
  if (modalType === 'action') {
    const action = state.appData.actions[index];
    return { title: action?.title || '', owner: action?.owner || '', due: action?.due || '', project: action?.project || '' };
  }
  if (modalType === 'raid') {
    const raid = state.appData.raidGlobal[index];
    return { type: raid?.type || 'Risk', text: raid?.text || '', owner: raid?.owner || '', due: raid?.due || '', project: raid?.project || '' };
  }
  return {};
}

function refreshModalIfPossible() {
  if (!state.modalState.type) return;
  const collectionKey = modalCollectionMap[state.modalState.type];
  if (!collectionKey) return;
  if ((state.appData[collectionKey] || []).length === 0) {
    document.getElementById('modal-backdrop').classList.remove('open');
    return;
  }
  state.modalState.index = Math.min(state.modalState.index, state.appData[collectionKey].length - 1);
  renderModal();
  document.getElementById('modal-backdrop').classList.add('open');
}

async function refreshFromRepository({ keepModalOpen = false } = {}) {
  const appData = await repository.getAppData();
  setAppData(appData);
  render();
  if (keepModalOpen) refreshModalIfPossible();
}

async function saveCrudFlow() {
  collectCrudStepValues();
  const errors = validateCrudValues(state.crudState.type, state.crudState.values);
  if (Object.keys(errors).length > 0) {
    state.crudState.errors = errors;
    state.crudState.feedback = 'Please fix highlighted fields before saving.';
    renderCrud();
    return;
  }

  const repoKey = crudRepositoryMap[state.crudState.type];
  const payload = payloadForCrud(state.crudState.type, state.crudState.values, state.crudState.mode);
  if (state.crudState.mode === 'edit' && state.crudState.entityId) {
    await repository[repoKey].update(state.crudState.entityId, payload);
    state.crudState.feedback = `${state.crudState.type} updated successfully.`;
  } else {
    await repository[repoKey].create(payload);
    state.crudState.feedback = `${state.crudState.type} created successfully.`;
  }

  document.getElementById('crud-backdrop').classList.remove('open');
  await refreshFromRepository({ keepModalOpen: Boolean(state.crudState.sourceModal) });
}

export function wireInteractions() {
  if (wired) return;
  wired = true;

  document.addEventListener('click', async (event) => {
    const clickRow = event.target.closest('[data-click]');
    if (clickRow) {
      handleDataClick(clickRow.dataset.click, clickRow.dataset.source === 'dashboard');
      return;
    }

    const navBtn = event.target.closest('.nav-item[data-view]');
    if (navBtn) {
      state.currentView = navBtn.dataset.view;
      render();
      return;
    }

    const gotoBtn = event.target.closest('[data-goto]');
    if (gotoBtn) {
      state.currentView = gotoBtn.dataset.goto;
      render();
      return;
    }

    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn?.dataset.action === 'load-sample-data') {
      await repository.loadSampleData();
      await refreshFromRepository();
      return;
    }

    const raidTab = event.target.closest('[data-raid-tab]');
    if (raidTab) {
      state.currentRaidTab = raidTab.dataset.raidTab;
      renderRaid();
      return;
    }

    const projectTab = event.target.closest('[data-project-tab]');
    if (projectTab) {
      state.modalState.tab = projectTab.dataset.projectTab;
      renderModal();
      return;
    }

    const modalAction = event.target.closest('[data-modal-action]');
    if (modalAction) {
      const modalType = state.modalState.type;
      const modalIndex = state.modalState.index;
      const crudType = modalCrudTypeMap[modalType];
      if (!crudType) return;

      if (modalAction.dataset.modalAction === 'edit') {
        const entityId = await resolveEntityIdForModalType(modalType, modalIndex);
        if (!entityId) return;
        openCrud(crudType, 'contextual', {
          mode: 'edit',
          entityId,
          values: valuesFromModalData(modalType, modalIndex),
          sourceModal: { type: modalType, index: modalIndex }
        });
        return;
      }

      if (modalAction.dataset.modalAction === 'delete') {
        const entityId = await resolveEntityIdForModalType(modalType, modalIndex);
        if (!entityId) return;
        const repoKey = crudRepositoryMap[crudType];
        await repository[repoKey].remove(entityId);
        await refreshFromRepository({ keepModalOpen: true });
        return;
      }
    }

    const createBtn = event.target.closest('[data-create]');
    if (createBtn) {
      openCrud(createBtn.dataset.create, createBtn.dataset.context || 'global');
      return;
    }

    if (event.target.id === 'modal-close') {
      document.getElementById('modal-backdrop').classList.remove('open');
      return;
    }

    if (event.target.id === 'modal-edit-btn') {
      state.modalState.edit = !state.modalState.edit;
      event.target.textContent = state.modalState.edit ? 'View mode' : 'Edit mode';
      renderModal();
      return;
    }

    if (event.target.id === 'global-create') return openCrud('Project', 'global');
    if (event.target.id === 'crud-close' || event.target.id === 'crud-cancel') {
      document.getElementById('crud-backdrop').classList.remove('open');
      return;
    }
    if (event.target.id === 'crud-prev' && state.crudState.step > 0) {
      collectCrudStepValues();
      state.crudState.step -= 1;
      renderCrud();
      return;
    }
    if (event.target.id === 'crud-next') {
      collectCrudStepValues();
      const max = (stepCounts[state.crudState.type] || stepCounts.Project) - 1;
      if (state.crudState.step < max) {
        state.crudState.step += 1;
        state.crudState.errors = {};
        state.crudState.feedback = '';
        renderCrud();
      } else {
        await saveCrudFlow();
      }
      return;
    }
    if (event.target.id === 'crud-context') {
      state.crudState.context = state.crudState.context === 'global' ? 'contextual' : 'global';
      renderCrud();
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-check]')) {
      event.target.closest('.check-row')?.classList.toggle('done', event.target.checked);
    }
    if (event.target.matches('#crud-content [data-crud-field]')) {
      state.crudState.values[event.target.dataset.crudField] = event.target.value;
      delete state.crudState.errors[event.target.dataset.crudField];
    }
  });

  document.getElementById('modal-backdrop').addEventListener('click', (event) => {
    if (event.target.id === 'modal-backdrop') event.target.classList.remove('open');
  });

  wireChecks();
}
