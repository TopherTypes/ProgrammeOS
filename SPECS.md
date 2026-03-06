# SPEC.md

Programme Work Management App

------------------------------------------------------------------------

## 0. Implementation Alignment Notes

- v0.0.29 updates route + data baseline: add canonical update normalization/validation (`description` required, optional `meetingId`/`projectIds`) and updates CRUD data helpers (`createUpdate`, `getUpdate`, `listUpdates`, `updateUpdate`) with immutable `id`/`createdAt` preservation; replace `#/updates` placeholder with toolbar/list/detail rendering, modal-driven create flow (Escape/cancel/overlay dismissal, focus restoration, inline validation/status), linked meeting/project name resolution where available, and Projects/Meetings-consistent stale-selection fallback handling.
- v0.0.28 decisions route + data baseline: add canonical decision normalization/validation (`description` required, optional `meetingId`/`projectIds`) and decisions CRUD data helpers (`createDecision`, `getDecision`, `listDecisions`, `updateDecision`) with immutable `id`/`createdAt` preservation; replace `#/decisions` placeholder with toolbar/list/detail rendering, modal-driven create flow (Escape/cancel/overlay dismissal, focus restoration, inline validation/status), linked meeting/project name resolution where available, and Projects/Meetings-consistent stale-selection fallback handling.
- v0.0.27 actions route + data baseline: add canonical action normalization/validation (`description` required) and actions CRUD data helpers (`createAction`, `getAction`, `listActions`, `updateAction`) with immutable `id`/`createdAt` preservation; replace `#/actions` placeholder with toolbar/list/detail rendering, explicit empty+missing-selection fallbacks, modal-driven create flow (Escape/cancel/overlay dismissal, focus restoration, inline validation/status), and in-route create/update rehydration without full reload.
- v0.0.26 milestone 4 completion alignment: Meetings behaviour is now a delivered baseline for MVP with canonical meeting model validation, route-frame/list/detail rendering, modal-driven creation flow, related people/project name resolution, keyboard-friendly row selection, and Node-runnable verification coverage (`node js/features/meetings/meeting-record.check.mjs`) maintained as the documented acceptance gate.
- v0.0.25 meetings check script expansion: `js/features/meetings/meeting-record.check.mjs` must run directly in Node with explicit pass/fail output, covering normalization defaults/trimming, required-field validation failures (`title`, `date`), attendee/project id-array deduplication, and create/get/list/update sanity checks against IndexedDB-wrapper-style APIs.
- v0.0.24 meetings detail/accessibility enhancement: extend `js/features/meetings/index.js` detail rendering to show `title`/`date`/`type`/`notes`, resolve attendee names from `listPeople()` and linked project names from `listProjects()`, provide safe stale-selection and unknown-link fallback messaging, and support Projects-consistent keyboard row interactions (Arrow Up/Down focus + Enter/Space selection).
- v0.0.22 meetings route baseline: replace placeholder meetings page rendering with a deterministic frame (`renderMeetingsPageFrame`), async `refreshMeetingsView` hydration from `listMeetings()`, dense list table (`Title`, `Date`, `Type`, `Attendees`), safe HTML escaping for user-provided fields, row-selection highlighting, and explicit detail empty/missing-selection fallback states.
- v0.0.21 meetings data access baseline: add `js/features/meetings/data.js` with `createMeeting`, `getMeeting`, `listMeetings`, and `updateMeeting` wrappers around shared DB helpers; reuse `normalizeMeeting`/`assertValidMeeting`; enforce non-empty meeting-id errors for read/update paths; preserve immutable `id`/`createdAt` during updates while refreshing `updatedAt`; and surface contextual persistence failures.
- v0.0.20 meetings record helper baseline: add `js/features/meetings/meeting-record.js` with pure canonical normalization for meeting records (`id`, `title`, `date`, `type`, `attendeeIds`, `projectIds`, `notes`, `createdAt`, `updatedAt`), enforce required non-empty `title` and `date` validation before persistence, and keep attendee/project links as trimmed de-duplicated id arrays.
- v0.0.19 projects CRUD UI completion: `#/projects` detail panel must expose delegated `Edit` and `Delete` controls for the active project; edit must open a prefilled modal with inline name-required validation and persist via `updateProject(projectId, patch)`; delete must require confirmation, execute `deleteProject(projectId)`, clear invalid selection state, refresh list/detail hydration, and communicate success/failure status outcomes.
- v0.0.18 projects delete helper: the projects data module must expose `deleteProject(projectId)` with non-empty id validation, delegated `deleteEntity("projects", projectId)` persistence, and contextual failure errors; lightweight project checks should cover create -> delete lifecycle expectations for get/list behaviour.
- v0.0.17 projects create modal: `#/projects` must expose a `New Project` modal with `name`, `description`, `status`, and multi-select `stakeholderIds`, including Escape/cancel/overlay dismissal, focus restoration, inline modal status/error messaging, async persistence via `createProject`, and post-save list/detail refresh.
- v0.0.16 milestone 3 completion alignment: Project Management implementation status now reflects delivered Milestone 3 scope (project data model persistence + Projects list/detail route behaviour) and roadmap markers updated to complete.
- v0.0.14 projects data model helpers: introduce canonical project normalization/validation (`name` required), safe defaults (`description`, `status`, `stakeholderIds`), dedicated project CRUD wrapper functions for the `projects` store, and immutable-field-preserving project updates with refreshed `updatedAt`.
- v0.0.15 projects list/detail selection: `#/projects` must present a dense Project list table with click + keyboard selection affordances, keep selected-project route state in memory, highlight the active row, fetch full Project detail on selection (including key stakeholder count/list), and provide safe fallback messaging when a selected project is missing.
- v0.0.13 projects page scaffold: `#/projects` must render a static frame with toolbar (`New Project` + status), asynchronous IndexedDB-backed list hydration, explicit list/detail empty states, deterministic `data-role` mount checks, and list-driven detail selection.
- v0.0.12 milestone 2 completion: People directory behaviour is now the baseline product definition, including the normalized people model (`id`, `name`, `organisation`, `notes`, `createdAt`, `updatedAt`), list-table rendering on `#/people` (name + organisation + empty state), and modal-based person creation with required-name validation, cancel/Escape dismissal, focus restoration, and immediate post-save list refresh.
- v0.0.11 people create modal: `#/people` must expose a `New Person` trigger that opens a modal with `name`, `organisation`, and `notes`, support cancel + Escape dismissal, validate required name input, persist via people data module, and refresh the people table immediately after successful saves.
- v0.0.10 people page rendering: `#/people` must render a people directory table (name + organisation), show an explicit empty state when no records exist, and refresh in place after create actions by loading data through the people data module.
- v0.0.9 people data module: add `js/features/people/data.js` to wrap generic DB helpers with `createPerson`/`updatePerson` paths, required-name validation, immutable `id`/`createdAt` handling, and normalized person retrieval for consistent UI rendering.
- v0.0.8 schema version management: add explicit migration planning in `js/db-schema.js` and execute upgrades automatically via IndexedDB `upgrade` handling with persisted `meta.schemaVersion`.
- v0.0.7 database access layer: add Promise-based CRUD wrapper functions in `js/db.js` (`createEntity`, `updateEntity`, `deleteEntity`, `getEntity`, `listEntities`) with store validation and defensive error handling.
- v0.0.6 database foundation: initialise IndexedDB using the `idb` helper, create all required object stores (`people`, `projects`, `meetings`, `actions`, `decisions`, `updates`, `meta`), and persist `meta.schemaVersion` during startup.
- v0.0.5 stability correction: the layout module must expose a single `renderPageFrame` export to keep browser module loading valid and preserve shared page-frame behaviour across routes.

