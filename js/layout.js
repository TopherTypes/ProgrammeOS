/**
 * Creates and mounts the global application shell.
 *
 * The shell owns cross-route layout primitives so route modules only supply
 * page content and do not duplicate frame markup.
 *
 * @param {HTMLElement} mountNode
 * @returns {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }}
 */
export function createLayout(mountNode) {
  mountNode.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <h1>Programme OS</h1>
        <p class="small-note sidebar-note">Milestone 0 foundation scaffold</p>
        <nav class="sidebar-nav" aria-label="Primary navigation">
          <a href="#/dashboard">Dashboard</a>
          <a href="#/projects">Projects</a>
          <a href="#/people">People</a>
          <a href="#/meetings">Meetings</a>
          <a href="#/focus">Focus</a>
        </nav>
      </aside>

      <section class="content-layout" aria-label="Page content layout">
        <main class="content-main" id="content-outlet"></main>
        <aside class="content-detail" id="detail-outlet" hidden></aside>
      </section>
    </div>
  `;

  const mainOutlet = mountNode.querySelector("#content-outlet");
  const detailOutlet = mountNode.querySelector("#detail-outlet");

  if (!mainOutlet || !detailOutlet) {
    throw new Error("Layout outlets were not created by layout template.");
  }

  return { mainOutlet, detailOutlet };
}

/**
 * Renders a page using the shared shell structure.
 *
 * @param {{ mainOutlet: HTMLElement, detailOutlet: HTMLElement }} outlets
 * @param {{ title: string, bodyHtml: string, detailHtml?: string }} config
 */
export function renderPageFrame(outlets, config) {
  outlets.mainOutlet.innerHTML = `
    <section class="page-frame" aria-label="${config.title} page">
      <header class="page-header">
        <h2 class="page-title">${config.title}</h2>
      </header>
      <section class="page-main-panel">${config.bodyHtml}</section>
    </section>
  `;

  if (config.detailHtml) {
    outlets.detailOutlet.hidden = false;
    outlets.detailOutlet.innerHTML = `
      <section class="page-detail-panel" aria-label="${config.title} details">
        ${config.detailHtml}
      </section>
    `;
    return;
  }

  outlets.detailOutlet.hidden = true;
  outlets.detailOutlet.innerHTML = "";
}

/**
 * Renders a consistent page frame inside the main content area.
 *
 * All route modules use this helper so page-level layout is defined in one place
 * rather than duplicated across feature files.
 *
 * @param {HTMLElement} container
 * @param {{ title: string, bodyHtml: string, detailHtml?: string }} config
 */
export function renderPageFrame(container, config) {
  const detailPanelMarkup = config.detailHtml
    ? `<aside class="page-detail-panel">${config.detailHtml}</aside>`
    : "";

  container.innerHTML = `
    <section class="page-frame" aria-label="${config.title} page">
      <header class="page-header">
        <h2 class="page-title">${config.title}</h2>
      </header>
      <div class="page-body-grid">
        <div class="page-main-panel">${config.bodyHtml}</div>
        ${detailPanelMarkup}
      </div>
    </section>
  `;
}
