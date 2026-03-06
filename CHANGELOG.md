# Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project adheres to **Semantic Versioning**.

## [Unreleased]

### Added
- Added Projects-consistent keyboard interactions for Meetings rows in `js/features/meetings/index.js`: Arrow Up/Down focus traversal and Enter/Space selection.

### Changed
- Extended Meetings detail rendering to resolve attendee names from `listPeople()` and linked project names from `listProjects()` and display those names in the detail panel.
- Updated Meetings detail content to render explicit sections for title/date/type/notes, attendees list, and linked projects list.
- Updated README, SPECS, ROADMAP, and VERSION metadata for the Meetings detail/accessibility enhancement release.

### Fixed
- Added safe fallback labels for stale linked IDs in Meeting detail (`Unknown person`, `Unknown project`) and preserved explicit missing-selection warning behavior when a selected meeting no longer exists.

### Removed
- None.

---

## [0.0.24] - 2026-03-06

### Added
- Added Projects-consistent keyboard interactions for Meetings rows in `js/features/meetings/index.js`: Arrow Up/Down focus traversal and Enter/Space selection.

### Changed
- Extended Meetings detail rendering to resolve attendee names from `listPeople()` and linked project names from `listProjects()` and display those names in the detail panel.
- Updated Meetings detail content to render explicit sections for title/date/type/notes, attendees list, and linked projects list.
- Updated README, SPECS, ROADMAP, and VERSION metadata for the Meetings detail/accessibility enhancement release.

### Fixed
- Added safe fallback labels for stale linked IDs in Meeting detail (`Unknown person`, `Unknown project`) and preserved explicit missing-selection warning behavior when a selected meeting no longer exists.

### Removed
- None.


---

## [0.0.23] - 2026-03-06

### Added
- Added `js/features/meetings/new-meeting-modal.js` implementing a dedicated New Meeting modal with required `title` + `date`, optional/defaulted `type`, optional `notes`, and multi-select relationship fields for `attendeeIds` (from `listPeople()`) and `projectIds` (from `listProjects()`).
- Added deterministic modal lifecycle handling for Meetings create flow: Escape/cancel/overlay dismissal, launch-trigger focus restoration, and inline validation/status messaging.

### Changed
- Wired the `#/meetings` toolbar `New Meeting` trigger to open the new modal, submit through `createMeeting`, and rehydrate meetings list/detail panes on successful save.
- Updated README, SPECS, ROADMAP, and VERSION metadata for the new Meetings create-modal baseline.

### Fixed
- Removed the non-functional Meetings toolbar placeholder response so the route now provides a working create flow.

### Removed
- None.

---

## [0.0.22] - 2026-03-06

### Added
- Added a deterministic Meetings route frame in `js/features/meetings/index.js` with toolbar actions (`New Meeting` trigger + `aria-live="polite"` status text), list container, and detail panel container with empty-selection fallback messaging.
- Added dense meetings table rendering (`Title`, `Date`, `Type`, `Attendees`) with selected-row highlighting and delegated row selection state handling.
- Added an HTML-escaping helper for user-provided meeting text before template insertion to prevent unsafe rendering.

### Changed
- Replaced the previous placeholder Meetings route implementation with async route hydration via `refreshMeetingsView(...)` backed by `listMeetings()`.
- Updated README, SPECS, ROADMAP, and VERSION metadata to align documentation/versioning with delivered meetings-route behaviour.

### Fixed
- Added deterministic mount checks for required Meetings `data-role` containers so template regressions fail predictably.

### Removed
- Removed the static Meetings placeholder message-only rendering path.

---

## [0.0.21] - 2026-03-06

### Added
- Added `js/features/meetings/data.js` with dedicated meetings data helpers: `createMeeting(meetingInput)`, `getMeeting(meetingId)`, `listMeetings()`, and `updateMeeting(meetingId, patch)`.
- Added contextual error handling for missing meeting identifiers and persistence failures across create/read/list/update meeting flows.

### Changed
- Updated README, SPECS, ROADMAP, and VERSION metadata to document meetings data access coverage and updated verification guidance.

