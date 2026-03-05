import { initializeDatabase } from "./db.js";
import { createLayout } from "./layout.js";
import { createRouter } from "./router.js";

/**
 * Bootstraps the app shell, IndexedDB, and route handling.
 * This function is intentionally small so startup logic remains easy to inspect.
 */
async function bootstrap() {
  const appRoot = document.querySelector("#app");

  if (!appRoot) {
    throw new Error("App root element '#app' was not found.");
  }

  await initializeDatabase();

  const outlets = createLayout(appRoot);
  const router = createRouter(outlets);

  router.start();
}

bootstrap();
