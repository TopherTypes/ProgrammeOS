# Programme Work Management App

Current version: **0.0.4**

A local-first, zero-build programme management application designed to run directly in the browser and be deployable on GitHub Pages.

## Repository Structure (Milestone 0 / Task 0.1)

```text
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
/js/features/focus/
/docs/
```

## Local Run

Open `index.html` directly in a browser.


## Routing (Milestone 0 / Task 0.2)

The app now uses a hash-based router with the following routes:

- `#/dashboard`
- `#/projects`
- `#/people`
- `#/meetings`
- `#/focus`

Navigation updates page content without full-page reloads and supports browser back/forward navigation.


## Layout Framework (Milestone 0 / Task 0.3)

The app now renders all routes inside a shared layout shell:

- Persistent sidebar navigation
- Main content container used by every route
- Dedicated optional detail panel container in the base shell
- Reusable page frame helper to avoid duplicated page layout logic