### Fixed
- Ensured meeting updates preserve immutable fields (`id`, `createdAt`) while always refreshing `updatedAt` on successful writes.

### Removed
- None.

---


## [0.0.19] - 2026-03-05

### Added
- Added shared projects modal infrastructure in `js/features/projects/project-modal.js` and a dedicated `openEditProjectModal` wrapper for prefilled edit flows with inline required-name validation, Escape/overlay/cancel handling, and focus restoration.
- Added delegated detail-panel action controls (`Edit`, `Delete`) in `js/features/projects/index.js` for selected project records.

### Changed
- Extended Projects detail rendering to include explicit CRUD action controls and wired edit submissions to `updateProject(projectId, patch)` with route-level success/failure status updates.
- Implemented confirmed delete flow that calls `deleteProject(projectId)`, clears stale selection state, and refreshes the projects list/detail panes via `refreshProjectsView(...)`.
- Updated README, SPECS, ROADMAP, and VERSION metadata to reflect delivered Projects CRUD UI availability.

### Fixed
- Improved projects route feedback so update/delete outcomes now report deterministic status text for both success and failure paths.

### Removed
- None.

---

## [0.0.18] - 2026-03-05

### Added
- Added `deleteProject(projectId)` to `js/features/projects/data.js`, including non-empty id validation and delegation to `deleteEntity("projects", projectId)` for persistence.
- Expanded `js/features/projects/project-record.check.mjs` with a lightweight in-memory project data lifecycle verification path covering create -> delete -> get/list expectations.

### Changed
- Updated README, SPECS, ROADMAP, and VERSION metadata to document the new projects delete helper and verification coverage.

### Fixed
- Improved project deletion failure diagnostics by wrapping lower-level delete errors with project-specific context.

### Removed
- None.

---

## [0.0.17] - 2026-03-05

### Added
- Added `js/features/projects/new-project-modal.js` implementing a dedicated New Project modal lifecycle with Escape/cancel/overlay dismissal, focus restoration, inline status messaging, and required-name validation.
- Added stakeholder multi-select capture in the Project create modal using current People records (`stakeholderIds`).

### Changed
- Replaced the Projects toolbar placeholder click handler with live modal wiring that persists via `createProject`, refreshes list/detail hydration via `refreshProjectsView(...)`, and surfaces clear route-level success/failure status text.
- Updated README, SPECS, ROADMAP, PLANS, and VERSION metadata to reflect the delivered Projects modal create flow.

### Fixed
- Removed the non-functional New Project placeholder messaging so project creation now works from the Projects route UI.

### Removed
- Removed the temporary "Project creation flow is not available yet" trigger behaviour from `#/projects`.

---

## [0.0.16] - 2026-03-05

### Added
- Added a dedicated `Projects System (Milestone 3)` section to `README.md` documenting delivered Project Management capabilities and explicit verification steps for list/detail behaviour.

### Changed
- Updated `SPECS.md` Project Management implementation status to mark Milestone 3 as delivered and describe the shipped project persistence + Projects route baseline.
- Updated milestone status markers in `ROADMAP.md` and `PLANS.md` to show Milestone 3 as complete, including Task 3.1 and Task 3.2 completion indicators.
- Bumped project version references in documentation and `VERSION` from `0.0.15` to `0.0.16`.

### Fixed
- Fixed documentation drift where milestone/status notes still described Projects System as in progress despite shipped Milestone 3 scope.

### Removed
- None.

---

## [0.0.15] - 2026-03-05

### Added
- Added dense Project list table rendering with explicit `Project`, `Status`, and `Stakeholders` columns plus selected-row highlighting in `#/projects`.
- Added keyboard navigation affordances for Project list selection (Arrow Up/Down focus movement between rows, with native button Enter/Space activation).
- Added stakeholder-aware Project detail rendering with stakeholder count and key stakeholder names resolved from People records.
- Added safe missing-selection fallback messaging when a previously selected project can no longer be loaded (for example, deleted between list/detail reads).

