# Game Animation System Implementation

## Overview

This document outlines a solution for decoupling game state generation from UI animation timing in a turn-based game. The approach allows the game engine to process state changes at full speed (including potentially slow LLM calls) while giving the UI full control over how and when to display these changes to the player.

## Rationale

In video games, especially turn-based games with narrative elements, it's important to control the pacing of information presented to the player. Even though the game engine might calculate all outcomes of an action immediately, showing these all at once would overwhelm the player and diminish the experience.

The solution:
1. Allow the game engine to run at full speed
2. Capture events as they're generated
3. Queue events for display with appropriate timing
4. Play through events sequentially with animation delays

This creates a better player experience while maintaining a clean separation between game logic and presentation.

## Implementation

### 1. LogManager with Event System

```typescript
/**
 * LogManager
 * 
 * Centralizes log generation and event emission for the game system.
 * Adds event listeners to enable UI animation queuing.
 */

import { GameEvent } from '../types/eventTypes';
import { GameState } from '../types/gameState';

// Define the event listener type
export type GameEventListener = (
  event: GameEvent, 
  logEntry: string, 
  state: GameState
) => void;

// Store for event listeners
const eventListeners: GameEventListener[] = [];

/**
 * Add a listener for game events
 * @param listener Function to call when events occur
 * @returns Function that removes this listener when called
 */
export function addGameEventListener(listener: GameEventListener): () => void {
  eventListeners.push(listener);
  return () => {
    const index = eventListeners.indexOf(listener);
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners about a game event
 * @param event The game event that occurred
 * @param logEntry Formatted log entry for this event
 * @param state Current game state
 */
function notifyEventListeners(event: GameEvent, logEntry: string, state: GameState): void {
  // Create a deep copy of state to capture this moment in time
  const stateCopy = JSON.parse(JSON.stringify(state));
  
  // Notify all listeners
  eventListeners.forEach(listener => {
    listener(event, logEntry, stateCopy);
  });
}

/**
 * Process a game event and update logs
 * @param event The game event to process
 * @param state Current game state
 * @returns Formatted log entry for this event
 */
export function processGameEvent(event: GameEvent, state: GameState): string {
  // Add event to game logs
  if (!state.logs) {
    state.logs = [];
  }
  
  // Generate log entry (text description of what happened)
  const logEntry = formatEventToLogEntry(event);
  
  // Add to game logs
  state.logs.push(logEntry);
  
  return logEntry;
}

/**
 * Format an event into a readable log entry
 * This would be expanded based on your game's event types
 */
function formatEventToLogEntry(event: GameEvent): string {
  // Implementation depends on your game's event types
  switch (event.type) {
    case 'ATTACK':
      return `${event.source} attacks ${event.target} for ${event.damage} damage!`;
    case 'DIALOG':
      return event.text;
    case 'STATUS_EFFECT':
      return `${event.target} is affected by ${event.effect}!`;
    default:
      return `Event: ${event.type}`;
  }
}

/**
 * Log an event and notify listeners
 * @param event The game event to log
 * @param state Current game state
 */
export function logAndEmitGameEvent(event: GameEvent, state: GameState): void {
  // Process event and get log entry
  const logEntry = processGameEvent(event, state);
  
  // Notify listeners
  notifyEventListeners(event, logEntry, state);
}
```

### 2. Game Component with Animation System

