// src/game_engine/eventBus.ts
import mitt from 'mitt';

// Create a single instance of the event bus
export const combatEventBus = mitt();
