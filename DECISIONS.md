# DECISIONS.md
Programme Work Management App

## 1. Overall Approach

### 1.1 Zero-build, GitHub Pages-first
- The app must run directly from GitHub Pages with no build step.
- Source files are plain HTML/CSS/JS.
- No compilation, bundling, or server is required for development or deployment.

### 1.2 Local-first as the default operating mode
- All functionality must work offline.
- Local persistence is the primary storage mechanism.
- External integrations are optional enhancements, not dependencies.

### 1.3 No server and no account auth
- The app must never require a custom backend server.
- The app must never require user accounts or authentication systems.
- The only permitted external auth is optional Google Drive syncing.

---

## 2. Tech Stack Decisions

### 2.1 Framework choice
- No frontend framework (React/Vue/etc.) for MVP.
- Use lightweight, modular vanilla JavaScript.

Rationale:
- Keeps GitHub Pages deployment trivial.
- Keeps debugging simple.
- Minimises toolchain friction.

### 2.2 Dependencies (general rule)
- Prefer minimal dependencies unless a dependency clearly reduces complexity.
- Any dependency must be:
  - CDN-loadable (no bundler required)
  - small and stable
  - optional where possible

### 2.3 Formatting / consistency
- Use Prettier for consistent formatting.
- Prettier is the only required code-style tool in MVP.

---

## 3. Data Storage and Persistence

### 3.1 Primary storage: IndexedDB (via helper library)
- Use **IndexedDB** as the primary data store.
- Use a small helper library to reduce boilerplate and provide a Promise-based API.

Selected helper library:
- **idb@8.0.3** (Promise-based IndexedDB wrapper), imported from jsDelivr ESM CDN and pinned to an explicit version in `js/db.js`.

Rationale:
- Asynchronous storage avoids UI jank as the dataset grows.
- Better longevity for a programme management tool (many entities, many links).
- IndexedDB supports future indexing/query patterns without re-architecture.

### 3.2 Logical “single database” concept
Even though runtime storage is IndexedDB, the app maintains a single logical database concept:
- Entity data is stored in separate object stores (e.g., `people`, `projects`, `meetings`, `actions`, `decisions`, `updates`).
- Metadata is stored separately (e.g., `meta` store or a single meta record).

### 3.3 Schema versioning and migrations
- Migration planning is implemented as explicit, version-keyed handlers in `js/db-schema.js`, executed sequentially for each pending version during IndexedDB upgrades.
- The database must include a `schemaVersion` integer.
- Any future schema change must include a migration path.
- Migrations apply:
  - on app startup (when upgrading stored data), and/or
  - during import (when importing older exports).

Rationale:
- Prevents breaking saved data across app updates.
- Enables predictable evolution as features expand.

### 3.4 Import/export strategy: single JSON snapshot
- Export: produce a **single JSON file** representing the entire database snapshot:
  - `{ schemaVersion, exportedAt, data: { people: [...], projects: [...], meetings: [...], actions: [...], decisions: [...], updates: [...] } }`
- Import: validate the snapshot, then load it into IndexedDB (replacing current state or via a controlled restore flow).

Validation must include:
- presence of `schemaVersion`
- presence of expected collections
- basic shape checks (arrays, required fields, etc.)

Rationale:
- Human-auditable backups.
- Easy manual backup/restore.
- Aligns with future Google Drive sync (sync one file, not many).

### 3.5 IDs
- Use UUIDs as internal IDs for all entities.
- IDs must not be shown as primary UI identifiers.
- UI must remain fully human readable (titles, names, dates, statuses).

---

## 4. Entity Relationship Model

### 4.1 Linking philosophy: single-source links + computed reverse links
- Entities store links where they are naturally “owned”:
  - `meeting.attendeeIds[]`
  - `meeting.projectIds[]` (optional)
  - `action.meetingId` (optional)
  - `action.projectIds[]` (optional)
  - `action.ownerPersonId` (optional)
  - `decision.meetingId` (optional)
  - `update.meetingId` (optional)
- Reverse relationships (e.g., “meetings for person X”) are computed at runtime via indexing.

Rationale:
- Avoids denormalisation bugs (two-way links getting out of sync).
- Keeps writes simple and reliable.
- Enables fast navigation by building in-memory indexes.

### 4.2 Orphans are first-class
- Every entity must be creatable without links.
- Linking is additive and can happen later without special workflows.

