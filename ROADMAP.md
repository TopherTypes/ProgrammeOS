# ROADMAP.md

Current version: **0.0.11**

This file mirrors milestone planning in `PLANS.md` and exists as a lightweight roadmap index.

## Near-term milestones

- Milestone 0 (v0.0.1): Application foundation.
- Milestone 1 (v0.0.2): IndexedDB persistence layer.
- Milestone 2 (v0.0.3): People system.

For detailed tasks and acceptance criteria, see `PLANS.md`.


## Recent fixes

- v0.0.6: Added IndexedDB initialisation with all MVP object stores and schema version metadata persistence.
- v0.0.5: Removed a duplicate layout helper declaration that caused browser startup failure in the layout module.
- v0.0.7: Added Promise-based database access wrapper functions in `js/db.js` for create, read, update, delete, and list operations with safe error handling.

- v0.0.8: Added schema migration planning and automatic upgrade execution for IndexedDB schema versions.
- v0.0.9: Added a dedicated people data module with normalized person create/update/read/list flows and required-name validation.


- v0.0.10: Added a functional People directory page with in-route create flow, empty-state messaging, and immediate post-create list refresh.

- v0.0.11: Replaced inline People create form with a keyboard-friendly New Person modal including Escape/Cancel dismissal and immediate list refresh after save.
