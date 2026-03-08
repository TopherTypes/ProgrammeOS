# System Architecture

## Overview

The Programme Management App is designed as a desktop-first web application for programme leadership, project oversight, governance tracking, and communication management.

The architecture should support three distinct but connected layers:

1. **Attention layer**
2. **Workspace layer**
3. **Communication layer**

These layers reflect how the user experiences the system and how the underlying logic should be organised.

---

## 1. Attention Layer

The attention layer powers the dashboard and any summary views that answer questions like:

- Which projects need review?
- Which people need meetings?
- Which actions are overdue?
- Which stakeholders still need to be informed?

This layer is not the source of truth. It is a computed layer derived from operational data.

### Responsibilities

- calculate project attention status
- calculate person attention status
- surface overdue actions
- surface pending informs
- support dashboard summaries
- support reporting summaries later

### Key computed signals

#### Project attention

A project should be flagged when:

- `last_review_date + review_cadence < today`
- or at least one linked action is overdue and incomplete

#### Person attention

A person should be flagged when:

- `last_meeting_date + meeting_cadence < today`
- or at least one assigned action is overdue

#### Communication backlog

An item is pending when:

- a person is listed in its inform set
- and there is no completed inform record for that person and item

### Suggested implementation

This layer should be implemented as:

- backend service functions
- computed queries
- database views or API aggregations

Do not store dashboard flags as permanent truth unless performance forces it later.

---

## 2. Workspace Layer

The workspace layer is where operational work happens.

This includes:

- project workspaces
- meeting workspaces
- update records
- decision records
- action records
- RAID management

This layer is the core application domain.

### Responsibilities

- create and edit records
- display full entity details
- manage relationships between entities
- provide contextual creation flows
- maintain audit-ready history

### Main workspaces

#### Project workspace

The project workspace is the most important operational screen.

It should expose:

- Overview
- RAID
- Updates
- Meetings
- People
- Actions
- Decisions

Projects should be treated as workspaces, not passive records.

#### Meeting workspace

The meeting workspace supports:

- agenda preparation
- updates to communicate
- decisions to communicate
- action capture
- note taking

#### Record modals

Updates, decisions, actions, RAID items, and people should open in full detail views.

These views should support:

- read mode
- edit mode
- contextual navigation

---

## 3. Communication Layer

This is the most distinctive part of the application.

The system must not only store updates, decisions, and actions. It must also track whether relevant people have been informed.

### Responsibilities

- define who needs to be informed
- record when a person was informed
- surface pending communication needs
- integrate with meeting workflows

### Core model

For each communication-capable item:

- Update
- Decision
- Action

The system stores:

- people who need to be informed
- inform completion records

This should be implemented using a dedicated join structure rather than embedding all state inside the item.

### Recommended structure

#### InformTarget

Defines who should be informed.

- item_type
- item_id
- person_id

#### InformRecord

Defines that informing actually happened.

- item_type
- item_id
- person_id
- informed_by
- informed_at
- meeting_id (optional)
- notes (optional)

This allows the system to answer:

- who still needs to be informed
- when was Harri told about Update X
- which meeting cleared the communication

---

## High-Level Technical Architecture

A practical implementation could use the following structure.

### Frontend

A desktop-first web client built with one of:

- React
- Next.js
- Vue

The current prototype is plain HTML and JavaScript, which is suitable for design validation, but the production system will benefit from a component-based frontend.

### Frontend responsibilities

- render dashboard
- manage tables and modals
- run progressive disclosure create flows
- support edit mode
- call backend services
- maintain transient UI state

### Recommended frontend modules

- `dashboard`
- `projects`
- `people`
- `meetings`
- `updates`
- `decisions`
- `actions`
- `raid`
- `shared/components`
- `shared/forms`

---

## Backend

The backend should expose an API for:

- CRUD operations
- relationship management
- computed attention queries
- communication queries

### Options

- Node.js with Express or Fastify
- Supabase edge functions
- Firebase functions
- Next.js API routes

### Recommended backend modules

- `projectService`
- `peopleService`
- `meetingService`
- `updateService`
- `decisionService`
- `actionService`
- `raidService`
- `attentionService`
- `communicationService`

Each service should own business rules for its entity.

---

## Database Layer

A relational database is the best fit because the domain is relationship-heavy.

Recommended choice:

- PostgreSQL

### Why relational fits

The system depends on:

- joins
- scoped relationships
- audit trails
- filtered records
- computed status queries

This is not a document-store-shaped problem. A relational schema will be much easier to reason about.

---

## Suggested Domain Structure

### Core entities

