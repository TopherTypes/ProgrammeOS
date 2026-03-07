# ROADMAP.md

Current version: **0.5.3**

This file mirrors milestone planning in `PLANS.md` and exists as a lightweight roadmap index.

## Near-term milestones

- [x] Milestone 0 (v0.0.1): Application foundation.
- [x] Milestone 1 (v0.0.2): IndexedDB persistence layer.
- [x] Milestone 2 (v0.0.3): People system (model, list, creation modal) — **complete**.
- [x] Milestone 3 (v0.0.4): Projects system (project model persistence + Projects list/detail interaction baseline) — **complete**.
- [x] Milestone 4 (v0.0.5): Meetings system (meeting model/data helpers, modal create flow, meetings list/detail baseline, and keyboard-friendly selection) — **complete**.
- [x] Milestone 5 (v0.0.6): Actions, decisions, and updates baseline (modal create flows, list/detail routes, linked meeting/project resolution, and lightweight record verification) — **complete**.
- [~] Milestone 6 (v0.0.7): Communication tracking — **in progress** (record normalization + detail summaries shipped; full smoke workflow tracked in README checklist).
- [ ] Milestone 9 (v0.1.1): JSON import/export — **planned** (covered in release smoke checklist).

For detailed tasks and acceptance criteria, see `PLANS.md`.


## Recent fixes

- v0.5.3: Refreshed release smoke checklist documentation and recorded lightweight record/schema check outcomes for delivery verification.

- v0.3.1: Added centralized deterministic sort helpers for Meeting Review and meeting-filtered Actions/Decisions/Updates lists (action status bucket order + oldest-first createdAt tie-breaks; decisions/updates oldest-first only).

- v0.3.0: Added meeting-based filters to Actions, Decisions, and Updates pages with `All meetings` defaults, live meeting-title options, filtered list/detail selection reconciliation, and filter-aware status totals.

- v0.2.1: Extended New Action, New Decision, and New Update modal APIs with optional locked meeting config (`lockedMeetingId`, `lockedMeetingLabel`) so meeting-scoped launches prefill and lock meeting context while standalone routes keep meeting linkage optional/editable.

- v0.2.0: Extended Meetings detail with a linked Meeting Review area (Actions/Decisions/Updates grouped dense tables, per-section linked counts, explicit empty states, and automatic rehydration when linked records are created or updated).

- v0.1.0: Marked Milestone 5 complete across planning/roadmap/readme/spec docs, consolidated delivered Actions/Decisions/Updates workflows and acceptance criteria, and aligned release metadata for milestone publication.

- v0.0.29: Added Updates baseline delivery (update record/data helpers, New Update modal, updates list/detail route frame, linked meeting/project name resolution, and stale-selection defensive fallback behavior), plus a lightweight update-record verification script and aligned docs/version metadata.

- v0.0.28: Added Decisions baseline delivery (decision record/data helpers, New Decision modal, decisions list/detail route frame, linked meeting/project name resolution, and stale-selection defensive fallback behavior), and aligned docs/version metadata.

- v0.0.27: Replaced the Actions placeholder route with modal-driven create flow, list/detail hydration, and action record/data helpers including required description validation and immutable-field-safe updates.

- v0.0.26: Marked Milestone 4 complete across planning/spec/readme docs and published milestone release-note alignment for delivered Meetings baseline behaviour.

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
- v0.0.21: Added meetings data access helpers (`createMeeting`, `getMeeting`, `listMeetings`, `updateMeeting`) using the shared `meetings` store with required-field validation, immutable `id`/`createdAt` preservation on update, refreshed `updatedAt`, and contextual persistence errors.
- v0.0.20: Added meetings record normalization/validation helpers (`normalizeMeeting`, `assertValidMeeting`) with required `title` + `date` enforcement, deduplicated attendee/project id arrays, and a lightweight Node verification script.


- v0.0.22: Replaced `#/meetings` placeholder rendering with a deterministic meetings frame, async `listMeetings()` hydration (`refreshMeetingsView`), dense table/empty-state rendering, safe HTML escaping for user-provided values, and selected-row/detail fallback handling.
- v0.0.23: Added `openNewMeetingModal(...)` create flow with required `title`/`date`, optional/defaulted `type`, attendee/project multi-select linkage, notes capture, Escape/cancel/overlay dismissal, trigger-focus restoration, inline validation/persistence messaging, and successful post-save meetings rehydration.

- v0.0.24: Enhanced Meetings detail rendering with attendee/project name resolution from People/Projects stores, added safe unknown-link fallback labels, and implemented Projects-consistent keyboard row interactions (Arrow Up/Down focus, Enter/Space select).

- v0.0.25: Expanded `js/features/meetings/meeting-record.check.mjs` with explicit pass/fail output and coverage for normalization defaults/trimming, required-field validation failures, id-array deduplication, and create/get/list/update sanity checks via IndexedDB-wrapper-style APIs.
