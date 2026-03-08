# Changelog

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
