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
