/**
 * LogManager
 * 
 * PURPOSE:
 * Centralizes log generation and event emission for the combat system.
 * Ensures that logs are properly populated before events are emitted.
 * Handles passive ability triggering based on emitted events.
 */

import { CombatEvent, EventType, PhaseChangeSubtype } from '../../events/eventTypes';
import { CombatLogFormatters, FormatMode } from './combatLogFormatters';
import { LLMLogFormatters } from '../llmLogFormatters';
import { generateInitialNarration, generateRoundNarration, generateAfterMathNarration, annotateNarration } from './combatNarration';
import { CombatState } from '../../types/combatState';
import { executePassiveAbilities } from './traitExecutor';

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
      llmContextLog: [], // Keep for backward compatibility if needed
      llmNarrations: [],
      prompts: [],
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
  
  // Check if this is an event that should trigger narration
  if (narrationEnabled && event.type === EventType.PHASECHANGE) {
    try {
      switch (event.subtype) {
        case PhaseChangeSubtype.START:
          // For combat start, use the dedicated combat start formatter
          const structuredStartLogs = LLMLogFormatters.formatCombatStartEvent(event);
          const narration = await generateInitialNarration(state, structuredStartLogs);
          roundLog.llmContextLog.push(structuredStartLogs);
          if (narration) roundLog.llmNarrations.push(narration);
          break;
          
        case PhaseChangeSubtype.ROUND_END:
          // For round end, format all events from the current round
          const structuredRoundLogs = LLMLogFormatters.formatEventsForSingleRound(roundLog.events);
          const roundNarration = await generateRoundNarration(state, structuredRoundLogs);
          roundLog.llmContextLog.push(structuredRoundLogs);
          if (roundNarration) {
            // Annotate the round narration and store directly in llmNarrations
            const annotatedNarration = await annotateNarration(roundNarration, state, currentRoundIndex);
            roundLog.llmNarrations.push(annotatedNarration);
          }
          break;
          
        case PhaseChangeSubtype.END:
          // For combat end, use the dedicated combat end formatter for the end event
          // and format the other events separately
          const combatEndLog = LLMLogFormatters.formatCombatEndEvent(event);
          const aftermathNarration = await generateAfterMathNarration(state, combatEndLog);
          roundLog.llmContextLog.push(combatEndLog);
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
 * Also checks for and triggers any passive abilities that should activate in response
 * 
 * @param event The game event to emit
 * @param state The current game state
 */ 
export async function logAndEmitCombatEvent(event: CombatEvent, state: CombatState): Promise<void> {
  // Populate logs and wait for narrations to be generated
  await populateCombatLogs(event, state);
  
  // Check for passive abilities that should trigger from this event
  // Skip if this is already a passive ability event to prevent infinite loops
  if (event.type !== 'ABILITY' || !event.ability?.passive) {
    await executePassiveAbilities(event, state);
  }
  
  // for now, dont add to an event queue - no need to
}