------------------------------------------------------------------------

## 0.1 Verification Commands

- Run `node js/features/meetings/meeting-record.check.mjs` to verify meeting record normalization, validation, deduplication, and lightweight wrapper-API lifecycle behaviour (create/get/list/update).
- Run `node js/features/actions/action-record.check.mjs` to verify action normalization defaults, required-field failures, ID deduplication, and lightweight wrapper-API lifecycle behaviour (create/get/list/update) with explicit pass/fail output.
- Run `node js/features/decisions/decision-record.check.mjs` to verify decision normalization defaults, required-field failures, ID deduplication, and lightweight wrapper-API lifecycle behaviour (create/get/list/update) with explicit pass/fail output.
- Run `node js/features/updates/update-record.check.mjs` to verify update normalization defaults, required-field failures, ID deduplication, and lightweight wrapper-API lifecycle behaviour (create/get/list/update) with explicit pass/fail output.

------------------------------------------------------------------------

## 1. Purpose

This application is a browser-based programme management tool designed
to help a single user manage complex programmes of work involving
multiple projects, stakeholders, meetings, and governance relationships.

The core philosophy of the application is that meetings and stakeholder
relationships are the central operational reality of programme work.
Most work emerges from conversations, decisions, and follow-up actions
rather than from pre-planned task structures.

