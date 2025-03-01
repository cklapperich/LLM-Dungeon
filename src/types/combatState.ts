import { Character } from './actor';
import { CharacterType } from './constants';
import { LogType } from '../react_ui/uiTypes';
import { CombatGameAction } from './gamestate';
import { GameEvent } from '../events/eventTypes';
import { Room } from './dungeon';
import { GameSettings } from './gamestate';
import { CombatEndReasonType } from './constants';

// Types moved from gamestate.ts
export interface CombatRoundLog {
    events: GameEvent[];          // Raw event data for structured logging
    debugLog: string[];          // Technical debug log with roll details
    llmContextLog: string[];     // Narrative descriptions for LLM context
    llmNarrations: string[];     // Generated narrative output from LLM,
    prompts: string[];        // prompt used for LLM call
    round: number;
}

export interface CombatState {
    room: Room;
    characters: Character[];  // Store character IDs instead of direct references
    round: number;
    isComplete: boolean;
    activeCharacterIndex: number;
    playerActions: CombatGameAction[];  // Available actions for the monster (player-controlled character)
    combatLog: CombatRoundLog[];
    currentHistoryIndex: number;    // Current position in history, -1 means latest
    settings: GameSettings;  // Game settings stored directly in combat state, from GameState
    winner?: Character;  // The character who won the combat (if any)
    endReason?: CombatEndReasonType;  // The reason combat ended (e.g. "death", "escape")
}

// Core state management functions
export function createCombatState(characters: Character[], room: Room, settings: GameSettings): CombatState {
    const initialState: CombatState = {
        currentHistoryIndex: -1,
        room,
        characters,
        round: 0,
        isComplete: false,
        activeCharacterIndex: 0,
        playerActions: [],
        settings,
        winner: undefined,
        endReason: undefined,
        // we really do need a round 0. Its for initial events.
        combatLog: [{
            events: [],
            debugLog: [],
            llmContextLog: [],
            llmNarrations: [],
            prompts: [],
            round: 0
        }],
    };

    return initialState;
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
export function getMonster(combatState: CombatState): Character {
    return combatState.characters.find(c => c.type === CharacterType.MONSTER) || null;
}

export function getHero(combatState: CombatState): Character {
    return combatState.characters.find(c => c.type === CharacterType.HERO) || null;
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
        
        const promptLogs = roundLog.prompts.map(prompt => ({
            text: prompt,
            round: roundLog.round,
            type: 'prompt' as const
        }));
        
        return [...allLogs, ...debugLogs, ...contextLogs, ...narrationLogs, ...eventLogs, ...promptLogs];
    }, [] as Array<{text: string; round: number; type: LogType}>);
}
