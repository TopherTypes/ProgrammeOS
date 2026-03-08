/** Central UI state store for current view and modal/create wizard state shared across modules. */
export const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projects', label: 'Projects' },
  { key: 'people', label: 'People' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'updates', label: 'Updates' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'actions', label: 'Actions' },
  { key: 'raid', label: 'Programme RAID' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' }
];

export const state = {
  currentView: 'dashboard',
  currentRaidTab: 'Risk',
  modalState: { type: null, index: null, tab: 'overview', edit: false },
  crudState: {
    type: 'Project',
    step: 0,
    context: 'global',
    mode: 'create',
    entityId: null,
    values: {},
    sourceModal: null,
    errors: {},
    feedback: ''
  },
  appData: null
};

/**
 * Stores the denormalized projection consumed by render functions.
 * Keeping this in state allows the repository to own persistence and migrations.
 */
export function setAppData(appData) {
  state.appData = appData;
}
