# Programme Work Management App

Current version: **0.0.27**

A local-first, zero-build programme management application designed to run directly in the browser and be deployable on GitHub Pages.

## Repository Structure (Milestone 0 / Task 0.1)

```text
/index.html
/css/styles.css
/js/app.js
/js/router.js
/js/layout.js
/js/db.js
/js/ui/
/js/features/
/js/features/people/
/js/features/projects/
/js/features/meetings/
/js/features/actions/
/js/features/decisions/
/js/features/updates/
/js/features/focus/
/docs/
```

## Local Run

Open `index.html` directly in a browser.


## Routing (Milestone 0 / Task 0.2)

The app now uses a hash-based router with the following routes:

- `#/dashboard`
- `#/projects`
- `#/people`
- `#/meetings`
- `#/focus`

Navigation updates page content without full-page reloads and supports browser back/forward navigation.


## Layout Framework (Milestone 0 / Task 0.3)

The app now renders all routes inside a shared layout shell:

- Persistent sidebar navigation
- Main content container used by every route
- Dedicated optional detail panel container in the base shell
- Reusable page frame helper to avoid duplicated page layout logic


## Stability Fixes (v0.0.5)

- Resolved a JavaScript module parse error caused by a duplicated `renderPageFrame` export in `js/layout.js`.

## Database Foundation (Milestone 1 / Task 1.1)

- IndexedDB now initialises at application startup using `idb@8.0.3`.
- Database name: `programme-manager-db`.
- Created stores: `people`, `projects`, `meetings`, `actions`, `decisions`, `updates`, `meta`.
- The `meta` store now records `schemaVersion` for migration readiness.

## Database Access Layer (Milestone 1 / Task 1.2)

- Added Promise-based CRUD wrapper helpers in `js/db.js`:
  - `createEntity(store, data)`
  - `updateEntity(store, id, data)`
  - `deleteEntity(store, id)`
  - `getEntity(store, id)`
  - `listEntities(store)`
- Added store validation and defensive error wrapping so data-layer failures surface with clear context.



## Schema Version Management (Milestone 1 / Task 1.3)

- Added explicit migration planning in `js/db-schema.js` via version-keyed migration handlers.
- Database upgrades now run migrations automatically through IndexedDB `upgrade` hooks.
- Schema version metadata is written during upgrades and defensively re-asserted at startup.
- Added a lightweight Node verification script: `node js/db-schema.check.mjs` to simulate version changes.


## People Data Access Layer (Milestone 2 / Task 2.1)

- Added a dedicated people data module at `js/features/people/data.js` that wraps generic helpers from `js/db.js`.
- Added `createPerson` to persist normalized people with `id`, `name`, `organisation`, `notes`, `createdAt`, and `updatedAt`.
- Added `updatePerson` to preserve immutable fields (`id`, `createdAt`) while refreshing `updatedAt`.
- Added lightweight validation (`name` required) and normalization helpers in `js/features/people/person-record.js`.
- Added a lightweight verification script: `node js/features/people/person-record.check.mjs`.



## People Directory UI (Milestone 2 / Task 2.2)

- `#/people` now loads records through `js/features/people/data.js` (`listPeople`/`createPerson`).
- The People page renders a table with `name` and `organisation` columns.
- Added explicit empty-state messaging when no people are stored.
- Creating a person immediately refreshes the list in-place without requiring an app reload.


## People Create Modal (Milestone 2 / Task 2.3)

- `#/people` now provides a `New Person` trigger that opens a dedicated modal form.
- The modal captures `name`, `organisation`, and `notes` and validates required input before save.
- Escape key and Cancel controls close the modal predictably and restore focus to the launch button.
- Successful saves immediately refresh the people list so new records appear without route reloads.

## Delivered People Directory Capabilities (Milestone 2 Complete)

The delivered People feature set now includes:

- **People model**: each person record persists `id`, `name`, `organisation`, `notes`, `createdAt`, and `updatedAt`.
- **People list**: `#/people` renders a directory table with `name` and `organisation`, backed by IndexedDB and a clear empty state when no records exist.
- **Creation flow**: `New Person` opens a modal that captures `name`, `organisation`, and `notes`, validates required name input, supports Cancel/Escape dismissal, and refreshes the list immediately after save.



## Projects System (Milestone 3)

Milestone 3 is now delivered and provides the complete shipped baseline for Project Management in the MVP:

- **Project data model and storage**
  - Project records are normalized through `js/features/projects/project-record.js` and persisted via `js/features/projects/data.js`.
  - Stored fields include `id`, `name`, `description`, `status`, `stakeholderIds`, `createdAt`, and `updatedAt` and support dedicated deletion via `deleteProject(projectId)`.
  - Validation enforces required project `name`, while optional values default safely (`description: ""`, `status: "active"`, `stakeholderIds: []`).
- **Projects route frame and hydration**
  - `#/projects` renders a dedicated toolbar (`New Project` button + live status text), list container, and detail panel.
  - Project list hydration runs asynchronously from IndexedDB after static frame render.
  - Route mount checks validate required `data-role` nodes and fail with a deterministic mount error if containers are missing.
