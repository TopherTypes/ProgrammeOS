import { createLayout } from "./layout.js";
import { createRouter } from "./router.js";

/**
 * Bootstraps the app shell and route handling.
 * This function is intentionally small so startup logic remains easy to inspect.
 */
function bootstrap() {
  const appRoot = document.querySelector("#app");

  if (!appRoot) {
    throw new Error("App root element '#app' was not found.");
  }

  const { contentOutlet } = createLayout(appRoot);
  const router = createRouter(contentOutlet);

  router.start();
}

bootstrap();
