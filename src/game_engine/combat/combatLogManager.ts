/**
 * LogManager
 * 
 * PURPOSE:
 * Centralizes log generation and event emission for the combat system.
 * Ensures that logs are properly populated before events are emitted.
 */

import { CombatEvent, EventType, PhaseChangeSubtype } from '../../events/eventTypes';
import { CombatLogFormatters, FormatMode } from './combatLogFormatters';
import { LLMLogFormatters } from '../llmLogFormatters';
import { generateInitialNarration, generateRoundNarration, generateAfterMathNarration } from './combatNarration';
import { CombatState } from '../../types/combatState';

/**
 * Populates the combat logs with formatted event information
 * @param event The game event to log
 * @param state The current game state
 * @returns A Promise that resolves when all narrations have been generated and added to logs
 */
export async function populateCombatLogs(event: CombatEvent, state: CombatState): Promise<void> {
  const narrationEnabled = state.settings.narrationEnabled;

  // Get the current round log
  const currentRoundIndex = state.round;
  let roundLog = state.combatLog[currentRoundIndex];

  if (!roundLog) {
    // Create a new round log if it doesn't exist
    roundLog = {
      events: [],
      debugLog: [],
      llmContextLog: [],
      llmNarrations: [],
      round: currentRoundIndex
    };
    state.combatLog[currentRoundIndex] = roundLog;
  }
  
  // Add the event to the events array
  roundLog.events.push(event);
  
  // Generate and add debug log
  CombatLogFormatters.setMode(FormatMode.DEBUG);
  const debugLog = CombatLogFormatters.formatEvent(event);
  roundLog.debugLog.push(debugLog);
  
  // Generate and add LLM context log
  const llmContextLog = LLMLogFormatters.formatEvent(event);
  if (llmContextLog) {
    roundLog.llmContextLog.push(llmContextLog);
  }
  
  // Check if we should generate a narration for this event
  if (!narrationEnabled) {
    return;
  }

  // Only handle PHASECHANGE events for narration
  if (event.type === EventType.PHASECHANGE) {
    try {
      switch (event.subtype) {
        case PhaseChangeSubtype.START:
          const narration = await generateInitialNarration(state);
          if (narration) roundLog.llmNarrations.push(narration);
          break;
        case PhaseChangeSubtype.ROUND_END:
          const roundNarration = await generateRoundNarration(state);
          if (roundNarration) roundLog.llmNarrations.push(roundNarration);
          break;
        case PhaseChangeSubtype.END:
          const aftermathNarration = await generateAfterMathNarration(state);
          if (aftermathNarration) roundLog.llmNarrations.push(aftermathNarration);
          break;
      }
    } catch (error) {
      console.error(`Failed to generate narration for ${event.subtype}:`, error);
    }
  }
}

/**
 * Logs an event and emits it to both the combat event bus and UI event bus
 * @param event The game event to emit
 * @param state The current game state
 */ 
export async function logAndEmitCombatEvent(event: CombatEvent, state: CombatState): Promise<void> {
  // Populate logs and wait for narrations to be generated
  await populateCombatLogs(event, state);
  // for now, dont add to an event queue - no need to
}
