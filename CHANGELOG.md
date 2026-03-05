# Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project adheres to **Semantic Versioning**.

## [Unreleased]

### Added
- None.

### Changed
- None.

### Fixed
- None.

### Removed
- None.

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