- **Projects create modal flow**
  - `New Project` opens a dedicated modal that captures `name`, `description`, `status`, and multi-select `stakeholderIds` sourced from people records.
  - The modal supports predictable Cancel/Escape/overlay dismissal and restores focus to the launch trigger after close.
  - Submit uses inline modal status/error messaging and persists via `createProject`, then refreshes list/detail hydration on success.
- **Projects list and detail behaviour**
  - The list renders as a dense table (`Project`, `Status`, `Stakeholders`).
  - Selection supports mouse and keyboard interaction (Arrow Up/Down focus movement, Enter/Space selection).
  - The selected row is visibly highlighted and detail content updates from `getProject` reads.
  - Detail content includes status, description, stakeholder count, and stakeholder names resolved from people records.
  - Detail panel controls now expose **Edit** and **Delete** actions for the selected project.
  - Edit opens a prefilled project modal and persists changes through `updateProject(projectId, patch)` with route-level success/failure status text.
  - Delete requires explicit confirmation, calls `deleteProject(projectId)`, clears stale selection state, and rehydrates list/detail UI via `refreshProjectsView(...)`.
  - Empty and missing-selection fallback messages are rendered explicitly to avoid stale detail content.

### Verification Steps (Milestone 3, updated)

1. Open `index.html` and navigate to `#/projects`.
2. Confirm the Projects toolbar displays `New Project` and a live status message area.
3. Click **New Project** and confirm a modal opens with `name`, `description`, `status`, and multi-select stakeholders.
4. Save a new project and confirm list/detail panels refresh and top-level status reports success.
5. Trigger a validation or persistence failure and confirm inline modal messaging reports the error without closing.
6. Select a project row with a mouse click and confirm selected-row highlighting appears.
7. Confirm the detail panel updates with status, description, stakeholder count, and stakeholder names.
8. Focus a project row button and use Arrow Up/Arrow Down to move between rows.
9. Press Enter or Space on a focused row and confirm selection + detail hydration updates.
10. Click **Edit** in the detail panel, update fields, and confirm save succeeds with updated values and success status text.
11. Trigger an edit validation/persistence failure and confirm failure status text is shown.
12. Click **Delete** in the detail panel, confirm deletion in the prompt, and verify the project is removed with success status text.
13. Cancel the delete confirmation once and confirm no data is deleted and cancellation is communicated.
14. Remove a selected project from storage (or select a stale ID during testing) and confirm the detail panel shows the safe missing-project fallback message.

## Implementation Status (Milestone Progress)

- ✅ Milestone 0 — Application Foundation
- ✅ Milestone 1 — Database Layer
- ✅ Milestone 2 — People System
- ✅ Milestone 3 — Projects System
- ✅ Milestone 4 — Meetings System
- ⚠️ Milestone 5+ — Pending

## Meetings Route Baseline (v0.0.24)

- `#/meetings` now renders a deterministic route frame with:
  - toolbar actions (`New Meeting` trigger + live status region with `aria-live="polite"`)
  - dedicated meetings list container (table or explicit empty state)
  - detail panel container with empty and missing-selection fallback messaging
- Route hydration now runs through async `refreshMeetingsView(...)` backed by `listMeetings()`.
- `New Meeting` now opens `openNewMeetingModal(...)`, which loads people/projects options, captures `title`, `date`, optional `type`, optional `notes`, and multi-select relationship links (`attendeeIds`, `projectIds`).
- Modal lifecycle follows established patterns: Escape/cancel/overlay dismissal, launch-trigger focus restoration on close, inline required-field validation, and inline persistence failure messaging.
- The meetings list renders as a dense table with `Title`, `Date`, `Type`, and `Attendees` columns.
- User-provided meeting strings are escaped before template insertion to prevent unsafe HTML injection.
- Row selection state is preserved in-memory, selected rows are visually highlighted, and detail content updates with selection changes.
- Meeting detail now renders resolved attendee names (from `listPeople()`) and linked project names (from `listProjects()`), with explicit unknown-ID labels (`Unknown person`, `Unknown project`).
- Meetings list keyboard interactions now support Arrow Up/Down focus movement plus Enter/Space selection to match the Projects accessibility interaction pattern.

## Manual Verification (v0.0.24)

