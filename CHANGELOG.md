# Changelog

## v0.9.1 --- Project Modal CRUD Routing Fixes

Added:

- regression coverage for project modal lifecycle actions to assert edit opens CRUD in `mode: 'edit'` and delete removes the correct repository project id

Changed:

- modal CRUD mapping is now unified so project modal type resolves to both the `Project` CRUD type and `projects` collection consistently
- project modal edit now preloads existing project values (name, owner, cadence, dates, status, stage, health, review date, description)
- project modal id resolution now prefers ids from the denormalized app projection and safely falls back to repository ordering when ids are unavailable

## v0.9 --- Project Modal Editing Across All Tabs

Added:

- full edit-mode bodies for every project modal tab (overview, RAID, updates, meetings, people, actions, decisions)
- stable `data-crud-field` and `name` attributes for project modal edit controls so values can be collected consistently
- project-modal save/cancel actions wired directly to repository persistence (`repository.projects.update`)
- regression tests for project modal edit-field coverage and project patch-building behavior

Changed:

- project modal edit mode now exits only through explicit save/cancel actions in the modal tab header area
- project edit changes now refresh repository-backed state and re-open the modal in view mode with updated values

## v0.8 --- List Filtering, UX Safeguards, and JSON Backup

Added:

- list query/status filtering state persisted in the central UI store for high-volume views (Projects, Updates, Actions, RAID)
- explicit empty-state and no-results UX for major list views so users get guided feedback instead of blank tables
- non-destructive confirmation prompts for modal delete actions
- unsaved-change warnings for modal edit mode and CRUD wizard dismissal
- lightweight JSON export/import controls in Settings for portable backup and restore while backend integration is pending

Changed:

- settings page now includes backup/restore controls alongside sample-data reset actions
- repository now accepts validated normalized snapshot imports

## v0.7 --- Validation Module + Safe Render Hardening

Added:

- entity validation module covering required fields, date formats, enum constraints, and owner relationship integrity checks
- shared safe render helpers for escaping HTML/attribute content in template interpolation points
- regression tests for escaping behaviour and validation edge cases (empty text, malformed dates, unknown owner IDs)

Changed:

- CRUD flow now performs step-level validation and blocks forward/save actions until invalid fields are fixed
- CRUD inputs now render inline field errors from centralized validation rules
- card/table/modal template interpolation now escapes dynamic values before insertion into HTML

## v0.6 --- Derived Attention Engine + Person Cadence Snooze

Added:

-   attention engine module that derives project/person attention from canonical date/status fields at render time
-   person cadence snooze support using `lastInteraction` plus per-person `cadenceSnoozeDays`

Changed:

-   dashboard and table views now consume computed attention labels instead of static seed text
-   sample people/project data now stores only source-of-truth inputs for attention logic
-   person CRUD payloads now capture cadence inputs used by the derived attention model

## v0.5 --- CRUD Save + Modal Lifecycle Actions

Added:

-   deterministic CRUD field names/selectors across wizard steps so values can be persisted between steps
-   modal lifecycle actions for person/update/decision/action/meeting/RAID records (edit + delete)
-   inline validation messaging in CRUD save flow

Changed:

-   final CRUD step now saves via repository create/update methods rather than only closing the modal
-   post-save and post-delete flows now refresh the app data projection and preserve modal state when appropriate

## v0.4 --- IndexedDB Repository and Seed Controls

Added:

-   IndexedDB-backed repository module with CRUD methods for projects, people, meetings, updates, decisions, actions, and RAID items
-   schema-versioned persistence envelope and startup migration from mock data
-   normalized entity storage using ID links for shared entities (for example person references)
-   Settings navigation entry with a load-sample-data action

Changed:

-   render/state hydration now uses repository APIs instead of directly importing mock data in the app render module

## v0.3 --- Project Workspace Overhaul

Added:

-   project workspace modal
-   tabbed project interface
-   expanded RAID tables
-   project updates log
-   project people roles

New fields:

-   start date
-   target date
-   stage
-   health status

Introduced:

-   contextual creation actions
-   edit mode pattern

## v0.2 --- Modal Architecture

Added:

-   dark UI theme
-   fullscreen modal entity views
-   RAID tab filtering

## v0.1 --- Initial Prototype

Initial prototype with:

-   dashboard
-   project list
-   RAID view
-   meeting workspace
