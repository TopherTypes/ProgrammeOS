# Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project adheres to **Semantic Versioning**.

## [Unreleased]

### Added
- Implemented Milestone 0 Task 0.3 shared layout framework for all routes with a persistent sidebar and routed content outlet.
- Added a reusable `renderPageFrame` helper to centralise page shell rendering and support an optional detail panel.
- Implemented Milestone 1 Task 1.1 IndexedDB initialisation using `idb@8.0.3` with required MVP object stores (`people`, `projects`, `meetings`, `actions`, `decisions`, `updates`, `meta`).

### Changed
- Updated all existing route placeholder modules to use the shared page frame renderer instead of duplicating page-level markup.
- Refined base styling to support reusable page panels and optional two-column content layout.
- App bootstrap now initialises the IndexedDB layer before routing, and writes schema metadata (`meta.schemaVersion`) at startup.
- Updated project documentation and version metadata for Milestone 1 Task 1.1.

### Fixed
- Ensured route fallbacks and dashboard rendering now use the same layout framework as feature pages.
- Resolved a duplicate `renderPageFrame` export declaration in `js/layout.js` that caused browser module parsing to fail.

### Removed
- None.

---

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
