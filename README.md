# Programme Work Management App

Current version: **0.0.8**

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
