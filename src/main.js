/** Application bootstrap: wires delegated interactions once, then runs the initial render cycle. */
import { wireInteractions } from './events/wireInteractions.js';
import { render } from './render/index.js';

wireInteractions();
render();
