/** Application bootstrap: wires delegated interactions once, hydrates data, then runs the initial render cycle. */
import { repository } from './data/repository.js';
import { wireInteractions } from './events/wireInteractions.js';
import { render } from './render/index.js';
import { setAppData } from './state/store.js';

async function boot() {
  wireInteractions();
  const appData = await repository.initialize();
  setAppData(appData);
  render();
}

boot();