---

## 5. Communication Tracking Model (“Requires update”)

### 5.1 Data structure: map on each item
Actions, decisions, and updates store per-person update requirements as a map, e.g.:

- `requiresUpdateByPersonId: { [personId]: { required: true, informedAt: string|null } }`

Rules:
- Multiple people can be marked as requiring update for any item.
- Each person is tracked independently with their own informed status.
- The UI must be able to display:
  - total requiring update
  - total pending
  - list of required people
  - list of outstanding people

Rationale:
- Keeps communication tracking close to the items it belongs to.
- Simple local-first representation.
- Can be migrated later to a separate communications table if needed.

---

## 6. Navigation and Routing

### 6.1 Routing approach
- Use hash-based routing:
  - `#/dashboard`
  - `#/projects`
  - `#/projects/:id`
  - `#/people`
  - `#/people/:id`
  - `#/meetings`
  - `#/meetings/:id`
  - `#/focus`
- Routing must support deep links and browser navigation (back/forward).

Rationale:
- Clear page structure without a framework.
- Supports direct navigation to a specific entity.

---

## 7. UI Layout and Interaction Patterns

### 7.1 Layout approach
- Use a mix of:
  - Dashboard overview page
  - Entity list pages with a two-column layout (list + detail)

### 7.2 Editing approach
- Full create/edit flows use modals (form-driven).
- Quick edits use inline controls where appropriate:
  - status
  - archive/unarchive
  - small boolean toggles

### 7.3 Fast data entry
- Meeting workflows must support keyboard-efficient entry where possible.
- People selection should support an autocomplete / pill-style multi-select component for:
  - meeting attendees
  - “requires update” lists

---

## 8. MVP “In Focus” Behaviour

- Use fixed defaults for MVP (non-configurable).
- Focus priorities:
  - actions due soon
  - recently created meeting outputs
  - items with outstanding “requires update” counts

---

## 9. Offline / PWA

- Do not include a Service Worker in MVP.
- Offline capability is achieved via local-first storage and static assets.

Rationale:
- Reduces complexity and caching pitfalls early on.
- Can be added later once core behaviour stabilises.

---

## 10. Testing and Quality Gates

### 10.1 Testing level
- MVP uses minimal smoke tests defined as a repeatable manual checklist.

Minimum smoke checklist:
- Create person/project/meeting
- Add attendees via multi-select
- Create action/decision/update from a meeting
- Mark requires update + mark informed per person
- Export JSON snapshot
- Import JSON snapshot
- Verify state is restored and links remain navigable

### 10.2 Continuous cleanliness
- Prettier formatting is required.
- Avoid introducing tooling beyond what is necessary for MVP.

---

## 11. Google Drive Sync Boundary

### 11.1 MVP approach: stub integration
- Include a “Google Drive Sync” stub interface:
  - UI placeholder entry point
  - empty implementation or mocked behaviour
  - clear TODO markers
- Architecture must assume future sync writes/reads a single JSON snapshot file.

Rationale:
- Prevents data model choices that block future sync.
- Avoids shipping half-baked auth/sync logic prematurely.

---

## 12. Non-constraints

No additional hard constraints beyond:
- no server
- no non-Google account auth

---

## 13. Repository Module Structure Baseline

- Keep a single HTML entrypoint (`index.html`).
- Keep styles under `css/`.
- Keep JavaScript split by responsibility under `js/`:
  - `app.js` for startup orchestration
  - `router.js` for route matching and navigation hooks
  - `layout.js` for global shell rendering
  - `db.js` for storage-layer access
  - `features/` for domain modules
  - `ui/` for shared UI helpers/components

Rationale:
- Creates stable import paths early.
- Keeps future milestones incremental and modular.
- Preserves zero-build simplicity for GitHub Pages.

### 13.1 Feature-owned data wrappers
- Domain features may define focused data-access modules under `js/features/<domain>/` that wrap `db.js` generic CRUD helpers.
- These wrappers own entity-specific validation, immutable field protection, and normalization before data reaches UI routes.
- The people feature now follows this pattern via `js/features/people/data.js` and `js/features/people/person-record.js`.

Rationale:
- Keeps `db.js` generic and reusable while keeping business rules close to each domain.
- Improves consistency for future UI rendering by enforcing a normalized entity shape.

