# Programme Work Management App

Current version: **0.0.15**

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



## Projects Directory Frame (Milestone 3 / Task 3.1)

- `#/projects` now renders a dedicated route frame with:
  - a toolbar (`New Project` button + live status text)
  - a data-backed list container
  - a detail panel container with explicit empty prompts
- Projects list hydration now runs asynchronously from IndexedDB through the dedicated projects data module (`listProjects`) after the static frame is mounted.
- The route includes deterministic mount checks for required `data-role` nodes and throws a predictable error if the page cannot mount correctly.
- Empty-state messaging is explicit when no projects are stored, and the detail panel prompts users to select a project when applicable.

## Projects List + Detail Selection (Milestone 3 / Task 3.2)

- The Project list now renders as a dense table with `Project`, `Status`, and `Stakeholders` columns.
- Project selection is supported through mouse click and keyboard affordances (Tab + Enter/Space to select, Arrow Up/Down to move focus between project rows).
- The selected project row is visibly highlighted so the active Project detail view remains clear.
- The Project detail view now fetches full project data on selection (`name`, `description`, `status`, and key stakeholders) and renders stakeholder count + stakeholder list.
- If a selected project is missing (for example, deleted before detail hydration completes), the detail panel shows a safe fallback message instead of stale content.


## Projects Data Access Layer (Milestone 3 / Task 3.1)

- Added `js/features/projects/project-record.js` for project normalization and validation.
- Project normalization now enforces safe defaults: `description: ""`, `status: "active"`, and `stakeholderIds: []`.
- Added `js/features/projects/data.js` with `createProject`, `updateProject`, `getProject`, and `listProjects`, all backed by generic database helpers for the `projects` store.
- `updateProject` preserves immutable fields (`id`, `createdAt`) and always refreshes `updatedAt`.
- Added a lightweight verification script: `node js/features/projects/project-record.check.mjs`.

## Manual Verification (v0.0.15)

1. Open `index.html` and navigate to `#/people`.
2. Select **New Person**, enter values for all fields, and save.
3. Confirm the modal closes and the new row appears in the people table without reloading the page.
4. Open the modal again and press `Escape`; confirm the modal closes and focus returns to the **New Person** trigger.
5. Re-open the modal and submit with an empty name; confirm validation prevents save.
6. Navigate to `#/projects` and confirm the Project list appears as a dense table.
7. Select a row and confirm the selected row is highlighted and the Project detail view shows status, description, stakeholder count, and key stakeholders list.
8. With focus on a project row button, use Arrow Up/Arrow Down to move focus and Enter/Space to select; confirm detail content updates.

## Smoke Checklist Outcomes (v0.0.15)

- ⚠️ Entity creation: **People pass; Projects partial** (projects list/detail frame and empty-state delivered, create modal still pending milestone work).
- ⚠️ Meeting logging: **Pending milestone implementation**.
- ⚠️ Action/decision/update creation: **Pending milestone implementation**.
- ⚠️ Communication tracking: **Pending milestone implementation**.
- ⚠️ JSON export/import: **Pending milestone implementation**.