- Project
- Person
- Meeting
- Update
- Decision
- Action
- RAIDItem

### Join/supporting entities

- ProjectPersonRole
- InformTarget
- InformRecord
- ProjectReviewLog
- ActionProgressUpdate

---

## Service Boundaries

### projectService

Owns:

- project CRUD
- project review logic
- project workspace queries
- project-person role assignments

### peopleService

Owns:

- person CRUD
- cadence configuration
- people summaries
- assigned action lookups

### meetingService

Owns:

- meeting CRUD
- meeting context relationships
- meeting preparation queries
- meeting note storage

### updateService

Owns:

- update CRUD
- update log queries
- project-scoped update retrieval

### decisionService

Owns:

- decision CRUD
- rationale/impact structure
- decision log queries

### actionService

Owns:

- action CRUD
- due date/status logic
- progress updates

### raidService

Owns:

- RAID CRUD
- tab filtering logic
- type-specific field handling

### attentionService

Owns:

- dashboard calculations
- cadence breach logic
- overdue logic
- summary indicators

### communicationService

Owns:

- inform targets
- inform records
- pending communication queries
- meeting-based inform completion

---

## API Shape

The exact transport can vary, but the API should broadly support:

### Projects

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `GET /projects/:id/workspace`

### People

- `GET /people`
- `POST /people`
- `GET /people/:id`
- `PATCH /people/:id`

### Meetings

- `GET /meetings`
- `POST /meetings`
- `GET /meetings/:id`
- `PATCH /meetings/:id`

### Updates / Decisions / Actions

Standard CRUD plus inform endpoints.

Example:

- `POST /updates/:id/inform-targets`
- `POST /updates/:id/inform-records`

### Dashboard

- `GET /dashboard/attention`

### RAID

- `GET /raid?type=Risk`
- `POST /raid`
- `PATCH /raid/:id`

---

## UI State Model

The frontend will likely need three forms of state.

### 1. Server state

Fetched from the backend.

Examples:

- tables
- workspace data
- dashboard summaries

A query library such as React Query would fit well.

### 2. Modal state

Tracks:

- open modal
- selected entity
- active tab
- edit/view mode

### 3. Wizard state

Tracks progressive disclosure create flows.

Each wizard should hold:

- current step
- partial form data
- source context
- validation state

---

## Create Workflow Architecture

Creation should support both:

- global create
- contextual create

### Global create

Launched from the top navigation.

Best for:

- new projects
- new people
- orphan records

### Contextual create

Launched from:

- project workspace
- meeting workspace
- people view
- RAID view

Best for:

- project-linked records
- meeting-derived records
- communication records

### Progressive disclosure pattern

A wizard should capture:

1. core content first
2. context second
3. communication or enrichment third
4. review last

This keeps creation fast and reduces form fatigue.

---

## Edit Workflow Architecture

All major entities should support:

- view mode
- edit mode

In view mode:
- fields are displayed cleanly

In edit mode:
- relevant sections swap to form controls

This approach avoids clutter and preserves readability.

Avoid full inline-edit tables across the whole product. That usually turns into hostile spreadsheet cosplay.

---

## Audit and History

The app should preserve operational history wherever possible.

Recommended historical models:

### ProjectReviewLog

Rather than overwriting a single last review date, store review events.

Fields:

- project_id
- review_date
- reviewer_id
- notes
- outcome

### ActionProgressUpdate

Rather than storing a single summary, store progress entries.

Fields:

- action_id
- date_logged
- text
- created_by

### InformRecord

Do not collapse communication into a boolean. Preserve the event.

---

## Security and Access Model

Even if the first implementation is single-user, the architecture should anticipate role-based access later.

Potential future roles:

- Admin
- Programme Manager
- Contributor
- Read-only

Permissions may later control:

- editing projects
- editing decisions
- closing actions
- viewing reports

For now, keep the model simple, but do not hard-code assumptions that make multi-user support impossible.

---

## Reporting Architecture

Reports should be derived from operational data, not treated as a separate truth layer.

Future report types may include:

- attention summary
- communication backlog
- governance pack
- project health summary
- overdue action report

The reporting layer should read from:

- workspace entities
- attention service
- communication service

---

## Recommended Initial Build Order

1. data schema
2. project CRUD
3. project workspace
4. update/decision/action CRUD
5. communication tracking
6. meeting workspace
7. attention dashboard
8. reports

This order keeps the real operational core intact before layering on summaries.

---

## Architectural Principle

The key architectural principle is simple:

**Store operational truth once, derive leadership insight from it.**

The system should not become a decorative dashboard generator.
It should remain a reliable operational memory for programme leadership work.