The application focuses on capturing information generated in meetings
and ensuring it can be easily linked to projects, people, meetings,
actions, decisions, and updates.

The tool is designed as a local-first web application that runs entirely
in the browser. No server, user accounts, or external backend services
are required. Data is stored locally and can be exported or synchronised
with Google Drive for backup.

------------------------------------------------------------------------

## 2. Core Design Principles

### Local-first operation

The application must work fully offline and store all data locally in
the browser.

### No backend requirement

The application must never require a server or external authentication
system. The only permitted external integration is optional Google Drive
file syncing.

### Meeting-centric workflow

Meetings are the primary source of information entry. Actions,
decisions, and updates should commonly originate from meetings.

### Universal linking

All entities should be easily linkable to one another (meetings ↔ people
↔ projects ↔ actions/decisions/updates). The system must support
navigating these relationships easily.

### Orphan-friendly

Any entity should be creatable without being linked immediately (i.e.,
as an "orphan"), and linked later without friction.

### Communication tracking is first-class

The system must support tracking who needs to be informed about actions,
decisions, and updates and whether each person has been informed.

### Minimal friction

Capturing information during or immediately after meetings should be
quick and intuitive.

------------------------------------------------------------------------

## 3. MVP Feature Scope

### 3.1 People Management

The user must be able to create and manage a directory of people.

Each person record should include: - name - organisation or role -
optional notes - relationships to projects - meetings they attended -
items (actions/decisions/updates) they own or are involved in - items
that require updating them, including whether they have been informed
for each item

The system must allow people to be easily selected and linked when
creating meetings, actions, decisions, or updates.

In the MVP UI, the People page must present a visible list/table of existing people, provide a New Person modal create flow (`name`, `organisation`, `notes`) with predictable cancel/Escape keyboard handling, and support immediate list refresh after successful saves (no full app reload).

Current implementation status: **Delivered in Milestone 2**.

------------------------------------------------------------------------

### 3.2 Project Management

The user must be able to create and manage projects within the
programme.

Each project record should include: - project name - description -
status - key stakeholders (linked people) - linked meetings - linked
actions - linked decisions - linked updates

Projects serve as containers for programme work but should not impose
rigid task management structures.

Current implementation status: **Delivered in Milestone 3**.

In the current MVP implementation baseline, Project Management includes project record persistence through a dedicated data module and normalized project schema (`id`, `name`, `description`, `status`, `stakeholderIds`, `createdAt`, `updatedAt`), modal-driven project create/edit flows with required-name validation and multi-select stakeholder linking, and a Projects route with dense list rendering, keyboard/mouse selection, selected-row highlighting, stakeholder-aware detail hydration, delegated detail-panel Edit/Delete controls, confirmed deletion handling, and safe empty/missing detail fallback messaging.

------------------------------------------------------------------------

### 3.3 Meeting Logging

The user must be able to create records for meetings. Meetings are the
central activity within the system.

Each meeting should capture: - meeting title - date - meeting type -
attendees (linked people) - associated projects (optional) - meeting
notes - actions created during the meeting - decisions made during the
meeting - updates captured during the meeting

Meeting types include: - General - Project - Update

Meetings must support copying to create a future meeting shell. The new
meeting should copy title, type, attendees, and project links but not
actions, decisions, or updates.

Current implementation status: **Delivered in Milestone 4**.

In the delivered MVP baseline, Meetings include a route frame with toolbar/status/list/detail containers, async list hydration from IndexedDB (`listMeetings`) plus related people/project lookups for name resolution, dense table rendering, selected-row highlighting, click + keyboard selection (Arrow Up/Down focus and Enter/Space select), escaped user-provided text rendering, modal-driven meeting creation with validation and predictable dismissal/focus restoration, and explicit empty/missing detail fallbacks including safe unknown-linked-ID labels.



#### Meetings Baseline Verification (Milestone 4)

- Run `node js/features/meetings/meeting-record.check.mjs` and confirm all checks pass (normalization defaults/trimming, required-field validation failures, id-array deduplication, and create/get/list/update sanity checks).
- Open `#/meetings`, create a meeting via the modal with valid `title` + `date`, and confirm list/detail rehydrate without route reload.
- Confirm keyboard row interaction (Arrow Up/Down focus movement, Enter/Space selection), attendee/project name resolution, and stale-link fallback labels in detail (`Unknown person`, `Unknown project`).

