// /server/events.js
// Singleton in-process event bus.
// Import this wherever you need to emit or subscribe to CRM events.
import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(0); // one listener per open SSE connection — no cap needed
export default bus;
