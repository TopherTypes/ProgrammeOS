# Data Structure

## Project

Fields:

-   id
-   name
-   description
-   owner
-   status
-   stage
-   health
-   start_date
-   target_date
-   review_cadence
-   last_review_date

Relationships:

Project - RAID items - Updates - Decisions - Actions - Meetings - People
(roles)

## Person

-   id
-   name
-   title
-   email
-   meeting_cadence
-   last_meeting_date

## ProjectPersonRole

-   id
-   project_id
-   person_id
-   role

Roles:

-   Owner
-   SME
-   Approver
-   Other

## Meeting

-   id
-   title
-   date
-   context_type
-   context_id
-   attendees
-   notes

Context types:

-   Project
-   Person
-   Programme

## Update

-   id
-   text
-   date_logged
-   created_by
-   project_id
-   meeting_id

## Decision

-   id
-   decision_text
-   rationale
-   impact
-   date_logged
-   project_id
-   meeting_id

## Action

-   id
-   title
-   owner_id
-   due_date
-   status
-   project_id
-   meeting_id

## RAIDItem

-   id
-   type
-   title
-   description
-   severity
-   mitigation
-   owner_id
-   project_id
-   meeting_id
-   status
-   date_logged
-   last_updated

Types:

-   Risk
-   Action
-   Issue
-   Decision

## InformRecord

Tracks communication.

Fields:

-   id
-   item_type
-   item_id
-   person_id
-   informed
-   informed_date

Item types:

-   Update
-   Decision
-   Action