### Changed
- Updated Projects route state handling to keep selection in-memory for the active route render cycle while supporting explicit list/detail re-hydration.
- Updated README, SPECS, ROADMAP, and VERSION metadata to reflect the delivered Milestone 3 Task 3.2 Project list/detail behaviour.

### Fixed
- Prevented stale Project detail rendering when a selected record disappears before detail hydration completes.

### Removed
- None.

---

## [0.0.14] - 2026-03-05

### Added
- Added `js/features/projects/project-record.js` with canonical project normalization helpers for `name`, `description`, `status`, `stakeholderIds`, `createdAt`, and `updatedAt`.
- Added project validation enforcing required `name` and safe defaults for optional fields (`description: ""`, `status: "active"`, `stakeholderIds: []`).
- Added dedicated projects data access module `js/features/projects/data.js` exposing `createProject`, `updateProject`, `getProject`, and `listProjects` backed by generic store helpers.
- Added lightweight verification script `js/features/projects/project-record.check.mjs` mirroring the People normalization/validation check approach.

### Changed
- Updated the Projects route hydration path to consume `listProjects` from the dedicated projects data module.
- Updated README, SPECS, DECISIONS, ROADMAP, and VERSION metadata to align docs with the delivered Projects data-layer capability.

### Fixed
- Ensured project updates preserve immutable fields (`id`, `createdAt`) and always refresh `updatedAt` when persisting changes.

### Removed
- None.

---

## [0.0.13] - 2026-03-05

### Added
- Added a Projects route frame on `#/projects` with an explicit toolbar (`New Project` + live status), list container, and detail container with empty prompt messaging.
- Added async IndexedDB hydration for the Projects route using a list/detail render split (frame render, list render, refresh function, and event wiring).
- Added deterministic mount validation for required Projects `data-role` nodes, with a stable error message when mount prerequisites are missing.

### Changed
- Updated README, SPECS, ROADMAP, and VERSION metadata to align product documentation with delivered Projects page scaffold behaviour.

### Fixed
- Replaced the previous Projects placeholder text-only implementation with structured, stateful route rendering and explicit empty states when no projects exist.

### Removed
- Removed the Projects route placeholder body text.

---
## [0.0.12] - 2026-03-05

### Added
- Added explicit documentation of delivered People directory capabilities (data model, list behaviour, and modal create workflow) in README and SPECS.
- Added manual verification steps and smoke checklist outcomes for current milestone coverage, including People entity creation status and pending areas (meetings, outputs, communication tracking, JSON import/export).

### Changed
- Updated roadmap and plan status markers to show Milestone 2 (People System) as completed and Milestone 3 onward as pending/in progress.
- Bumped project version to `0.0.12` and aligned version references across project documentation.

### Fixed
- Aligned product-definition documents with shipped People behaviour to reduce mismatch between planned vs implemented scope.

### Removed
- None.

---

## [0.0.11] - 2026-03-05

### Added
- Added a `New Person` trigger on `#/people` that opens a dedicated modal form with `name`, `organisation`, and `notes` fields.
- Added an accessible modal interaction model for People create flow, including Cancel control, Escape-key dismissal, focus restoration, and inline modal status messaging.

### Changed
- Replaced the inline People create form with a modal-based submit flow wired to `createPerson` and immediate in-page list refresh.
- Updated README, SPECS, ROADMAP, and VERSION metadata for the People modal milestone.

### Fixed
- Ensured new People records appear instantly after successful save without route or full app reload.

### Removed
- Removed the inline People create form from the page body in favor of a dedicated modal lifecycle.

---

## [0.0.10] - 2026-03-05

### Added
- Implemented a functional People page at `#/people` with an in-page create form and a rendered table of people records (`name`, `organisation`).
- Added explicit empty-state messaging in the People list area when no people records exist.

### Changed
- Updated People feature rendering to load records via the dedicated people data module (`listPeople`) and refresh list output immediately after successful create operations.
- Added People-page table/form styling in `css/styles.css` and updated README, SPECS, DECISIONS, ROADMAP, and VERSION documentation metadata.

### Fixed
- Removed the need for a full app reload to see newly created people records in the People route.

### Removed
- None.

## [0.0.9] - 2026-03-05