```typescript
import React, { useState, useRef, useEffect } from 'react';
import * as gameEngine from './gameEngine';
import { addGameEventListener } from './logManager';
import { GameState, GameEvent, UIAction } from './types';

function Game({ initialState }) {
  // Current state shown to the player
  const [displayState, setDisplayState] = useState(initialState);
  // Latest complete state from the game engine
  const latestState = useRef(initialState);
  // Queue of events to be animated
  const eventQueue = useRef([]);
  // Status flags
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Set up event listener when component mounts
  useEffect(() => {
    // Listen for game events
    const removeListener = addGameEventListener((event, logEntry, state) => {
      // Add to animation queue
      eventQueue.current.push({ event, logEntry, state });
      
      // Update latest state reference
      latestState.current = state;
      
      // Start animation if not already running
      if (!isAnimating) {
        setIsAnimating(true);
        animateNextEvent();
      }
    });
    
    return removeListener; // Clean up on unmount
  }, [isAnimating]);
  
  // Process the next event in the queue
  function animateNextEvent() {
    if (eventQueue.current.length === 0) {
      setIsAnimating(false);
      
      // Ensure we're showing the latest state when done animating
      if (displayState !== latestState.current) {
        setDisplayState(latestState.current);
      }
      return;
    }
    
    const { event, logEntry, state } = eventQueue.current.shift();
    
    // Update display state
    setDisplayState(prevState => {
      // Create a new state object with the updated logs
      const newState = {...prevState};
      
      // Add the new log entry
      if (!newState.logs) newState.logs = [];
      newState.logs.push(logEntry);
      
      // Update other state fields based on event type
      // This depends on your game's specific state structure
      
      return newState;
    });
    
    // Determine animation time based on event type
    let delay = 500; // default delay
    
    switch (event.type) {
      case 'ATTACK':
        delay = 1000; // Longer for attacks
        break;
      case 'DIALOG':
        // For dialog, base delay on text length
        delay = Math.max(1000, event.text.length * 30);
        break;
      case 'STATUS_EFFECT':
        delay = 800;
        break;
      case 'LLM_RESPONSE':
        // Give players more time to read LLM responses
        const wordCount = logEntry.split(' ').length;
        delay = Math.max(2000, wordCount * 200); // ~300ms per word
        break;
      default:
        delay = 500;
    }
    
    // Schedule the next animation
    setTimeout(animateNextEvent, delay);
  }
  
  // Handle player selecting an action
  async function handleAction(action) {
    try {
      setIsProcessing(true);
      
      // Execute the action - this will trigger game events
      // which will be caught by our listener and queued
      await gameEngine.executeUIAction(action, latestState.current);
      
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      console.error("Error executing action:", error);
    }
  }
  
  return (
    <div className="game">
      {/* Game display based on current display state */}
      <GameDisplay state={displayState} />
      
      {/* Log display */}
      <LogDisplay logs={displayState.logs || []} />
      
      {/* Status indicator during processing */}
      {isProcessing && <div className="status-indicator">Processing...</div>}
      
      {/* Action buttons */}
      <ActionButtons 
        actions={gameEngine.availableActions(displayState)}
        onSelectAction={handleAction}
        disabled={isProcessing || isAnimating}
      />
    </div>
  );
}

// Example sub-components
function GameDisplay({ state }) {
  // Render game view based on state
  return <div className="game-display">{/* Game visualization */}</div>;
}

function LogDisplay({ logs }) {
  return (
    <div className="log-display">
      {logs.map((log, index) => (
        <div key={index} className="log-entry">{log}</div>
      ))}
    </div>
  );
}

function ActionButtons({ actions, onSelectAction, disabled }) {
  return (
    <div className="action-buttons">
      {actions.map(action => (
        <button 
          key={action.id}
          onClick={() => onSelectAction(action)}
          disabled={disabled}
        >
          {action.name}
        </button>
      ))}
    </div>
  );
}

export default Game;
```

## Key Design Elements

1. **Event Capture System**
   - The `addGameEventListener` function allows components to subscribe to game events
   - Events are captured as they occur, regardless of how fast they're generated

2. **Animation Queue**
   - Events are added to a queue rather than being displayed immediately
   - Each event has a custom display duration based on its type and content

3. **State Management**
   - We maintain both a "display state" (what the player currently sees) and a "latest state" (what the game engine has calculated)
   - The UI gradually updates to match the latest state as animations play out

4. **Action Processing**
   - When a player takes an action, we await the game engine's processing
   - During this time, events are captured and queued
   - The UI continues to animate even during long-running operations (like LLM calls)

5. **Clean Separation**
   - Game logic remains independent of UI concerns
   - The UI controls animation timing without affecting game state calculation

## Integration with LLM Calls

When the game engine makes an LLM call:
1. The UI thread remains responsive because the call happens asynchronously
2. The "Processing..." indicator shows that something is happening
3. When the LLM responds, the resulting events are added to the queue
4. These events are displayed with appropriate timing, just like any other event

This approach ensures players have enough time to process narrative elements even when the game engine generates them rapidly.