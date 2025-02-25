// src/game_engine/eventBus.ts
import { EventEmitter } from 'events';

// Create a single instance of the event bus
export const combatEventBus = new EventEmitter();