### Added
- Added a dedicated people data module in `js/features/people/data.js` that wraps generic IndexedDB helpers from `js/db.js`.
- Added person-specific create and update flows (`createPerson`, `updatePerson`) with immutable `id`/`createdAt` handling and automatic `updatedAt` refresh.
- Added `js/features/people/person-record.js` for person normalization and required-field validation (`name`).
- Added lightweight verification script `js/features/people/person-record.check.mjs` for normalization and validation checks.

### Changed
- Updated README, SPECS, DECISIONS, ROADMAP, and VERSION to reflect the people data-layer milestone.

### Fixed
- Ensured people retrieval helpers return normalized record objects for consistent UI rendering.

### Removed
- None.

## [0.0.7] - 2026-03-05

### Added
- Implemented Milestone 1 Task 1.2 by adding Promise-based database access wrapper functions in `js/db.js`: `createEntity`, `updateEntity`, `deleteEntity`, `getEntity`, and `listEntities`.

### Changed
- Added store-name validation and contextual error wrapping to ensure database-layer failures are handled safely and reported clearly.
- Updated README, SPECS, ROADMAP, and VERSION metadata for this milestone task.

### Fixed
- None.

### Removed
- None.

## [0.0.6] - 2026-03-05

### Added
- Created the IndexedDB data layer in `js/db.js` with database name `programme-manager-db`.
- Added startup schema creation for stores: `people`, `projects`, `meetings`, `actions`, `decisions`, `updates`, and `meta`.

### Changed
- Initial application bootstrap now awaits database initialisation before starting routes.
- Updated README, SPECS, DECISIONS, ROADMAP, and VERSION for this milestone task.

### Fixed
- Ensured `meta.schemaVersion` is persisted consistently during startup initialisation.

### Removed
- None.

## [0.0.5] - 2026-03-05

### Added
- None.

### Changed
- Updated README, roadmap, and spec alignment notes to document the layout module stability correction.

### Fixed
- Removed a duplicate `renderPageFrame` export declaration in `js/layout.js` that triggered `Identifier 'renderPageFrame' has already been declared`.

### Removed
- None.

## [0.0.4] - 2026-03-05

### Added
- Added a dedicated optional detail panel container directly in the global layout shell so every route shares the same sidebar/main/detail structure.

### Changed
- Updated routing and feature render signatures to use shared layout outlets (`mainOutlet`, `detailOutlet`) instead of container-only rendering.
- Updated styles to make the shell-level content grid responsible for optional two-column layout behaviour.
- Updated project documentation and version metadata for the layout framework correction.

### Fixed
- Corrected layout architecture so the optional detail panel is part of the base shell structure rather than being recreated inside page content.

### Removed
- None.

## [0.0.3] - 2026-03-05

### Added
- Completed Milestone 0 Task 0.3 by introducing a reusable application layout and page frame abstraction used by all routes.

### Changed
- Updated documentation and version metadata for the layout framework milestone completion.

### Fixed
- None.

### Removed
- None.

## [0.0.2] - 2026-03-05

### Added
- Implemented Milestone 0 Task 0.2 hash-based routing for `#/dashboard`, `#/projects`, `#/people`, `#/meetings`, and `#/focus`.
- Added sidebar navigation links to enable direct route switching through the shell UI.
- Added a Focus feature placeholder module to support the required `#/focus` route.

### Changed
- Updated router startup logic to render the active hash route on load and respond to browser hash history navigation.
- Updated project documentation to reflect routing behaviour and the current version.

### Fixed
- Aligned architectural routing documentation with the implemented foundation route set by including `#/focus`.

### Removed
- None.

## [0.0.1] - 2026-03-05
### Added
- Milestone 0 Task 0.1 repository and module structure scaffold.
- Initial runnable app shell with dashboard placeholder route.

### Changed
- Documentation updated for baseline structure and module conventions.

## [0.0.0] - 2026-03-05
### Added
- Initial project documentation scaffold (SPEC, DECISIONS, AGENTS, PLANS).
- Project conventions: local-first, IndexedDB storage, GitHub Pages deployment.
