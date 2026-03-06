
# PLANS.md
Programme Work Management App Development Roadmap

This document defines the implementation roadmap for the application.

Work is organised into **milestones**, each consisting of:
- tasks
- acceptance criteria
- verification steps

Milestones are intentionally **small and incremental** so that the application remains runnable after each milestone.

AI agents must follow the operational rules defined in **AGENTS.md** and respect the architecture defined in **DECISIONS.md**.

---

## Milestone Status

- [x] Milestone 0 — Application Foundation
- [x] Milestone 1 — Database Layer
- [x] Milestone 2 — People System
- [x] Milestone 3 — Projects System
- [x] Milestone 4 — Meetings System
- [x] Milestone 5 — Actions, Decisions, Updates
- [ ] Milestone 6 — Communication Tracking
- [ ] Milestone 7 — Entity Linking UX
- [ ] Milestone 8 — Dashboard and Focus
- [ ] Milestone 9 — Import / Export

---

# Versioning Strategy

| Version | Meaning |
|--------|--------|
| v0.1.0 | First usable version for personal workflow |
| v0.5.0 | Feature complete |
| v1.0.0 | Stable release |

---

# Milestone 0 — Application Foundation
Target Version: v0.0.1

Goal: Create the application shell, routing system, and layout framework so that future features plug into a consistent structure.

## Task 0.1 — Repository Structure

Create the base directory structure.

Expected structure:

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
/docs/

Acceptance Criteria
- Opening index.html loads the application.
- No console errors.
- Project structure is modular and readable.

Verification
- Open the app locally.
- Confirm script loading order works.
- Confirm no missing imports.

---

## Task 0.2 — Router Implementation

Implement a hash-based router.

Required routes:
#/dashboard
#/projects
#/people
#/meetings
#/focus

Requirements
- Router listens for hash changes.
- Router renders the appropriate page component.

Acceptance Criteria
- Switching routes updates the page content.
- Browser back/forward navigation works.
- Direct navigation to routes works.

Verification
- Manually navigate between routes.
- Refresh the page on a nested route.

---

## Task 0.3 — Layout Framework

Create the base layout used by all pages.

Layout structure:

Sidebar navigation
Main content container
Optional detail panel

Requirements
- Layout reusable across pages.
- Sidebar persistent.
- Pages render inside main content container.

Acceptance Criteria
- Layout loads on every route.
- No duplicated layout logic across pages.

Verification
- Navigate between routes and confirm layout consistency.

---

# Milestone 1 — Database Layer
Target Version: v0.0.2

Goal: Implement persistent data storage using IndexedDB.

## Task 1.1 — IndexedDB Initialization

Use the idb helper library.

Database Name:
programme-manager-db

Object stores:

people
projects
meetings
actions
decisions
updates
meta

Acceptance Criteria
- Database opens successfully.
- Stores created during initialisation.
- Schema version stored.

Verification
- Open DevTools → Application → IndexedDB.
- Confirm stores exist.

---

## Task 1.2 — Database Access Layer

Create wrapper functions in db.js.

Functions required:

createEntity(store, data)
updateEntity(store, id, data)
deleteEntity(store, id)
getEntity(store, id)
listEntities(store)

Acceptance Criteria
- CRUD operations work across all stores.
- Functions return promises.
- Errors handled safely.

Verification
- Create test entries.
- Retrieve and delete them.

---

## Task 1.3 — Schema Version Management

Implement schema version handling.

Requirements
- Store schema version in meta store.
- Migration system ready for future upgrades.

Acceptance Criteria
- Schema upgrades run automatically.

Verification
- Simulate version change.

---

# Milestone 2 — People System
Target Version: v0.0.3
Status: **Completed (v0.0.12 documentation alignment)**

Goal: Implement the people directory.

## Task 2.1 — People Data Model ✅

Fields:

id
name
organisation
notes
createdAt
updatedAt

Acceptance Criteria
- People records stored in IndexedDB.

Verification
- Create multiple records and verify persistence.

---

## Task 2.2 — People List Page ✅

Features
- List all people.
- Show name and organisation.

Acceptance Criteria
- List loads from database.
- List updates when new records added.

Verification
- Add people and refresh page.

---

## Task 2.3 — Person Creation Modal ✅

Features
- Modal form.
- Fields: name, organisation, notes.

Acceptance Criteria
- Submitting modal creates record.
- Modal closes after save.

Verification
- Create new person.

---

# Milestone 3 — Projects System
Target Version: v0.0.4

Goal: Implement project tracking.

## Task 3.1 — Project Data Model ✅

Fields:

id
name
description
status
stakeholderIds
createdAt
updatedAt

Acceptance Criteria
- Projects persist correctly.

Verification
- Create project entries.

---

## Task 3.2 — Project UI ✅

Features
- Project list
- Project detail view

Acceptance Criteria
- Projects displayed correctly.

Verification
- Select project from list.

---

# Milestone 4 — Meetings System
Target Version: v0.0.5
Status: **Completed (v0.0.26 documentation alignment)**

Goal: Implement meeting logging.

## Task 4.1 — Meeting Data Model ✅

Fields:

id
title
date
type
attendeeIds
projectIds
notes
createdAt
updatedAt

