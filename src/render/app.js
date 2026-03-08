/** Core rendering and modal/CRUD logic for ProgrammeOS; assumes static DOM ids from index.html exist. */
import { navItems, state } from '../state/store.js';
import { buildAttentionSnapshot } from '../state/attentionEngine.js';
import { escapeAttribute, escapeHtml } from './safeRender.js';
const nav = document.getElementById('nav');
const left = document.getElementById('left-column');
const right = document.getElementById('right-column');
const pageTitle = document.getElementById('page-title');
const pageKicker = document.getElementById('page-kicker');
const content = document.getElementById('content');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalBody = document.getElementById('modal-body');
const modalTabs = document.getElementById('modal-tabs');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');

const EMPTY_DATA = {
  projects: [],
  people: [],
  actions: [],
  updates: [],
  decisions: [],
  informs: [],
  meeting: { title: '-', context: '-', date: '-', agenda: [], updates: [], decisions: [], actions: [] },
  raidGlobal: []
};

const data = new Proxy({}, {
  get(_target, key) {
    const source = state.appData || EMPTY_DATA;
    return source[key];
  }
});

function badgeClass(label){
  const v = String(label).toLowerCase();
  if (v.includes('overdue') || v.includes('risk') || v.includes('red')) return 'red';
  if (v.includes('attention') || v.includes('meeting') || v.includes('open') || v.includes('due today') || v.includes('issue') || v.includes('amber')) return 'amber';
  if (v.includes('active') || v.includes('current') || v.includes('on track') || v.includes('complete') || v.includes('green')) return 'green';
  if (v.includes('planning') || v.includes('decision') || v.includes('monthly') || v.includes('dependency') || v.includes('approver') || v.includes('sme') || v.includes('owner')) return 'blue';
  if (v.includes('pending') || v.includes('inform') || v.includes('action') || v.includes('other')) return 'purple';
  return 'slate';
}
function badge(text, cls){ return `<span class="badge ${cls || badgeClass(text)}">${escapeHtml(text)}</span>`; }

