# System Specifications

## Interaction Model

Two primary operating modes:

1.  Dashboard attention mode
2.  Entity workspace mode

## Dashboard

Displays attention signals including:

-   Projects needing review
-   People needing meetings
-   Programme RAID
-   Meeting workspace
-   Pending informs
-   Overdue actions

Each panel links to full entity details.

## Entity Views

Entities open in fullscreen modal workspaces.

Views include:

-   Projects
-   People
-   Meetings
-   Updates
-   Decisions
-   Actions
-   RAID
-   Reports

## Project Workspace

Tabs include:

-   Overview
-   RAID
-   Updates
-   Meetings
-   People
-   Actions
-   Decisions

## RAID Register Fields

-   type
-   title
-   date logged
-   owner
-   status
-   severity
-   mitigation
-   related meeting
-   last updated

## CRUD Model

Two entry points:

Global create: Accessible from the top bar.

Contextual create: Triggered within projects or meetings.

## Progressive Disclosure

Creation wizards reveal fields gradually.

Example update workflow:

1.  Update text
2.  Context
3.  People to inform
4.  Review

## Attention Logic

Projects flagged when:

-   review cadence exceeded
-   overdue actions exist

People flagged when:

-   meeting cadence exceeded
-   actions assigned to them overdue
-   short interaction snooze has expired (if configured)

People cadence snooze rule:

-   each person can store `lastInteraction` and `cadenceSnoozeDays`
-   interaction snooze temporarily nudges the cadence due threshold without updating `lastMeeting`
-   this supports short-touchpoint logging without falsely resetting full-meeting cadence


## Data Layer

-   Repository API is the single read/write boundary for UI modules.
-   Persistence target: IndexedDB (schema-versioned).
-   Initial migration source: existing mock-data structure.
-   Stored model is normalized, with shared entities linked by IDs.
-   Settings view includes a user-triggered sample data reload action.
