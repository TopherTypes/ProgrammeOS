# AGENTS.md
Operational Rules for AI Contributors

This repository is designed to be developed collaboratively with AI coding agents (e.g., Codex).
This document defines the rules that all agents must follow when modifying the codebase.

Agents must treat `SPEC.md` and `DECISIONS.md` as authoritative project documents.

---

# 1. Source of Truth

The following documents define the project:

| Document | Purpose |
|--------|--------|
| SPEC.md | Defines application behaviour and feature requirements |
| DECISIONS.md | Defines architecture, storage model, and technical decisions |
| AGENTS.md | Defines how AI agents must operate in this repository |

If code conflicts with these documents, the documents take precedence unless explicitly updated.

Agents must update the documents if behaviour or architecture changes.

---

# 2. Development Principles

Agents must prioritise:

- clarity
- maintainability
- predictable behaviour
- minimal complexity

The application is a **local-first browser application** designed to run on **GitHub Pages with zero build step**.

Agents must not introduce tooling or infrastructure that violates these principles.

---

# 3. Dependency Policy

Agents may introduce dependencies **only if they clearly simplify implementation**.

Dependencies must:

- be loadable via CDN
- not require a build step
- be small and well-maintained

When introducing a dependency, the agent must:

1. justify the dependency in the task explanation
2. update `DECISIONS.md` with the new dependency
3. pin the dependency to a specific version

---

# 4. Refactoring Rules

Agents may refactor existing code when appropriate.

However:

- refactors must not change user workflows or UX behaviour
- refactors must not introduce regressions
- refactors must be clearly described in commit messages

If a refactor alters behaviour or architecture, `SPEC.md` or `DECISIONS.md` must be updated accordingly.

---

# 5. Branching and Commits

Agents must follow a disciplined commit workflow.

### Commit structure

- Each **task** should produce **one commit**.
- Milestones should consist of **multiple small commits**.

### Commit message format

Follow conventional commit style where possible:

```
feat: add meeting update tracking
fix: correct action owner linking
refactor: simplify meeting creation flow
chore: update dependencies
```


Commits must be descriptive and explain intent.

---

# 6. Changelog and Versioning

The repository must maintain a `CHANGELOG.md`.

Agents must follow **Keep a Changelog** practices and **Semantic Versioning**.

Whenever functionality changes, agents must:

1. update `CHANGELOG.md`
2. update the project version number
3. categorise changes under:

- Added
- Changed
- Fixed
- Removed

---

# 7. Documentation Synchronisation

Agents must keep documentation aligned with the code.

### Update `SPEC.md` when

- application behaviour changes
- new features are added
- workflows change

### Update `DECISIONS.md` when

- architecture changes
- storage approaches change
- new libraries are introduced
- major design decisions are made

Documentation must not become stale.

---

# 8. File and Project Structure

Agents may create new files as necessary.

However:

- files must be placed logically within the existing project structure
- unnecessary file proliferation should be avoided
- code should remain modular and readable

When adding major structural changes, update `DECISIONS.md`.

---

# 9. UI and Interaction Guidelines

The UI must follow these principles:

- dense but readable layouts
- avoid unnecessary whitespace bloat
- responsive and reactive controls
- subtle animations are encouraged
- interactions should feel smooth and fast

Mobile support is **not required for MVP**.

Keyboard efficiency should be prioritised where it improves workflow, particularly for meeting capture.

---

# 10. Testing and Verification

Each task must include verification steps.

Agents must provide:

### Manual verification steps

Clear instructions for testing the change.

### Smoke checklist

Ensure the following still function:

- entity creation (people/projects/meetings)
- meeting logging
- action/decision/update creation
- communication tracking
- JSON export/import

### Automated checks

Where feasible, agents should introduce lightweight automated checks for:

- data integrity
- pure logic functions
- schema validation

Agents must not introduce heavy testing frameworks that require build tooling.

---

# 11. Safe Changes

Agents must avoid:

- breaking stored user data
- introducing migration-breaking schema changes
- silently altering workflows

When schema changes occur, migration logic must be implemented.

---

# 12. Google Drive Integration Boundary

Google Drive sync is **not implemented in MVP**.

Agents may implement:

- interface placeholders
- architectural preparation

Agents must not implement full Google Drive authentication or syncing logic unless explicitly requested.

---

# 13. Task Execution Workflow

When performing work in this repository, agents should follow this order:

1. Understand the relevant section of `SPEC.md`
2. Check `DECISIONS.md` for architectural constraints
3. Implement the change
4. Verify behaviour
5. Update documentation
6. Update `CHANGELOG.md`
7. Commit changes with clear messages