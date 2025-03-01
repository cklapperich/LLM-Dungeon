Implementation Strategy: Sequential Event Processing with UI Event Bus
Overview
We'll implement a two-part event system:

A custom sequential event handler for the game engine
A mitt-based event bus for the UI
Files to Modify/Create
Create: src/game_engine/sequentialEventHandler.ts

Implements a promise-based sequential event processing system
Replaces the functionality of the current mitt-based event bus
Modify: src/game_engine/eventBus.ts

Add a new UI-specific mitt event bus
Keep the existing combatEventBus for backward compatibility
Modify: src/game_engine/combatEngine.ts

Update event emission to use the sequential handler
Push processed (event, state) pairs to the UI event bus
Modify: src/game_engine/llm.ts

Update to return promises instead of using callbacks
Ensure narration generation is properly awaited
Modify: src/main.tsx

Update to listen to the UI event bus
Handle event-state pairs for UI updates
Technical Implementation Details
1. Sequential Event Handler
// src/game_engine/sequentialEventHandler.ts
import { GameEvent } from './events/eventTypes';
import { GameState } from '../types/gamestate';

type EventHandler = (event: GameEvent, state: GameState) => Promise<void>;

export class SequentialEventHandler {
  private handlers: Record<string, EventHandler[]> = {};
  
  // Register a handler for an event type
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }
  
  // Remove a handler
  off(eventType: string, handler: EventHandler): void {
    if (this.handlers[eventType]) {
      this.handlers[eventType] = this.handlers[eventType].filter(h => h !== handler);
    }
  }
  
  // Emit an event and wait for all handlers to complete
  async emit(eventType: string, event: GameEvent, state: GameState): Promise<void> {
    const handlers = this.handlers[eventType] || [];
    
    // Execute all handlers sequentially
    for (const handler of handlers) {
      await handler(event, state);
    }
  }
}
2. UI Event Bus
// Update to src/game_engine/eventBus.ts
import mitt from 'mitt';
import { GameEvent } from './events/eventTypes';
import { CombatState } from '../types/combatState';

// Keep existing event bus for backward compatibility
export const combatEventBus = mitt();

// Create UI-specific event bus
export const uiEventBus = mitt<{
  'ui:NEW_EVENT_STATE': { event: GameEvent, state: CombatState };
  'ui:EXECUTION_COMPLETE': { success: boolean, state: GameState, message?: string };
}>();
3. Integration in Combat Engine
The key changes to combatEngine.ts would involve:

Creating an instance of the sequential event handler
Modifying functions like executeTrait and executeCombatRound to:
Use the sequential handler instead of the mitt event bus
Wait for all processing to complete
Push the resulting (event, state) pair to the UI event bus
For example, in executeTrait:

// Instead of:
combatEventBus.emit(`${eventContext}:${abilityEvent.type}`, abilityEvent);

// We would do:
await sequentialEventHandler.emit(`${eventContext}:${abilityEvent.type}`, abilityEvent, gameState);

// And then push to UI event bus:
uiEventBus.emit('ui:NEW_EVENT_STATE', { 
  event: abilityEvent, 
  state: gameState.activeCombat 
});
4. LLM Integration
The llm.ts file would need to be updated to return promises:

// Instead of callback-based:
export function callLLM(type: string, prompts: string[]): string {
  // ...
}

// Use promise-based:
export async function callLLM(type: string, prompts: string[]): Promise<string> {
  // ...
  return result;
}
5. UI Integration
In main.tsx, we'd update the UI to listen for event-state pairs:

useEffect(() => {
  const handleNewEventState = (data: { event: GameEvent, state: CombatState }) => {
    // Update UI with event and state
    // Could add animation here
  };
  
  uiEventBus.on('ui:NEW_EVENT_STATE', handleNewEventState);
  
  return () => {
    uiEventBus.off('ui:NEW_EVENT_STATE', handleNewEventState);
  };
}, []);
Implementation Flow
Create the sequential event handler
Add the UI event bus
Update the combat engine to use both systems
Modify LLM functions to return promises
Update the UI to listen for event-state pairs
This approach ensures that:

Events are processed sequentially and synchronously
All async operations (like LLM narration) complete before the next event
The UI receives fully processed (event, state) pairs
The UI can animate or display events at its own pace