------------------------------------------------------------------------

### 3.4 Action Tracking

Actions must include: - description - owner (linked person) - status -
due date (optional) - originating meeting (optional) - related
project(s) (optional) - communication tracking

------------------------------------------------------------------------

### 3.5 Decision Logging

Decisions must include: - decision statement - associated meeting
(optional) - related project(s) (optional) - optional notes -
communication tracking

------------------------------------------------------------------------

### 3.6 Updates

Updates represent informational outputs.

Updates must include: - description - associated meeting (optional) -
related project(s) (optional) - optional notes - communication tracking

Meetings must support generic updates as well as updates tied to
specific discussions.

------------------------------------------------------------------------

### 3.7 Communication Tracking

Actions, decisions, and updates must support per-person update
requirements.

For each item the user must be able to: - mark people as requiring
update - mark each person individually as informed - view totals for: -
number requiring update - number still pending - view lists of: - people
requiring update - people still outstanding

------------------------------------------------------------------------

### 3.8 Programme Dashboard

The dashboard should surface: - recent meetings - upcoming actions due -
active projects - recent decisions - recent updates - outstanding
communication workload

------------------------------------------------------------------------

### 3.9 In Focus View

The In Focus view should prioritise: - actions due soon - recently
assigned actions - recent meeting outputs - items with outstanding
communication requirements

------------------------------------------------------------------------

### 3.10 Update Meeting View

Update meetings must include a specialised view that: - surfaces
actions, decisions, and updates requiring updates for the meeting
attendees - allows marking updates as complete for those attendees
efficiently

------------------------------------------------------------------------

## 4. Core Data Entities

-   People
-   Projects
-   Meetings
-   Actions
-   Decisions
-   Updates

------------------------------------------------------------------------

## 5. Entity Relationships

People ↔ meetings, projects, actions, updates

Meetings ↔ people, projects, actions, decisions, updates

Projects ↔ people, meetings, actions, decisions, updates

Actions ↔ person (owner), meeting, projects, people requiring update

Decisions ↔ meeting, projects, people requiring update

Updates ↔ meeting, projects, people requiring update

------------------------------------------------------------------------

## 6. Data Persistence

The application must: - store data locally - support JSON export -
support JSON import

Future versions may include Google Drive syncing.

------------------------------------------------------------------------

## 7. MVP Views

-   Dashboard
-   Projects
-   People Directory
-   Meetings
-   In Focus

------------------------------------------------------------------------



### 7.1 Shared layout shell

All routes must render inside a shared application shell with:

- persistent sidebar navigation
- main content container for page rendering
- optional detail panel container that stays available in the shell when a route needs it

This layout foundation avoids duplicated page-level shell markup and keeps route transitions visually consistent.

------------------------------------------------------------------------

## 8. Non-Goals

Not included in MVP: - authentication systems - servers - multi-user
collaboration - teams - RAID logs - governance boards

------------------------------------------------------------------------

## 9. MVP Acceptance Criteria

The MVP is complete when the user can:

1.  Create and edit people
2.  Create and edit projects
3.  Log meetings
4.  Copy meetings
5.  Capture actions, decisions, and updates
6.  Create orphan entities
7.  Link all entities
8.  Track required updates for individuals
9.  Mark individuals as informed
10. View outstanding communication workload
11. Use update meetings to close updates
12. Export and import JSON data

------------------------------------------------------------------------

## 10. Future Expansion

Potential later features: - teams - RAID logs - governance structures -
reporting cycles - Google Drive sync

------------------------------------------------------------------------

## 11. Implementation Baseline (v0.0.1)

The initial application foundation must include a runnable static shell with:

- `index.html` as the single entry page
- shared styling in `css/styles.css`
- JavaScript modules organised into:
  - `js/app.js` (bootstrap)
  - `js/router.js` (route management)
  - `js/layout.js` (shared shell rendering)
  - `js/db.js` (data-layer placeholder)
  - `js/features/*` (feature-specific modules)
  - `js/ui/*` (shared UI modules)

This baseline exists to keep future milestones modular and predictable while remaining zero-build.


### 11.1 Routing baseline (Milestone 0 / Task 0.2)

The application foundation must include a hash-based router that:

- listens to `hashchange` events
- renders the page module mapped to the active route
- supports browser back/forward navigation
- supports direct navigation via URL hash

Required foundation routes:

- `#/dashboard`
- `#/projects`
- `#/people`
- `#/meetings`
- `#/focus`