function card(title, subtitle, contentHtml, rightBadge='', extraHead=''){
  return `<section class="card">
    <div class="card-head">
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>
      <div class="content-header-actions">${extraHead}${rightBadge}</div>
    </div>
    ${contentHtml}
  </section>`;
}
function table(headers, rows){
  return `<table><thead><tr>${headers.map((h)=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
function setLayout(isDashboard){
  content.className = isDashboard ? 'content dashboard' : 'content standard';
  right.style.display = isDashboard ? '' : 'none';
}

function listState(viewKey){
  if (!state.listViewState[viewKey]) state.listViewState[viewKey] = { query: '', status: 'All' };
  return state.listViewState[viewKey];
}

function normalizedText(value) {
  return String(value || '').toLowerCase();
}

function matchesListFilters(item, query, status, fields, statusField = 'status') {
  const q = normalizedText(query).trim();
  const textMatch = q.length === 0 || fields.some((field) => normalizedText(item[field]).includes(q));
  const statusMatch = status === 'All' || String(item[statusField] || '') === status;
  return textMatch && statusMatch;
}

function tableStateContent({ allRows, filteredRows, headers, emptyTitle, emptyDescription, noResultsTitle, noResultsDescription }) {
  if (allRows.length === 0) {
    return `<div class="panel-body"><div class="empty-state"><h4>${escapeHtml(emptyTitle)}</h4><p>${escapeHtml(emptyDescription)}</p></div></div>`;
  }
  if (filteredRows.length === 0) {
    return `<div class="panel-body"><div class="empty-state"><h4>${escapeHtml(noResultsTitle)}</h4><p>${escapeHtml(noResultsDescription)}</p></div></div>`;
  }
  return table(headers, filteredRows);
}

function renderListControls(viewKey, statusOptions = ['All']) {
  const current = listState(viewKey);
  return `<div class="table-toolbar">
    <input class="search" data-list-query="${escapeAttribute(viewKey)}" placeholder="Search ${escapeAttribute(viewKey)}" value="${escapeAttribute(current.query || '')}">
    <div class="content-header-actions">
      <label class="hint" for="${escapeAttribute(viewKey)}-status-filter">Status</label>
      <select id="${escapeAttribute(viewKey)}-status-filter" data-list-status="${escapeAttribute(viewKey)}">${statusOptions.map((opt)=>`<option value="${escapeAttribute(opt)}" ${opt===current.status?'selected':''}>${escapeHtml(opt)}</option>`).join('')}</select>
    </div>
  </div>`;
}

function attentionSnapshot() {
  return buildAttentionSnapshot(state.appData || EMPTY_DATA);
}

function attentionBadge(attention) {
  if (!attention) return badge('Current');
  return badge(attention.label || 'Current');
}
export function renderNav(){
  nav.innerHTML = navItems.map(item => `<button class="nav-item ${state.currentView===item.key?'active':''}" data-view="${item.key}"><span>${item.label}</span><span class="dot"></span></button>`).join('');
}
function metrics(){
  const snapshot = attentionSnapshot();
  return `<section class="metrics">
    <div class="metric"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><div><div class="label">Projects needing review</div><div class="value">${snapshot.metrics.projectsNeedingReview}</div></div>${badge('Cadence breaches','amber')}</div></div>
    <div class="metric"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><div><div class="label">People needing meeting</div><div class="value">${snapshot.metrics.peopleNeedingMeeting}</div></div>${badge('Relationship upkeep','blue')}</div></div>
    <div class="metric"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><div><div class="label">Overdue actions</div><div class="value">${snapshot.metrics.overdueActions}</div></div>${badge('Immediate pressure','red')}</div></div>
    <div class="metric"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><div><div class="label">Items to inform</div><div class="value">${snapshot.metrics.itemsToInform}</div></div>${badge('Knowledge backlog','purple')}</div></div>
  </section>`;
}
function dashboardGoToButton(viewKey){ return `<button class="ghost-link" data-goto="${viewKey}">Go to details</button>`; }

export function renderDashboard(){
  const snapshot = attentionSnapshot();
  setLayout(true);
  pageKicker.textContent = 'Monday focus';
  pageTitle.textContent = 'Attention Dashboard';
  left.innerHTML = `
    ${metrics()}
    ${card(
      'Projects needing review',
      'Flagged by cadence breach or unresolved action pressure',
      table(['Project','Owner','Status','Start','Target','Attention'],
        snapshot.projects.map((p,i)=>`<tr data-click="project-${i}" data-source="dashboard">
          <td><div class="primary-text">${escapeHtml(p.name)}</div><div class="secondary-text">${escapeHtml(p.stage)} · ${escapeHtml(p.health)} health</div></td>
          <td>${escapeHtml(p.owner)}</td>
          <td>${badge(p.status)}</td>
          <td>${escapeHtml(p.startDate)}</td>
          <td>${escapeHtml(p.targetDate)}</td>
          <td>${attentionBadge(p.attention)}</td>
        </tr>`)
      ),
      badge('Projects','blue'),
      dashboardGoToButton('projects')
    )}
    ${card(
      'People needing meeting',
      'Relationship upkeep and action pressure',
      table(['Person','Role','Last meeting','Cadence','Attention'],
        snapshot.people.map((p,i)=>`<tr data-click="person-${i}" data-source="dashboard">
          <td><div class="primary-text">${escapeHtml(p.name)}</div></td><td>${escapeHtml(p.role)}</td><td>${escapeHtml(p.lastMeeting)}</td><td>${badge(p.cadence)}</td><td>${attentionBadge(p.attention)}</td>
        </tr>`)
      ),
      badge('People','purple'),
      dashboardGoToButton('people')
    )}
    ${card(
      'Programme RAID',
      'Single log view; full page uses tabs by type',
      table(['Type','Description','Owner','Due','Status'],
        data.raidGlobal.map((r,i)=>`<tr data-click="raid-${i}" data-source="dashboard">
          <td>${badge(r.type)}</td><td><div class="primary-text">${escapeHtml(r.text)}</div></td><td>${escapeHtml(r.owner)}</td><td>${escapeHtml(r.due)}</td><td>${badge(r.status)}</td>
        </tr>`)
      ),
      badge('Hybrid tracking','purple'),
      dashboardGoToButton('raid')
    )}
  `;
  right.innerHTML = meetingPanel() + informPanel() + actionsPanel();
}
function meetingPanel(){
  const m = data.meeting;
  return `<section class="card">
    <div class="card-head">
      <div><h3>Meeting workspace</h3><p>Structured conversation prep with inform tracking</p></div>
      <div class="content-header-actions">${dashboardGoToButton('meetings')}${badge('Sample detail panel','blue')}</div>
    </div>
    <div class="panel-body">
      <div class="eyebrow" style="color:#64748b;letter-spacing:.12em;">Context</div>
      <div class="detail-title">${escapeHtml(m.title)}</div>
      <div class="detail-subtitle">${escapeHtml(m.context)} · ${escapeHtml(m.date)}</div>
      <div style="margin-top:18px;"><div style="font-weight:700;margin-bottom:10px;">Agenda</div><div class="agenda-list">${m.agenda.map(a=>`<div class="agenda-item">${escapeHtml(a)}</div>`).join('')}</div></div>
      <div style="margin-top:18px;" class="inform-grid">
        <div class="inform-col"><h4><span>Updates</span>${badge('2 pending','purple')}</h4>${m.updates.map((u,i)=>`<label class="check-row ${u.informed?'done':''}"><input type="checkbox" ${u.informed?'checked':''} data-check="update-${i}"><span>${escapeHtml(u.title)}</span></label>`).join('')}</div>
        <div class="inform-col"><h4><span>Decisions</span>${badge('1 pending','blue')}</h4>${m.decisions.map((d,i)=>`<label class="check-row ${d.informed?'done':''}"><input type="checkbox" ${d.informed?'checked':''} data-check="decision-${i}"><span>${escapeHtml(d.title)}</span></label>`).join('')}</div>
        <div class="inform-col"><h4><span>Actions</span>${badge('1 pending','amber')}</h4>${m.actions.map((a,i)=>`<label class="check-row ${a.informed?'done':''}"><input type="checkbox" ${a.informed?'checked':''} data-check="action-${i}"><span>${escapeHtml(a.title)}</span></label>`).join('')}</div>
      </div>
      <div style="margin-top:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="font-weight:700;">Quick capture</div>
          <div class="content-header-actions">
            <button class="btn" data-create="Update" data-context="meeting">+ Update</button>
            <button class="btn" data-create="Decision" data-context="meeting">+ Decision</button>
            <button class="btn" data-create="Action" data-context="meeting">+ Action</button>
          </div>
        </div>
        <div class="notes">Meeting notes area / live capture surface</div>
      </div>
    </div>
  </section>`;
}
function informPanel(){
  return card('Pending informs by person','Knowledge propagation queue',
    table(['Person','Pending items','Next opportunity'],
      data.informs.map((i,idx)=>`<tr data-click="inform-${idx}" data-source="dashboard"><td><div class="primary-text">${escapeHtml(i.person)}</div></td><td>${badge(`${i.pending} to inform`)}</td><td>${escapeHtml(i.next)}</td></tr>`)
    ),
    badge('High leverage','purple'),
    dashboardGoToButton('people')
  );
}
function actionsPanel(){
  return card('Overdue and due actions','A clean, table-first action view',
    table(['Action','Owner','Due','Status','Project'],
      data.actions.map((a,i)=>`<tr data-click="actionrow-${i}" data-source="dashboard"><td><div class="primary-text">${escapeHtml(a.title)}</div></td><td>${escapeHtml(a.owner)}</td><td>${escapeHtml(a.due)}</td><td>${badge(a.status)}</td><td>${escapeHtml(a.project)}</td></tr>`)
    ),
    badge('Actions','amber'),
    dashboardGoToButton('actions')
  );
}

export function renderProjects(){
  const snapshot = attentionSnapshot();
  const listFilters = listState('projects');
  const projectRows = snapshot.projects.map((p,i)=> ({
    index: i,
    row: `<tr data-click="project-${i}"><td><div class="primary-text">${escapeHtml(p.name)}</div><div class="secondary-text">${escapeHtml(p.description)}</div></td><td>${escapeHtml(p.owner)}</td><td>${badge(p.status)}</td><td>${escapeHtml(p.startDate)}</td><td>${escapeHtml(p.targetDate)}</td><td>${badge(p.stage)}</td><td>${attentionBadge(p.attention)}</td></tr>`,
    item: p
  }));
  const filteredRows = projectRows.filter((entry) => matchesListFilters(entry.item, listFilters.query, listFilters.status, ['name','description','owner','stage'], 'status')).map((entry) => entry.row);
  setLayout(false);
  pageKicker.textContent = 'Entity view';
  pageTitle.textContent = 'Projects';
  left.innerHTML = card(
    'Project list',
    'Project rows open a full workspace modal. Create is available globally and in context.',
    `${renderListControls('projects', ['All','Planning','In progress','At risk','Complete'])}${tableStateContent({
      allRows: projectRows,
      filteredRows,
      headers: ['Project','Owner','Status','Start','Target','Stage','Attention'],
      emptyTitle: 'No projects yet',
      emptyDescription: 'Create your first project to begin tracking delivery and governance.',
      noResultsTitle: 'No matching projects',
      noResultsDescription: 'Try broadening your search terms or clearing the status filter.'
    })}`,
    badge('Projects','blue'),
    `<button class="btn" data-create="Project" data-context="global">Create project</button>`
  );
}
export function renderPeople(){
  const snapshot = attentionSnapshot();
  setLayout(false);
  pageKicker.textContent = 'Entity view';
  pageTitle.textContent = 'People';
  left.innerHTML = card('People list','Click a row to open details',
    table(['Person','Role','Last meeting','Cadence','Attention'],
      snapshot.people.map((p,i)=>`<tr data-click="person-${i}"><td><div class="primary-text">${escapeHtml(p.name)}</div><div class="secondary-text">${p.summary}</div></td><td>${escapeHtml(p.role)}</td><td>${escapeHtml(p.lastMeeting)}</td><td>${badge(p.cadence)}</td><td>${attentionBadge(p.attention)}</td></tr>`)
    ),
    badge('People','purple'),
    `<button class="btn" data-create="Person" data-context="global">Create person</button>`
  );
}
export function renderMeetings(){
  setLayout(false);
  pageKicker.textContent = 'Context workspace';
  pageTitle.textContent = 'Meetings';
  left.innerHTML = card('Meeting list','Attendees stay a single field; project roles live on projects',
    table(['Meeting','Context','Date','Attendees','Pending informs'],
      [
        `<tr data-click="meeting-main"><td><div class="primary-text">Harri Evans 1:1</div></td><td>People > Harri Evans</td><td>11 Mar 2026 · 10:00</td><td>Chris, Harri Evans</td><td>${badge('4 pending','purple')}</td></tr>`,
        `<tr data-click="meeting-main"><td><div class="primary-text">Retention Hub Review</div></td><td>Projects > Retention Hub</td><td>07 Mar 2026 · 14:00</td><td>Chris, Sarah Jones, Jo Morgan</td><td>${badge('2 pending','amber')}</td></tr>`,
        `<tr data-click="meeting-main"><td><div class="primary-text">Programme Board</div></td><td>Programme</td><td>15 Mar 2026 · 09:30</td><td>Chris, Harri Evans, Sarah Jones</td><td>${badge('3 pending','blue')}</td></tr>`
      ]
    ),
    badge('Meetings','blue'),
    `<button class="btn" data-create="Meeting" data-context="global">Create meeting</button>`
  );
}
export function renderUpdates(){
  const listFilters = listState('updates');
  const updateRows = data.updates.map((u,i)=>({
    row: `<tr data-click="update-${i}"><td>${escapeHtml(u.date)}</td><td><div class="primary-text">${escapeHtml(u.title)}</div></td><td>${escapeHtml(u.project)}</td><td>${escapeHtml(u.meeting)}</td><td>${escapeHtml(u.people)}</td><td>${badge(u.status)}</td></tr>`,
    item: u
  }));
  const filteredRows = updateRows.filter((entry) => matchesListFilters(entry.item, listFilters.query, listFilters.status, ['title','project','meeting','people'], 'status')).map((entry) => entry.row);
  setLayout(false);
  pageKicker.textContent = 'Knowledge log';
  pageTitle.textContent = 'Updates';
  left.innerHTML = card('Updates log','Project modals now show richer update tables too',
    `${renderListControls('updates', ['All','Open','In progress','Complete'])}${tableStateContent({
      allRows: updateRows,
      filteredRows,
      headers: ['Date logged','Update','Project','Meeting','People to inform','Status'],
      emptyTitle: 'No updates logged',
      emptyDescription: 'Capture updates from meetings or add one manually to keep the narrative current.',
      noResultsTitle: 'No matching updates',
      noResultsDescription: 'Adjust your search or choose a different status filter.'
    })}`,
    badge('Updates','purple'),
    `<button class="btn" data-create="Update" data-context="global">Create update</button>`
  );
}
export function renderDecisions(){
  setLayout(false);
  pageKicker.textContent = 'Knowledge log';
  pageTitle.textContent = 'Decisions';
  left.innerHTML = card('Decisions log','Structured decisions with rationale and impact',
    table(['Date','Decision','Project','Rationale','Status'],
      data.decisions.map((d,i)=>`<tr data-click="decisionrow-${i}"><td>${escapeHtml(d.date)}</td><td><div class="primary-text">${escapeHtml(d.title)}</div></td><td>${escapeHtml(d.project)}</td><td>${escapeHtml(d.rationale)}</td><td>${badge(d.status)}</td></tr>`)
    ),
    badge('Decisions','blue'),
    `<button class="btn" data-create="Decision" data-context="global">Create decision</button>`
  );
}
export function renderActions(){
  const listFilters = listState('actions');
  const actionRows = data.actions.map((a,i)=>({
    row: `<tr data-click="actionrow-${i}"><td><div class="primary-text">${escapeHtml(a.title)}</div><div class="secondary-text">${escapeHtml(a.summary)}</div></td><td>${escapeHtml(a.owner)}</td><td>${escapeHtml(a.due)}</td><td>${badge(a.status)}</td><td>${escapeHtml(a.project)}</td></tr>`,
    item: a
  }));
  const filteredRows = actionRows.filter((entry) => matchesListFilters(entry.item, listFilters.query, listFilters.status, ['title','summary','owner','project'], 'status')).map((entry) => entry.row);
  setLayout(false);
  pageKicker.textContent = 'Knowledge log';
  pageTitle.textContent = 'Actions';
  left.innerHTML = card('Actions log','Actions can be created globally or from meetings/projects',
    `${renderListControls('actions', ['All','Open','In progress','Complete','Overdue'])}${tableStateContent({
      allRows: actionRows,
      filteredRows,
      headers: ['Action','Owner','Due','Status','Project'],
      emptyTitle: 'No actions tracked',
      emptyDescription: 'Create an action to assign ownership and keep delivery momentum visible.',
      noResultsTitle: 'No matching actions',
      noResultsDescription: 'Clear filters or search for a different owner, project, or keyword.'
    })}`,
    badge('Actions','amber'),
    `<button class="btn" data-create="Action" data-context="global">Create action</button>`
  );
}
export function renderRaid(){
  const listFilters = listState('raid');
  setLayout(false);
  pageKicker.textContent = 'Programme level';
  pageTitle.textContent = 'Programme RAID';
  const tabs = ['Risk','Action','Issue','Decision'].map(tab=>`<button class="tab ${state.currentRaidTab===tab?'active':''}" data-raid-tab="${tab}">${tab}</button>`).join('');
  const filteredByTab = data.raidGlobal.filter((r)=>r.type===state.currentRaidTab);
  const filtered = filteredByTab.filter((r)=>matchesListFilters(r, listFilters.query, listFilters.status, ['text','owner','project','impact'], 'status'));
  let headers=['Type','Description','Owner','Due','Status'];
  let rows=filtered.map(r=>`<tr data-click="raidfiltered-${data.raidGlobal.indexOf(r)}"><td>${badge(r.type)}</td><td><div class="primary-text">${escapeHtml(r.text)}</div></td><td>${escapeHtml(r.owner)}</td><td>${escapeHtml(r.due)}</td><td>${badge(r.status)}</td></tr>`);
  if (state.currentRaidTab==='Decision'){
    headers=['Type','Decision','Owner','Status','Impact'];
    rows=filtered.map(r=>`<tr data-click="raidfiltered-${data.raidGlobal.indexOf(r)}"><td>${badge(r.type)}</td><td><div class="primary-text">${escapeHtml(r.text)}</div></td><td>${escapeHtml(r.owner)}</td><td>${badge(r.status)}</td><td>${escapeHtml(r.impact)}</td></tr>`);
  } else if (state.currentRaidTab==='Risk' || state.currentRaidTab==='Issue'){
    headers=['Type','Description','Project','Owner','Status'];
    rows=filtered.map(r=>`<tr data-click="raidfiltered-${data.raidGlobal.indexOf(r)}"><td>${badge(r.type)}</td><td><div class="primary-text">${escapeHtml(r.text)}</div></td><td>${escapeHtml(r.project)}</td><td>${escapeHtml(r.owner)}</td><td>${badge(r.status)}</td></tr>`);
  } else if (state.currentRaidTab==='Action'){
    headers=['Type','Action','Project','Owner','Due','Status'];
    rows=filtered.map(r=>`<tr data-click="raidfiltered-${data.raidGlobal.indexOf(r)}"><td>${badge(r.type)}</td><td><div class="primary-text">${escapeHtml(r.text)}</div></td><td>${escapeHtml(r.project)}</td><td>${escapeHtml(r.owner)}</td><td>${escapeHtml(r.due)}</td><td>${badge(r.status)}</td></tr>`);
  }
  left.innerHTML = card('RAID log','Single table with tabs filtering by type and changing columns as needed',
    `<div class="tabs">${tabs}</div>${renderListControls('raid', ['All','Open','In progress','Mitigated','Closed'])}${tableStateContent({
      allRows: filteredByTab,
      filteredRows: rows,
      headers,
      emptyTitle: `No ${state.currentRaidTab.toLowerCase()} items`,
      emptyDescription: 'Capture RAID items to make programme-level governance explicit.',
      noResultsTitle: `No matching ${state.currentRaidTab.toLowerCase()} items`,
      noResultsDescription: 'Try a different search phrase or status filter.'
    })}`,
    badge('RAID','purple'),
    `<button class="btn" data-create="RAID item" data-context="global">Create RAID item</button>`
  );
}

export function renderSettings(){
  setLayout(false);
  pageKicker.textContent='System';
  pageTitle.textContent='Settings';
  left.innerHTML = card(
    'Data management',
    'IndexedDB persistence with migration, sample seed controls, and portable JSON backup',
    `<div class="panel-body">
      <p class="secondary-text">Use this menu to replace current data with the baseline sample dataset or move data between environments while backend integration is pending.</p>
      <div class="content-header-actions" style="margin-top:14px;">
        <button class="btn" data-action="load-sample-data">Load sample data</button>
        <button class="btn" data-action="export-data-json">Export JSON</button>
        <button class="btn" data-action="import-data-json">Import JSON</button>
        <input type="file" id="import-data-json-input" accept="application/json" style="display:none">
      </div>
    </div>`,
    badge('Persistence','blue')
  );
}

export function renderReports(){
  setLayout(false);
  pageKicker.textContent='Reporting layer';
  pageTitle.textContent='Reports';
  left.innerHTML=card('Reporting ideas','Placeholder for later',
    `<div class="panel-body"><div class="mini-list">
      <div class="mini-item"><strong>Attention report</strong><div class="secondary-text">Projects, people, and actions requiring intervention.</div></div>
      <div class="mini-item"><strong>Communication backlog</strong><div class="secondary-text">Who still needs to be informed about what.</div></div>
      <div class="mini-item"><strong>Governance pack</strong><div class="secondary-text">Board-ready summary of RAID, decisions, and project movement.</div></div>
    </div></div>`,
    badge('Placeholder','slate')
  );
}

export function dashboardProjectPanel(index){
  const p = attentionSnapshot().projects[index];
  return card('Project detail','Dashboard side panel with direct jump to the full entity page',
    `<div class="panel-body">
      <div class="detail-title">${escapeHtml(p.name)}</div>
      <div class="detail-subtitle">Owner: ${escapeHtml(p.owner)} · Start: ${escapeHtml(p.startDate)} · Target: ${escapeHtml(p.targetDate)}</div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">${badge(p.status)} ${attentionBadge(p.attention)} ${badge(p.stage)}</div>
      <div style="margin-top:16px;" class="meta-grid">
        <div class="meta-block"><div class="meta-label">Last review</div><div class="meta-value">${p.lastReview}</div></div>
        <div class="meta-block"><div class="meta-label">Cadence</div><div class="meta-value">${p.cadence}</div></div>
        <div class="meta-block"><div class="meta-label">Health</div><div class="meta-value">${escapeHtml(p.health)}</div></div>
        <div class="meta-block"><div class="meta-label">People</div><div class="meta-value">${p.people.length}</div></div>
      </div>
      <div style="margin-top:18px;" class="mini-list">
        <div class="mini-item"><strong>RAID</strong><div class="secondary-text">${p.raid.map(x=>x.title).join(' · ')}</div></div>
        <div class="mini-item"><strong>Updates</strong><div class="secondary-text">${p.updates.map(x=>x.text).join(' · ')}</div></div>
      </div>
      <div style="margin-top:16px;" class="content-header-actions">
        <button class="ghost-link" data-goto="projects">Go to details</button>
        <button class="btn" data-create="Action" data-context="project">Add action</button>
      </div>
    </div>`,
    badge('Project panel','blue')
  );
}
export function dashboardPersonPanel(index){
  const p = attentionSnapshot().people[index];
  return card('Person detail','Dashboard side panel',
    `<div class="panel-body">
      <div class="detail-title">${escapeHtml(p.name)}</div>
      <div class="detail-subtitle">${escapeHtml(p.role)} · Last meeting: ${escapeHtml(p.lastMeeting)}</div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">${badge(p.cadence)} ${attentionBadge(p.attention)}</div>
      <div style="margin-top:18px;" class="mini-list">
        <div class="mini-item"><strong>Summary</strong><div class="secondary-text">${p.summary}</div></div>
      </div>
      <div style="margin-top:16px;"><button class="ghost-link" data-goto="people">Go to details</button></div>
    </div>`,
    badge('People panel','purple')
  );
}
export function dashboardActionPanel(index){
  const a = data.actions[index];
  return card('Action detail','Dashboard side panel',
    `<div class="panel-body">
      <div class="detail-title">${escapeHtml(a.title)}</div>
      <div class="detail-subtitle">${escapeHtml(a.project)} · Owner: ${escapeHtml(a.owner)} · Due: ${escapeHtml(a.due)}</div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">${badge(a.status)} ${badge('Action record','amber')}</div>
      <div style="margin-top:18px;" class="mini-list">
        <div class="mini-item"><strong>Summary</strong><div class="secondary-text">${escapeHtml(a.summary)}</div></div>
        <div class="mini-item"><strong>Progress</strong><div class="secondary-text">${a.progress.join(' · ')}</div></div>
      </div>
      <div style="margin-top:16px;"><button class="ghost-link" data-goto="actions">Go to details</button></div>
    </div>`,
    badge('Action panel','amber')
  );
}
export function dashboardRaidPanel(index){
  const r = data.raidGlobal[index];
  return card('RAID detail','Dashboard side panel',
    `<div class="panel-body">
      <div class="detail-title">${r.type}</div>
      <div class="detail-subtitle">${escapeHtml(r.project)} · Owner: ${escapeHtml(r.owner)}</div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">${badge(r.type)} ${badge(r.status)}</div>
      <div style="margin-top:18px;" class="mini-list">
        <div class="mini-item"><strong>Description</strong><div class="secondary-text">${escapeHtml(r.text)}</div></div>
        <div class="mini-item"><strong>Impact</strong><div class="secondary-text">${escapeHtml(r.impact)}</div></div>
      </div>
      <div style="margin-top:16px;"><button class="ghost-link" data-goto="raid">Go to details</button></div>
    </div>`,
    badge('RAID panel','purple')
  );
}

export function openModal(type, index){
  state.modalState = { type, index, tab: type==='project'?'overview':'details', edit:false };
  state.uiState.modalDirty = false;
  renderModal();
  modalBackdrop.classList.add('open');
}
export function renderModal(){
  const {type,index,tab,edit} = state.modalState;
  modalTabs.innerHTML = '';
  if (type==='project') return renderProjectModal(index, tab, edit);
  if (type==='person') return simpleModal('Person detail', data.people[index].name, personModalBody(index));
  if (type==='meeting') return simpleModal('Meeting workspace', data.meeting.title, meetingModalBody());
  if (type==='update') return simpleModal('Update record', data.updates[index].title, updateModalBody(index));
  if (type==='decision') return simpleModal('Decision record', data.decisions[index].title, decisionModalBody(index));
  if (type==='action') return simpleModal('Action record', data.actions[index].title, actionModalBody(index));
  if (type==='raid') return simpleModal('RAID record', data.raidGlobal[index].text, raidModalBody(index));
}
function simpleModal(title, subtitle, body){
  const modalType = state.modalState.type;
  const supportsLifecycle = ['person','meeting','update','decision','action','raid'].includes(modalType);
  modalTitle.textContent = title;
  modalSubtitle.textContent = subtitle;
  modalTabs.innerHTML = `
    <div class="hint">Read-only view. Use actions for full lifecycle management. Closing the modal in edit mode will warn before discarding unsaved changes.</div>
    ${supportsLifecycle ? `<div class="content-header-actions"><button class="btn" data-modal-action="edit">Edit record</button><button class="btn" data-modal-action="delete">Delete record</button></div>` : ''}
  `;
  modalBody.innerHTML = body;
}
function projectTabButton(key,label){
  return `<button class="seg-btn ${state.modalState.tab===key?'active':''}" data-project-tab="${key}">${label}</button>`;
}
function projectHeaderActions(){
  return `
    <button class="btn" data-create="Meeting" data-context="project">Add meeting</button>
    <button class="btn" data-create="Update" data-context="project">Add update</button>
    <button class="btn" data-create="RAID item" data-context="project">Add RAID item</button>
    <button class="btn" data-create="Action" data-context="project">Add action</button>
    <button class="btn" data-create="Decision" data-context="project">Add decision</button>
  `;
}
function renderProjectModal(index, tab, edit){
  const p = data.projects[index];
  modalTitle.textContent = p.name;
  modalSubtitle.textContent = `${escapeHtml(p.status)} · Owner: ${escapeHtml(p.owner)} · Start: ${escapeHtml(p.startDate)} · Target: ${escapeHtml(p.targetDate)}`;
  modalTabs.innerHTML = `
    <div class="segmented">
      ${projectTabButton('overview','Overview')}
      ${projectTabButton('raid','RAID')}
      ${projectTabButton('updates','Updates')}
      ${projectTabButton('meetings','Meetings')}
      ${projectTabButton('people','People')}
      ${projectTabButton('actions','Actions')}
      ${projectTabButton('decisions','Decisions')}
    </div>
    <div class="content-header-actions">${projectHeaderActions()}</div>
  `;
  if (edit) {
    modalBody.innerHTML = projectEditBody(index, tab);
  } else {
    modalBody.innerHTML = projectViewBody(index, tab);
  }
}
function projectMetaBlocks(p){
  return `<div class="meta-grid">
    <div class="meta-block"><div class="meta-label">Status</div><div class="meta-value">${escapeHtml(p.status)}</div></div>
    <div class="meta-block"><div class="meta-label">Health</div><div class="meta-value">${escapeHtml(p.health)}</div></div>
    <div class="meta-block"><div class="meta-label">Stage</div><div class="meta-value">${escapeHtml(p.stage)}</div></div>
    <div class="meta-block"><div class="meta-label">Owner</div><div class="meta-value">${escapeHtml(p.owner)}</div></div>
    <div class="meta-block"><div class="meta-label">Start date</div><div class="meta-value">${escapeHtml(p.startDate)}</div></div>
    <div class="meta-block"><div class="meta-label">Target date</div><div class="meta-value">${escapeHtml(p.targetDate)}</div></div>
    <div class="meta-block"><div class="meta-label">Last review</div><div class="meta-value">${p.lastReview}</div></div>
    <div class="meta-block"><div class="meta-label">Review cadence</div><div class="meta-value">${p.cadence}</div></div>
  </div>`;
}
export function projectViewBody(index, tab){
  const p = data.projects[index];
  if (tab==='overview'){
    return `<div class="detail-grid">
      ${projectMetaBlocks(p)}
      <div class="mini-item"><h4 class="section-title">Description</h4><div class="secondary-text">${escapeHtml(p.description)}</div></div>
      <div class="modal-grid">
        <div class="detail-grid">
          <div class="mini-item"><h4 class="section-title">Latest updates</h4><div class="mini-list">${p.updates.map(u=>`<div class="agenda-item"><strong>${u.dateLogged}</strong><div class="secondary-text">${u.text}</div></div>`).join('')}</div></div>
          <div class="mini-item"><h4 class="section-title">Key RAID pressure</h4><div class="mini-list">${p.raid.map(r=>`<div class="agenda-item"><strong>${r.type}</strong> · ${r.title}<div class="secondary-text">${r.status} · ${escapeHtml(r.owner)}</div></div>`).join('')}</div></div>
        </div>
        <div class="detail-grid">
          <div class="mini-item"><h4 class="section-title">People on project</h4><div class="mini-list">${p.people.map(x=>`<div class="agenda-item"><strong>${escapeHtml(x.name)}</strong><div class="secondary-text">${escapeHtml(x.role)} · latest meeting ${escapeHtml(x.latestMeeting)}</div></div>`).join('')}</div></div>
          <div class="mini-item"><h4 class="section-title">Recent meetings</h4><div class="mini-list">${p.meetings.map(x=>`<div class="agenda-item"><strong>${x.date}</strong> · ${escapeHtml(x.title)}<div class="secondary-text">${x.outputs}</div></div>`).join('')}</div></div>
        </div>
      </div>
    </div>`;
  }
  if (tab==='raid'){
    return cardLikeTable(['Type','Title','Date logged','Owner','Status','Due','Severity','Mitigation','Meeting','Last updated'],
      p.raid.map(r=>`<tr><td>${badge(r.type)}</td><td><div class="primary-text">${r.title}</div></td><td>${r.dateLogged}</td><td>${escapeHtml(r.owner)}</td><td>${badge(r.status)}</td><td>${escapeHtml(r.due)}</td><td>${r.severity}</td><td>${r.mitigation}</td><td>${r.meeting}</td><td>${r.lastUpdated}</td></tr>`),
      'Expanded project RAID register'
    );
  }
  if (tab==='updates'){
    return cardLikeTable(['Date logged','Update','Related meeting','Informed progress','Status'],
      p.updates.map(u=>`<tr><td>${u.dateLogged}</td><td><div class="primary-text">${u.text}</div></td><td>${escapeHtml(u.meeting)}</td><td>${u.inform}</td><td>${badge(u.status)}</td></tr>`),
      'Project-scoped update log with audit fields'
    );
  }
  if (tab==='meetings'){
    return cardLikeTable(['Date','Meeting','Attendees','Outputs'],
      p.meetings.map(m=>`<tr><td>${escapeHtml(m.date)}</td><td><div class="primary-text">${escapeHtml(m.title)}</div></td><td>${m.attendees}</td><td>${m.outputs}</td></tr>`),
      'Meeting history attached to this project'
    );
  }
  if (tab==='people'){
    return cardLikeTable(['Person','Project role','Latest meeting','Pending informs','Open actions'],
      p.people.map(x=>`<tr><td><div class="primary-text">${escapeHtml(x.name)}</div></td><td>${badge(x.role)}</td><td>${escapeHtml(x.latestMeeting)}</td><td>${escapeHtml(x.pendingInforms)}</td><td>${escapeHtml(x.openActions)}</td></tr>`),
      'Project-people join view with role assignment'
    );
  }
  if (tab==='actions'){
    return cardLikeTable(['Action','Owner','Due','Status'],
      p.actions.map(a=>`<tr><td><div class="primary-text">${escapeHtml(a.title)}</div></td><td>${escapeHtml(a.owner)}</td><td>${escapeHtml(a.due)}</td><td>${badge(a.status)}</td></tr>`),
      'Project action log'
    );
  }
  if (tab==='decisions'){
    return cardLikeTable(['Date logged','Decision','Rationale','Impact'],
      p.decisions.map(d=>`<tr><td>${d.dateLogged}</td><td><div class="primary-text">${d.decision}</div></td><td>${escapeHtml(d.rationale)}</td><td>${d.impact}</td></tr>`),
      'Project decision log'
    );
  }
}
export function projectEditBody(index, tab){
  const p = data.projects[index];
  if (tab==='overview'){
    return `<div class="detail-grid">
      <div class="mini-item">
        <h4 class="section-title">Edit project</h4>
        <div class="field-grid">
          <div class="field"><label>Project name</label><input value="${escapeHtml(p.name)}"></div>
          <div class="field"><label>Owner</label><input value="${escapeHtml(p.owner)}"></div>
          <div class="field"><label>Status</label><select><option selected>${escapeHtml(p.status)}</option><option>Planning</option><option>Active</option><option>Closed</option></select></div>
          <div class="field"><label>Stage</label><select><option selected>${escapeHtml(p.stage)}</option><option>Design</option><option>Delivery</option><option>Closure</option></select></div>
          <div class="field"><label>Health</label><select><option selected>${escapeHtml(p.health)}</option><option>Green</option><option>Amber</option><option>Red</option></select></div>
          <div class="field"><label>Review cadence</label><select><option selected>${p.cadence}</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select></div>
          <div class="field"><label>Start date</label><input value="${escapeHtml(p.startDate)}"></div>
          <div class="field"><label>Target date</label><input value="${escapeHtml(p.targetDate)}"></div>
        </div>
        <div class="field" style="margin-top:14px"><label>Description</label><textarea>${escapeHtml(p.description)}</textarea></div>
      </div>
      <div class="mini-item">
        <h4 class="section-title">Edit mode pattern</h4>
        <div class="wizard-note">This is the intended CRUD behaviour: open a full record in view mode, click Edit mode, and swap display sections into structured inline fields. Clean, stable, far less cursed than spreadsheet soup.</div>
      </div>
    </div>`;
  }
  if (tab==='people'){
    return `<div class="mini-item">
      <h4 class="section-title">Edit project people roles</h4>
      <div class="field-grid">
        ${p.people.map(x=>`
          <div class="field"><label>${escapeHtml(x.name)}</label><select>
            <option ${x.role==='Owner'?'selected':''}>Owner</option>
            <option ${x.role==='SME'?'selected':''}>SME</option>
            <option ${x.role==='Approver'?'selected':''}>Approver</option>
            <option ${x.role==='Other'?'selected':''}>Other</option>
          </select></div>
        `).join('')}
      </div>
      <div style="margin-top:14px" class="content-header-actions">
        <button class="btn" data-create="Person" data-context="project">Attach person</button>
      </div>
    </div>`;
  }
  return `<div class="mini-item">
    <h4 class="section-title">Edit ${tab}</h4>
    <div class="wizard-note">For this prototype, edit mode is fully mocked on the Overview and People tabs. The pattern extends to ${tab} with inline fields, add/remove controls, and a Save / Cancel footer.</div>
  </div>`;
}
function cardLikeTable(headers, rows, hint){
  return `<div class="detail-grid">
    <div class="table-toolbar"><div class="hint">${hint}</div><div class="content-header-actions"><button class="btn">Filter</button><button class="btn">Export</button></div></div>
    <div class="mini-item" style="padding:0;overflow:hidden">${table(headers, rows)}</div>
  </div>`;
}

export function personModalBody(index){
  const p = attentionSnapshot().people[index];
  return `<div class="modal-grid">
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Overview</h4><div class="secondary-text">${p.summary}</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">${badge(p.cadence)} ${attentionBadge(p.attention)}</div><div class="secondary-text" style="margin-top:10px;">Last interaction: ${p.lastInteraction || '-'} · Snooze: ${p.cadenceSnoozeDays || 0} day(s)</div></div>
    </div>
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Suggested actions</h4><div class="secondary-text">Add person globally, or attach them to a project in Owner / SME / Approver / Other role.</div></div>
    </div>
  </div>`;
}
export function meetingModalBody(){
  const m = data.meeting;
  return `<div class="modal-grid">
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Agenda</h4><div class="agenda-list">${m.agenda.map(a=>`<div class="agenda-item">${escapeHtml(a)}</div>`).join('')}</div></div>
      <div class="mini-item"><h4 class="section-title">Notes</h4><div class="notes">Meeting notes area / live capture surface</div></div>
    </div>
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Items to inform</h4>
        <div class="inform-grid" style="grid-template-columns:1fr;">
          <div class="inform-col"><h4><span>Updates</span>${badge('2 pending','purple')}</h4>${m.updates.map((u,i)=>`<label class="check-row ${u.informed?'done':''}"><input type="checkbox" ${u.informed?'checked':''} data-check="mu-${i}"><span>${escapeHtml(u.title)}</span></label>`).join('')}</div>
          <div class="inform-col"><h4><span>Decisions</span>${badge('1 pending','blue')}</h4>${m.decisions.map((d,i)=>`<label class="check-row ${d.informed?'done':''}"><input type="checkbox" ${d.informed?'checked':''} data-check="md-${i}"><span>${escapeHtml(d.title)}</span></label>`).join('')}</div>
        </div>
      </div>
    </div>
  </div>`;
}
export function updateModalBody(index){
  const u = data.updates[index];
  return `<div class="modal-grid">
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Update text</h4><div class="secondary-text">${escapeHtml(u.title)}</div></div>
      <div class="mini-item"><h4 class="section-title">Audit trail</h4><div class="mini-list">
        <div class="agenda-item"><strong>Date logged</strong><div class="secondary-text">${escapeHtml(u.date)}</div></div>
        <div class="agenda-item"><strong>Project</strong><div class="secondary-text">${escapeHtml(u.project)}</div></div>
        <div class="agenda-item"><strong>Related meeting</strong><div class="secondary-text">${escapeHtml(u.meeting)}</div></div>
      </div></div>
    </div>
    <div class="detail-grid">
      <div class="mini-item"><h4 class="section-title">Inform workflow</h4><div class="secondary-text">${escapeHtml(u.people)}</div><div style="margin-top:12px">${badge(u.status)}</div></div>
    </div>
  </div>`;
}
export function decisionModalBody(index){
  const d = data.decisions[index];
  return `<div class="modal-grid">
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Rationale</h4><div class="secondary-text">${escapeHtml(d.rationale)}</div></div></div>
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Status</h4>${badge(d.status)}</div></div>
  </div>`;
}
export function actionModalBody(index){
  const a = data.actions[index];
  return `<div class="modal-grid">
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Summary</h4><div class="secondary-text">${escapeHtml(a.summary)}</div></div></div>
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Progress updates</h4><div class="mini-list">${a.progress.map(x=>`<div class="agenda-item">${x}</div>`).join('')}</div></div></div>
  </div>`;
}
export function raidModalBody(index){
  const r = data.raidGlobal[index];
  return `<div class="modal-grid">
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Description</h4><div class="secondary-text">${escapeHtml(r.text)}</div></div></div>
    <div class="detail-grid"><div class="mini-item"><h4 class="section-title">Impact</h4><div class="secondary-text">${escapeHtml(r.impact)}</div></div></div>
  </div>`;
}

const crudConfigs = {
  'Project': {
    steps:['Basics','Dates & cadence','Description','People roles'],
    note:'Global create works for brand-new records. In practice, most records should also be creatable in context from project and meeting views.'
  },
  'Update': {
    steps:['Update text','Context','People to inform','Review'],
    note:'This is the progressive disclosure pattern: capture the thing first, then attach context, then route communication.'
  },
  'Decision': {
    steps:['Decision text','Context','Rationale & impact','People to inform'],
    note:'Decisions need slightly more structure than updates or they become corporate folklore.'
  },
  'Action': {
    steps:['Action text','Owner & due date','Context','People to inform'],
    note:'Quick capture first. The richer progress history can be added after save in edit mode.'
  },
  'Meeting': {
    steps:['Meeting basics','Context','Attendees','Review'],
    note:'Meeting attendees stay simple here. Project role assignment lives on projects, not meetings.'
  },
  'Person': {
    steps:['Basics','Contact/context','Review'],
    note:'Person creation is global, but attaching a person to a project with a role is usually contextual.'
  },
  'RAID item': {
    steps:['Type & text','Owner & dates','Context','Review'],
    note:'RAID item creation should usually happen from a project or programme RAID page.'
  }
};

function crudValue(field, fallback = '') {
  return state.crudState.values?.[field] ?? fallback;
}

function crudError(field) {
  return state.crudState.errors?.[field] ? `<div class="field-error">${escapeHtml(state.crudState.errors[field])}</div>` : '';
}

function inputField(field, label, placeholder = '') {
  const value = escapeAttribute(crudValue(field, ''));
  return `<div class="field"><label>${escapeHtml(label)}</label><input data-crud-field="${escapeAttribute(field)}" name="${escapeAttribute(state.crudState.type)}-${escapeAttribute(field)}" placeholder="${escapeAttribute(placeholder)}" value="${value}">${crudError(field)}</div>`;
}

function textAreaField(field, label, placeholder = '') {
  return `<div class="field"><label>${escapeHtml(label)}</label><textarea data-crud-field="${escapeAttribute(field)}" name="${escapeAttribute(state.crudState.type)}-${escapeAttribute(field)}" placeholder="${escapeAttribute(placeholder)}">${escapeHtml(crudValue(field, ''))}</textarea>${crudError(field)}</div>`;
}

function selectField(field, label, options) {
  const current = crudValue(field, options[0] || '');
  return `<div class="field"><label>${escapeHtml(label)}</label><select data-crud-field="${escapeAttribute(field)}" name="${escapeAttribute(state.crudState.type)}-${escapeAttribute(field)}">${options.map((option)=>`<option ${option===current?'selected':''}>${escapeHtml(option)}</option>`).join('')}</select>${crudError(field)}</div>`;
}

export function openCrud(type='Project', context='global', options = {}){
  state.crudState = {
    type,
    step:0,
    context,
    mode: options.mode || 'create',
    entityId: options.entityId || null,
    values: options.values || {},
    sourceModal: options.sourceModal || null,
    errors: {},
    feedback: ''
  };
  state.uiState.crudDirty = false;
  renderCrud();
  document.getElementById('crud-backdrop').classList.add('open');
}

export function renderCrud(){
  const cfg = crudConfigs[state.crudState.type] || crudConfigs['Project'];
  const modeLabel = state.crudState.mode === 'edit' ? 'Edit' : 'Create';
  document.getElementById('crud-title').textContent = `${modeLabel} ${state.crudState.type}`;
  document.getElementById('crud-subtitle').textContent = `${state.crudState.context === 'global' ? 'Global create flow' : 'Contextual create flow'} · progressive disclosure`;
  document.getElementById('crud-subtitle').dataset.dirty = state.uiState.crudDirty ? 'true' : 'false';
  document.getElementById('crud-note').innerHTML = `${cfg.note}${state.crudState.feedback ? `<br><span class="crud-feedback">${state.crudState.feedback}</span>` : ''}`;
  document.getElementById('crud-steps').innerHTML = cfg.steps.map((s,i)=>`<div class="step ${i<state.crudState.step?'done':i===state.crudState.step?'active':''}">${i+1}. ${s}</div>`).join('');
  document.getElementById('crud-content').innerHTML = crudStepBody(state.crudState.type, state.crudState.step);
  document.getElementById('crud-prev').style.visibility = state.crudState.step === 0 ? 'hidden' : 'visible';
  document.getElementById('crud-next').textContent = state.crudState.step === cfg.steps.length-1 ? (state.crudState.mode === 'edit' ? 'Save' : 'Create') : 'Next';
}

export function crudStepBody(type, step){
  if (type==='Project'){
    if (step===0) return `<div class="field-grid">${inputField('name','Project name','e.g. Retention Hub')}${selectField('owner','Owner',['Chris','Megan'])}${selectField('status','Status',['Planning','Active'])}${selectField('stage','Stage',['Design','Delivery'])}</div>`;
    if (step===1) return `<div class="field-grid">${inputField('startDate','Start date','DD MMM YYYY')}${inputField('targetDate','Target date','DD MMM YYYY')}${selectField('cadence','Review cadence',['Weekly','Monthly','Quarterly'])}${selectField('health','Health',['Green','Amber','Red'])}</div>`;
    if (step===2) return textAreaField('description','Description','Project purpose, intended outcome, important context...');
    return `<div class="field-grid">${inputField('personA','Attach person')}${selectField('roleA','Role',['Owner','SME','Approver','Other'])}${inputField('personB','Attach person')}${selectField('roleB','Role',['SME','Approver','Other'])}</div>`;
  }
  if (type==='Update'){
    if (step===0) return textAreaField('title','Update text','What changed?');
    if (step===1) return `<div class="field-grid">${inputField('project','Project')}${inputField('meeting','Related meeting')}</div>`;
    if (step===2) return `<div class="field-grid">${inputField('people','People to inform')}${inputField('loggedBy','Logged by')}</div>`;
    return `<div class="wizard-note">Review your update, then create. Further editing can happen later in Edit mode on the full record.</div>`;
  }
  if (type==='Decision'){
    if (step===0) return textAreaField('title','Decision text','What was decided?');
    if (step===1) return `<div class="field-grid">${inputField('project','Project')}${inputField('meeting','Related meeting')}</div>`;
    if (step===2) return `<div class="field-grid">${textAreaField('rationale','Rationale')}${textAreaField('impact','Impact')}</div>`;
    return inputField('people','People to inform');
  }
  if (type==='Action'){
    if (step===0) return textAreaField('title','Action text','What needs doing?');
    if (step===1) return `<div class="field-grid">${inputField('owner','Owner')}${inputField('due','Due date','DD MMM YYYY')}</div>`;
    if (step===2) return `<div class="field-grid">${inputField('project','Project')}${inputField('meeting','Meeting')}</div>`;
    return inputField('people','People to inform');
  }
  if (type==='Meeting'){
    if (step===0) return `<div class="field-grid">${inputField('title','Meeting title')}${inputField('date','Date & time')}</div>`;
    if (step===1) return `<div class="field-grid">${selectField('context','Context',['Project','Person','Programme'])}${inputField('related','Related project/person')}</div>`;
    if (step===2) return textAreaField('attendees','Attendees','Comma-separated for now in the prototype');
    return `<div class="wizard-note">Create the meeting, then capture updates, decisions, and actions from within the meeting workspace.</div>`;
  }
  if (type==='Person'){
    if (step===0) return `<div class="field-grid">${inputField('name','Name')}${inputField('role','Role/title')}</div>`;
    if (step===1) {
      return `<div class="field-grid">
        ${inputField('notes','Email / notes')}
        ${selectField('cadence','Cadence',['Optional','Monthly'])}
        ${inputField('lastMeeting','Last full meeting','DD MMM YYYY')}
        ${inputField('lastInteraction','Last short interaction','DD MMM YYYY')}
        ${inputField('cadenceSnoozeDays','Interaction snooze days','e.g. 5')}
      </div>`;
    }
    return `<div class="wizard-note">Create globally, then attach to projects in Owner / SME / Approver / Other roles as needed.</div>`;
  }
  if (type==='RAID item'){
    if (step===0) return `<div class="field-grid">${selectField('type','Type',['Risk','Action','Issue','Decision'])}${inputField('text','Title / text')}</div>`;
    if (step===1) return `<div class="field-grid">${inputField('owner','Owner')}${inputField('due','Due date')}</div>`;
    if (step===2) return `<div class="field-grid">${inputField('project','Project')}${inputField('meeting','Related meeting')}</div>`;
    return `<div class="wizard-note">Create now, then enrich severity, mitigation, and history in the full detail record.</div>`;
  }
  return `<div class="wizard-note">Wizard body</div>`;
}


export function handleDataClick(value, fromDashboard){
  if (fromDashboard){
    if (value.startsWith('project-')) right.innerHTML = dashboardProjectPanel(Number(value.split('-')[1]));
    if (value.startsWith('person-')) right.innerHTML = dashboardPersonPanel(Number(value.split('-')[1]));
    if (value.startsWith('actionrow-')) right.innerHTML = dashboardActionPanel(Number(value.split('-')[1]));
    if (value.startsWith('raid-')) right.innerHTML = dashboardRaidPanel(Number(value.split('-')[1]));
    if (value.startsWith('inform-')) right.innerHTML = dashboardPersonPanel(Math.min(Number(value.split('-')[1]), data.people.length-1));
    return;
  }
  if (value.startsWith('project-')) openModal('project', Number(value.split('-')[1]));
  if (value.startsWith('person-')) openModal('person', Number(value.split('-')[1]));
  if (value === 'meeting-main') openModal('meeting', 0);
  if (value.startsWith('update-')) openModal('update', Number(value.split('-')[1]));
  if (value.startsWith('decisionrow-')) openModal('decision', Number(value.split('-')[1]));
  if (value.startsWith('actionrow-')) openModal('action', Number(value.split('-')[1]));
  if (value.startsWith('raidfiltered-')) openModal('raid', Number(value.split('-')[1]));
}
export function wireChecks(){
  document.querySelectorAll('[data-check]').forEach(box=>{
    box.addEventListener('change',e=>e.target.closest('.check-row').classList.toggle('done', e.target.checked));
  });
}
export function render(){
  renderNav();
  modalBackdrop.classList.remove('open');
  document.getElementById('modal-edit-btn').textContent = 'Edit mode';
  if (state.currentView==='dashboard') return renderDashboard();
  if (state.currentView==='projects') return renderProjects();
  if (state.currentView==='people') return renderPeople();
  if (state.currentView==='meetings') return renderMeetings();
  if (state.currentView==='updates') return renderUpdates();
  if (state.currentView==='decisions') return renderDecisions();
  if (state.currentView==='actions') return renderActions();
  if (state.currentView==='raid') return renderRaid();
  if (state.currentView==='settings') return renderSettings();
  return renderReports();
}
