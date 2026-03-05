# ROADMAP.md

Current version: **0.0.7**

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
