# SPEC.md

Programme Work Management App

------------------------------------------------------------------------

## 0. Implementation Alignment Notes

- v0.0.5 stability correction: the layout module must expose a single `renderPageFrame` export to keep browser module loading valid and preserve shared page-frame behaviour across routes.

------------------------------------------------------------------------

## 1. Purpose

This application is a browser-based programme management tool designed
to help a single user manage complex programmes of work involving
multiple projects, stakeholders, meetings, and governance relationships.

The core philosophy of the application is that meetings and stakeholder
relationships are the central operational reality of programme work.
Most work emerges from conversations, decisions, and follow-up actions
rather than from pre-planned task structures.

The application focuses on capturing information generated in meetings
and ensuring it can be easily linked to projects, people, meetings,
actions, decisions, and updates.

The tool is designed as a local-first web application that runs entirely
in the browser. No server, user accounts, or external backend services
are required. Data is stored locally and can be exported or synchronised
with Google Drive for backup.

------------------------------------------------------------------------

## 2. Core Design Principles

### Local-first operation

The application must work fully offline and store all data locally in
the browser.

### No backend requirement

The application must never require a server or external authentication
system. The only permitted external integration is optional Google Drive
file syncing.

### Meeting-centric workflow

Meetings are the primary source of information entry. Actions,
decisions, and updates should commonly originate from meetings.

### Universal linking

All entities should be easily linkable to one another (meetings ↔ people
↔ projects ↔ actions/decisions/updates). The system must support
navigating these relationships easily.

### Orphan-friendly

Any entity should be creatable without being linked immediately (i.e.,
as an "orphan"), and linked later without friction.

### Communication tracking is first-class

The system must support tracking who needs to be informed about actions,
decisions, and updates and whether each person has been informed.

### Minimal friction

Capturing information during or immediately after meetings should be
quick and intuitive.

------------------------------------------------------------------------

## 3. MVP Feature Scope

### 3.1 People Management

The user must be able to create and manage a directory of people.

Each person record should include: - name - organisation or role -
optional notes - relationships to projects - meetings they attended -
items (actions/decisions/updates) they own or are involved in - items
that require updating them, including whether they have been informed
for each item

The system must allow people to be easily selected and linked when
creating meetings, actions, decisions, or updates.

------------------------------------------------------------------------

### 3.2 Project Management

The user must be able to create and manage projects within the
programme.

Each project record should include: - project name - description -
status - key stakeholders (linked people) - linked meetings - linked
actions - linked decisions - linked updates

Projects serve as containers for programme work but should not impose
rigid task management structures.

------------------------------------------------------------------------

### 3.3 Meeting Logging

The user must be able to create records for meetings. Meetings are the
central activity within the system.

Each meeting should capture: - meeting title - date - meeting type -
attendees (linked people) - associated projects (optional) - meeting
notes - actions created during the meeting - decisions made during the
meeting - updates captured during the meeting

Meeting types include: - General - Project - Update

Meetings must support copying to create a future meeting shell. The new
meeting should copy title, type, attendees, and project links but not
actions, decisions, or updates.

------------------------------------------------------------------------

### 3.4 Action Tracking

Actions must include: - description - owner (linked person) - status -
due date (optional) - originating meeting (optional) - related
project(s) (optional) - communication tracking

------------------------------------------------------------------------

### 3.5 Decision Logging

Decisions must include: - decision statement - associated meeting
(optional) - related project(s) (optional) - optional notes -
communication tracking

------------------------------------------------------------------------

### 3.6 Updates

Updates represent informational outputs.

Updates must include: - description - associated meeting (optional) -
related project(s) (optional) - optional notes - communication tracking

Meetings must support generic updates as well as updates tied to
specific discussions.

------------------------------------------------------------------------

### 3.7 Communication Tracking

Actions, decisions, and updates must support per-person update
requirements.

For each item the user must be able to: - mark people as requiring
update - mark each person individually as informed - view totals for: -
number requiring update - number still pending - view lists of: - people
requiring update - people still outstanding

------------------------------------------------------------------------

### 3.8 Programme Dashboard

The dashboard should surface: - recent meetings - upcoming actions due -
active projects - recent decisions - recent updates - outstanding
communication workload

------------------------------------------------------------------------

### 3.9 In Focus View

The In Focus view should prioritise: - actions due soon - recently
assigned actions - recent meeting outputs - items with outstanding
communication requirements

------------------------------------------------------------------------

### 3.10 Update Meeting View

Update meetings must include a specialised view that: - surfaces
actions, decisions, and updates requiring updates for the meeting
attendees - allows marking updates as complete for those attendees
efficiently

------------------------------------------------------------------------

## 4. Core Data Entities

-   People
-   Projects
-   Meetings
-   Actions
-   Decisions
-   Updates

------------------------------------------------------------------------

## 5. Entity Relationships

People ↔ meetings, projects, actions, updates

Meetings ↔ people, projects, actions, decisions, updates

Projects ↔ people, meetings, actions, decisions, updates

Actions ↔ person (owner), meeting, projects, people requiring update

Decisions ↔ meeting, projects, people requiring update

Updates ↔ meeting, projects, people requiring update

------------------------------------------------------------------------

## 6. Data Persistence

The application must: - store data locally - support JSON export -
support JSON import

Future versions may include Google Drive syncing.

------------------------------------------------------------------------

## 7. MVP Views

-   Dashboard
-   Projects
-   People Directory
-   Meetings
-   In Focus

------------------------------------------------------------------------



### 7.1 Shared layout shell

All routes must render inside a shared application shell with:

- persistent sidebar navigation
- main content container for page rendering
- optional detail panel container that stays available in the shell when a route needs it

This layout foundation avoids duplicated page-level shell markup and keeps route transitions visually consistent.

------------------------------------------------------------------------

## 8. Non-Goals

Not included in MVP: - authentication systems - servers - multi-user
collaboration - teams - RAID logs - governance boards

------------------------------------------------------------------------

## 9. MVP Acceptance Criteria

The MVP is complete when the user can:

1.  Create and edit people
2.  Create and edit projects
3.  Log meetings
4.  Copy meetings
5.  Capture actions, decisions, and updates
6.  Create orphan entities
7.  Link all entities
8.  Track required updates for individuals
9.  Mark individuals as informed
10. View outstanding communication workload
11. Use update meetings to close updates
12. Export and import JSON data

------------------------------------------------------------------------

## 10. Future Expansion

Potential later features: - teams - RAID logs - governance structures -
reporting cycles - Google Drive sync

------------------------------------------------------------------------

## 11. Implementation Baseline (v0.0.1)

The initial application foundation must include a runnable static shell with:

- `index.html` as the single entry page
- shared styling in `css/styles.css`
- JavaScript modules organised into:
  - `js/app.js` (bootstrap)
  - `js/router.js` (route management)
  - `js/layout.js` (shared shell rendering)
  - `js/db.js` (data-layer placeholder)
  - `js/features/*` (feature-specific modules)
  - `js/ui/*` (shared UI modules)

This baseline exists to keep future milestones modular and predictable while remaining zero-build.


### 11.1 Routing baseline (Milestone 0 / Task 0.2)

The application foundation must include a hash-based router that:

- listens to `hashchange` events
- renders the page module mapped to the active route
- supports browser back/forward navigation
- supports direct navigation via URL hash

Required foundation routes:

- `#/dashboard`
- `#/projects`
- `#/people`
- `#/meetings`
- `#/focus`
