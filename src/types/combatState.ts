import { Character } from './actor';
import { CharacterType } from './constants';
import { UIAction, LogType } from '../react_ui/types/uiTypes';
import { GameEvent } from '../game_engine/events/eventTypes';

// Types moved from gamestate.ts
export interface CombatRoundLog {
    events: GameEvent[];          // Raw event data for structured logging
    debugLog: string[];          // Technical debug log with roll details
    llmContextLog: string[];     // Narrative descriptions for LLM context
    llmNarrations: string[];     // Generated narrative output from LLM
    round: number;
}

// Snapshot of character state at a point in time
export interface CharacterSnapshot {
    vitality: number;
    conviction: number;
    clothing: number;
    statuses: string[];  // Just store status names for snapshots
}

// Snapshot of game state after an action
export interface StateSnapshot {
    timestamp: number;
    round: number;
    activeCharacterIndex: number;
    characters: Record<string, CharacterSnapshot>;
    eventIndex: number;  // Index into combatLog[round].events array
}

export interface CombatState {
    roomId: string;
    characterIds: string[];  // Store character IDs instead of direct references
    round: number;
    isComplete: boolean;
    activeCharacterIndex: number;
    playerActions: UIAction[];  // Available actions for the monster (player-controlled character)
    combatLog: CombatRoundLog[];
    stateHistory: StateSnapshot[];  // History of state changes
    currentHistoryIndex: number;    // Current position in history, -1 means latest
}

// Core state management functions
export function createCombatState(characterIds: string[], roomId: string): CombatState {
    const initialState: CombatState = {
        stateHistory: [],
        currentHistoryIndex: -1,
        roomId,
        characterIds,
        round: 0,
        isComplete: false,
        activeCharacterIndex: 0,
        playerActions: [],
        // we really do need a round 0. Its for initial events.
        combatLog: [{
            events: [],
            debugLog: [],
            llmContextLog: [],
            llmNarrations: [],
            round: 0
        }],
    };

    return initialState;
}

// State history navigation functions
export function canStepBackward(state: CombatState): boolean {
    return state.currentHistoryIndex > 0;
}

export function canStepForward(state: CombatState): boolean {
    return state.currentHistoryIndex >= 0 && state.currentHistoryIndex < state.stateHistory.length - 1;
}

export function getStateAtHistoryIndex(state: CombatState, index: number): StateSnapshot | null {
    if (index < 0 || index >= state.stateHistory.length) return null;
    return state.stateHistory[index];
}

// Log utility functions moved from gamestate.ts
export function getAllEvents(combatState: CombatState): GameEvent[] {
    return combatState.combatLog.reduce((allEvents: GameEvent[], roundLog: CombatRoundLog) => {
        return [...allEvents, ...roundLog.events];
    }, []);
}

export function getAllDebugLogs(combatState: CombatState): string[] {
    return combatState.combatLog.reduce((allLogs: string[], roundLog: CombatRoundLog) => {
        return [...allLogs, ...roundLog.debugLog];
    }, []);
}

export function getAllLLMContextLogs(combatState: CombatState): string[] {
    return combatState.combatLog.reduce((allLogs: string[], roundLog: CombatRoundLog) => {
        return [...allLogs, ...roundLog.llmContextLog];
    }, []);
}

// Helper functions to get character IDs based on their type
export function getMonsterCharacterId(combatState: CombatState, characters: Record<string, Character>): string {
    return combatState.characterIds.find(id => characters[id].type === CharacterType.MONSTER) || '';
}

export function getHeroCharacterId(combatState: CombatState, characters: Record<string, Character>): string {
    return combatState.characterIds.find(id => characters[id].type === CharacterType.HERO) || '';
}

export function getAllLogsWithRounds(combatState: CombatState): Array<{
    text: string;
    round: number;
    type: LogType;
}> {
    return combatState.combatLog.reduce((allLogs, roundLog) => {
        const debugLogs = roundLog.debugLog.map(log => ({
            text: log,
            round: roundLog.round,
            type: 'debug' as const
        }));
        
        const contextLogs = roundLog.llmContextLog.map(log => ({
            text: log,
            round: roundLog.round,
            type: 'llm_context' as const
        }));

        const narrationLogs = roundLog.llmNarrations.map(log => ({
            text: log,
            round: roundLog.round,
            type: 'llm_narration' as const
        }));

        const eventLogs = roundLog.events.map(event => ({
            text: JSON.stringify(event),
            round: roundLog.round,
            type: 'event' as const
        }));
        
        return [...allLogs, ...debugLogs, ...contextLogs, ...narrationLogs, ...eventLogs];
    }, [] as Array<{text: string; round: number; type: LogType}>);
}