Acceptance Criteria
- Meeting records persist with canonical shape (`id`, `title`, `date`, `type`, `attendeeIds`, `projectIds`, `notes`, `createdAt`, `updatedAt`).
- Validation enforces non-empty `title` and `date` before persistence.
- Linked attendee/project IDs are trimmed and deduplicated.

Verification
- Create meeting and reload page.

---

## Task 4.2 — Meeting Creation Modal ✅

Features
- Title
- Date
- Attendees selector
- Meeting type

Acceptance Criteria
- Modal captures `title`, `date`, `type`, `attendeeIds`, `projectIds`, and `notes` and stores a meeting successfully.
- Modal supports Escape/cancel/overlay dismissal, inline validation messaging, and trigger focus restoration.
- Successful saves refresh meetings list/detail panes without full app reload.

Verification
- Create meeting with attendees.

---

## Task 4.3 — Meeting Detail Page ✅

Acceptance Criteria
- Meeting information displayed.
- Attendees listed.
- Linked project names resolved and displayed.
- Meetings list supports click + keyboard selection (Arrow Up/Down focus, Enter/Space select).
- Empty/missing-selection and stale-link fallbacks render safely (`Unknown person`, `Unknown project`).

Verification
- Navigate to meeting detail page.

---

# Milestone 5 — Actions, Decisions, Updates
Target Version: v0.0.6
Status: **Completed (v0.1.0 milestone release alignment)**

Goal: Capture outputs from meetings.

## Task 5.1 — Action Model ✅

Fields:

id
description
ownerPersonId
status
dueDate
meetingId
projectIds
requiresUpdateByPersonId

Acceptance Criteria
- Actions route provides a deterministic toolbar/list/detail frame with explicit empty-state and missing-selection fallback messaging.
- New Action modal captures required `description` and optional owner/status/due-date/meeting/project links.
- Modal supports Escape/cancel/overlay dismissal, inline validation/status messaging, and trigger focus restoration.
- Actions are created, listed, and detail-rendered with in-place refresh after create/update operations.

Verification
- Navigate to `#/actions`, create an action, and confirm list/detail refresh without route reload.
- Run `node js/features/actions/action-record.check.mjs` and confirm normalization/validation + lifecycle checks pass.

---

## Task 5.2 — Decision Model ✅

Fields:

id
description
meetingId
projectIds

Acceptance Criteria
- Decisions route provides a deterministic toolbar/list/detail frame with explicit empty-state and missing-selection fallback messaging.
- New Decision modal captures required `description` plus optional meeting/project links.
- Modal supports Escape/cancel/overlay dismissal, inline validation/status messaging, and trigger focus restoration.
- Decisions persist with linked meeting/project name resolution in detail rendering when related records exist.

Verification
- Navigate to `#/decisions`, create a decision, and confirm list/detail refresh with linked-name fallback behavior.
- Run `node js/features/decisions/decision-record.check.mjs` and confirm normalization/validation + lifecycle checks pass.

---

## Task 5.3 — Update Model ✅

Fields:

id
description
meetingId
projectIds

Acceptance Criteria
- Updates route provides a deterministic toolbar/list/detail frame with explicit empty-state and missing-selection fallback messaging.
- New Update modal captures required `description` plus optional meeting/project links.
- Modal supports Escape/cancel/overlay dismissal, inline validation/status messaging, and trigger focus restoration.
- Updates persist with linked meeting/project name resolution in detail rendering when related records exist.

Verification
- Navigate to `#/updates`, create an update, and confirm list/detail refresh with linked-name fallback behavior.
- Run `node js/features/updates/update-record.check.mjs` and confirm normalization/validation + lifecycle checks pass.

---

# Milestone 6 — Communication Tracking
Target Version: v0.0.7

Goal: Track who must be informed about items.

## Task 6.1 — Requires Update Field

Structure:

requiresUpdateByPersonId = {
personId: { required: true, informedAt: null }
}

Acceptance Criteria
- Multiple people can be tracked.
- Informed status stored.

Verification
- Add and mark informed entries.

---

# Milestone 7 — Entity Linking UX
Target Version: v0.0.8

Goal: Make relationships easy to create and navigate.

## Task 7.1 — Autocomplete Person Selector

Features
- Searchable selector
- Pill-style display

Acceptance Criteria
- Attendees selectable quickly.

---

## Task 7.2 — Entity Linking UI

Features
- Link meetings to projects
- Link actions to meetings
- Link actions to people

Acceptance Criteria
- Navigation between linked entities works.

---

# Milestone 8 — Dashboard and Focus
Target Version: v0.1.0

Goal: Provide programme overview.

Dashboard Shows:
- recent meetings
- actions due
- recent updates
- outstanding communication tasks

Focus Page Shows:
- due actions
- pending updates

Acceptance Criteria
- Pages load data correctly.

---

# Milestone 9 — Import / Export
Target Version: v0.1.1

Goal: Data safety.

## Task 9.1 — Export

Export database snapshot as JSON.

## Task 9.2 — Import

Restore snapshot.

Acceptance Criteria
- Exported data can be reimported.

---

# Post v0.1 Future Work

Potential milestones:
- RAID logs
- governance tracking
- Google Drive sync
- reporting features
- teams


Update note (v0.0.26): Marked Milestone 4 complete after shipping meetings model/data helpers, modal create flow, list/detail rendering, keyboard interactions, linked-entity name resolution, and expanded Node verification coverage.
