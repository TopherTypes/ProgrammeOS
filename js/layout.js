/**
 * Creates and mounts the application shell.
 * @param {HTMLElement} mountNode
 * @returns {{ contentOutlet: HTMLElement }}
 */
export function createLayout(mountNode) {
  mountNode.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <h1>Programme OS</h1>
        <p class="small-note">Milestone 0 foundation scaffold</p>
      </aside>
      <main class="content" id="content-outlet"></main>
    </div>
  `;

  const contentOutlet = mountNode.querySelector("#content-outlet");

  if (!contentOutlet) {
    throw new Error("Content outlet was not created by layout template.");
  }

  return { contentOutlet };
}