1. Open `index.html` and navigate to `#/people`.
2. Create at least one person from **New Person** so stakeholder options are available.
3. Navigate to `#/projects`, open **New Project**, complete all fields (including multi-select stakeholders), and save.
4. Confirm the new project appears in the list and detail panel without route reload.
5. Use **Edit** from the detail panel to update name/status and confirm changes persist after refresh.
6. Use **Delete** from the detail panel, confirm the prompt, and verify the record is removed cleanly.
7. Run `node js/features/meetings/meeting-record.check.mjs` and confirm meeting normalization defaults/trimming, validation failures, id-array deduplication, and create/get/list/update wrapper-API sanity checks all pass.
8. Navigate to `#/meetings`, click **New Meeting**, and verify the modal opens with fields for title, date, type, attendees, projects, and notes.
9. Submit with empty title/date and verify inline validation messages appear without closing the modal.
10. Press Escape, click Cancel, and click the backdrop in separate attempts to confirm each dismissal path closes the modal and returns focus to the **New Meeting** trigger.
11. Reopen the modal, complete required fields, save, and confirm the list/detail panes rehydrate to include the new meeting.
12. Trigger a persistence error (for example via invalid console-injected data) and confirm inline modal status text reports the failure.
13. Focus a meeting row button and use Arrow Up/Arrow Down to move focus between rows, then press Enter and Space in separate attempts to confirm keyboard selection updates detail content.
14. Create or inspect a meeting linked to people/projects and confirm the detail panel resolves names from stored IDs; for deliberately stale linked IDs, confirm fallback labels show `Unknown person` and `Unknown project`.
15. In the browser console, call `createMeeting(...)`, `getMeeting(id)`, `listMeetings()`, and `updateMeeting(id, patch)` from `js/features/meetings/data.js` and confirm immutable `id`/`createdAt` fields stay unchanged while `updatedAt` refreshes after updates.
16. Run `node js/features/projects/project-record.check.mjs` and confirm normalization/validation plus lightweight project data lifecycle checks (create -> delete -> get/list expectations) pass.



## Actions Route Baseline (v0.0.27)

- `#/actions` now renders a deterministic frame with:
  - toolbar actions (`New Action` trigger + `aria-live="polite"` status text)
  - actions list container rendered as a dense table or explicit empty state
  - detail panel with empty and missing-selection fallback messaging
- Added `js/features/actions/action-record.js` with `normalizeAction(...)` and `assertValidAction(...)`:
  - required `description` validation
  - optional normalization for `ownerPersonId`, `status`, `dueDate`, `meetingId`, `projectIds`, and `requiresUpdateByPersonId`
  - deduplicated/trimmmed `projectIds` and canonical per-person requires-update map shaping
- Added `js/features/actions/data.js` create/read/list/update helpers backed by shared `js/db.js` wrappers.
- `updateAction(...)` now preserves immutable `id`/`createdAt` metadata while refreshing `updatedAt`.
- Added `js/features/actions/new-action-modal.js` with required description validation, Escape/cancel/overlay dismissal, trigger focus restoration, and inline status/error messaging.
- Route hydration now runs through `refreshActionsView(...)`, and successful create/update operations refresh list + detail in place without route reload.
- Added lightweight verification script: `node js/features/actions/action-record.check.mjs`.

## Manual Verification (v0.0.27)

1. Open `index.html` and navigate to `#/actions`.
2. Confirm Actions toolbar renders with **New Action** and live status text.
3. Confirm explicit empty-state messaging appears when no action records exist.
4. Click **New Action** and submit empty description; verify inline required-field validation appears and modal remains open.
5. Dismiss the modal via Escape, Cancel, and overlay click in separate attempts; confirm each path closes and restores focus to the trigger.
6. Reopen modal, create an action with description, optional status, and optional due date; confirm list/detail rehydrate immediately without full reload.
7. Select different rows and confirm detail panel updates; use a stale selected id during testing and confirm missing-selection fallback appears.
8. In detail panel, click **Mark Done**/**Mark Open** and confirm update status persists and list/detail refresh in-place.
9. Run `node js/features/actions/action-record.check.mjs` and confirm action normalization/validation checks pass.

## Smoke Checklist Outcomes (v0.0.27)

- ✅ Entity creation: **People pass; Projects pass including modal-based UI creation flow**.
- ✅ Meeting logging: **Pass — meetings model/data helpers, modal create flow, list/detail rendering, relationship name resolution, and keyboard interactions verified as delivered Milestone 4 baseline**.
- ⚠️ Action/decision/update creation: **Partially delivered — Actions create/update/list/detail baseline is now implemented; Decisions/Updates remain pending.**
- ⚠️ Communication tracking: **Pending milestone implementation**.
- ⚠️ JSON export/import: **Pending milestone implementation**.

## Meetings Data Access Baseline (v0.0.21)

- Added shared meeting record helpers in `js/features/meetings/meeting-record.js`.
- Added dedicated meeting data access helpers in `js/features/meetings/data.js` (`createMeeting`, `getMeeting`, `listMeetings`, `updateMeeting`) backed by the shared `meetings` store.
- `normalizeMeeting(meeting)` now returns the canonical shape:
  - `id`, `title`, `date`, `type`, `attendeeIds`, `projectIds`, `notes`, `createdAt`, `updatedAt`
- `assertValidMeeting(meeting)` enforces required non-empty `title` and `date` fields used by create/update persistence paths.
- Internal normalization ensures `attendeeIds` and `projectIds` are trimmed, non-empty, and de-duplicated.
- Added lightweight verification script:
  - `node js/features/meetings/meeting-record.check.mjs` (normalization/validation + lightweight wrapper-API lifecycle sanity checks)
