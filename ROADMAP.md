# ROADMAP.md

Current version: **0.0.20**

This file mirrors milestone planning in `PLANS.md` and exists as a lightweight roadmap index.

## Near-term milestones

- [x] Milestone 0 (v0.0.1): Application foundation.
- [x] Milestone 1 (v0.0.2): IndexedDB persistence layer.
- [x] Milestone 2 (v0.0.3): People system (model, list, creation modal) — **complete**.
- [x] Milestone 3 (v0.0.4): Projects system (project model persistence + Projects list/detail interaction baseline) — **complete**.

For detailed tasks and acceptance criteria, see `PLANS.md`.


## Recent fixes

- v0.0.6: Added IndexedDB initialisation with all MVP object stores and schema version metadata persistence.
- v0.0.5: Removed a duplicate layout helper declaration that caused browser startup failure in the layout module.
- v0.0.7: Added Promise-based database access wrapper functions in `js/db.js` for create, read, update, delete, and list operations with safe error handling.

- v0.0.8: Added schema migration planning and automatic upgrade execution for IndexedDB schema versions.
- v0.0.9: Added a dedicated people data module with normalized person create/update/read/list flows and required-name validation.


- v0.0.10: Added a functional People directory page with in-route create flow, empty-state messaging, and immediate post-create list refresh.

- v0.0.11: Replaced inline People create form with a keyboard-friendly New Person modal including Escape/Cancel dismissal and immediate list refresh after save.
- v0.0.12: Marked Milestone 2 complete across planning docs and aligned release/documentation/version references to delivered People directory behaviour.
- v0.0.13: Added Projects route frame/list/detail rendering split with asynchronous hydration, deterministic mount checks, and explicit project empty states.
- v0.0.14: Added projects record normalization/validation, dedicated projects data helpers (`createProject`, `updateProject`, `getProject`, `listProjects`), immutable-field-safe updates, and a lightweight project record verification script.
- v0.0.15: Added Milestone 3 Task 3.2 Project list/detail selection behaviour (dense Project list table, keyboard/click selection affordances, selected-row highlight, stakeholder-resolved detail rendering, and safe missing-project fallback UI).

- v0.0.16: Marked Milestone 3 complete across roadmap/spec/readme docs and aligned implementation-status language with shipped Project Management behaviour.

- v0.0.17: Added New Project modal lifecycle (Escape/cancel/overlay close, focus restoration, inline status/error messaging), wired async `createProject` persistence, and refreshed Projects list/detail hydration after successful saves.
- v0.0.18: Added `deleteProject(projectId)` in the projects data module with explicit id validation and contextual delete error handling, and expanded lightweight project checks to cover create -> delete -> get/list lifecycle expectations.

- v0.0.19: Completed Projects UI CRUD by adding detail-panel Edit/Delete actions with prefilled edit modal validation, confirmed delete flow, selection-state cleanup, and status-aware route rehydration.
- v0.0.20: Added meetings record normalization/validation helpers (`normalizeMeeting`, `assertValidMeeting`) with required `title` + `date` enforcement, deduplicated attendee/project id arrays, and a lightweight Node verification script.

