/** Delegated event wiring for all dynamic UI content; assumes renderers update DOM using stable data-* attributes. */
import { state } from '../state/store.js';
import { handleDataClick, openCrud, render, renderCrud, renderModal, renderRaid, wireChecks } from '../render/app.js';

let wired = false;

export function wireInteractions() {
  if (wired) return;
  wired = true;

  document.addEventListener('click', (event) => {
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
      state.crudState.step -= 1;
      renderCrud();
      return;
    }
    if (event.target.id === 'crud-next') {
      const steps = {
        Project: 4, 'RAID item': 4, Meeting: 4, Update: 4, Decision: 4, Action: 4, Person: 3
      };
      const max = (steps[state.crudState.type] || steps.Project) - 1;
      if (state.crudState.step < max) {
        state.crudState.step += 1;
        renderCrud();
      } else {
        document.getElementById('crud-backdrop').classList.remove('open');
      }
      return;
    }
    if (event.target.id === 'crud-context') {
      state.crudState.context = state.crudState.context === 'global' ? 'contextual' : 'global';
      renderCrud();
      return;
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-check]')) {
      event.target.closest('.check-row')?.classList.toggle('done', event.target.checked);
    }
  });

  document.getElementById('modal-backdrop').addEventListener('click', (event) => {
    if (event.target.id === 'modal-backdrop') event.target.classList.remove('open');
  });

  wireChecks();
}
