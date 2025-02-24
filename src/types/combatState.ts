import { Character } from './actor';
import { CharacterType } from './constants';
import { UIAction } from '../react_ui/types/uiTypes';

// Types moved from gamestate.ts
export interface CombatRoundLog {
    combatLogs: string[];
    round: number;
    narrations: string[];
}

export interface CombatState {
    roomId: string;
    characterIds: string[];  // Store character IDs instead of direct references
    round: number;
    isComplete: boolean;
    activeCharacterIndex: number;
    playerActions: UIAction[];  // Available actions for the monster (player-controlled character)
    combatLog: CombatRoundLog[];
}

// Core state management functions
export function createCombatState(characterIds: string[], roomId: string): CombatState {
    return {
        roomId,
        characterIds,
        round: 0,
        isComplete: false,
        activeCharacterIndex: 0,
        playerActions: [],
        // we really do need a round 0. Its for initial narrations.
        combatLog: [{
            combatLogs: [],
            round: 0,
            narrations: []
        }],
    };
}

// Log utility functions moved from gamestate.ts
export function getAllNarrations(combatState: CombatState): string[] {
    return combatState.combatLog.reduce((allNarrations: string[], roundLog: CombatRoundLog) => {
        return [...allNarrations, ...roundLog.narrations];
    }, []);
}

export function getAllCombatLogs(combatState: CombatState): string[] {
    return combatState.combatLog.reduce((allLogs: string[], roundLog: CombatRoundLog) => {
        return [...allLogs, ...roundLog.combatLogs];
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
    type: 'narration' | 'combat';
}> {
    return combatState.combatLog.reduce((allLogs, roundLog) => {
        const combatLogs = roundLog.combatLogs.map(log => ({
            text: log,
            round: roundLog.round,
            type: 'combat' as const
        }));
        
        const narrationLogs = roundLog.narrations.map(log => ({
            text: log,
            round: roundLog.round,
            type: 'narration' as const
        }));
        
        return [...allLogs, ...combatLogs, ...narrationLogs];
    }, [] as Array<{text: string; round: number; type: 'narration' | 'combat'}>);
}
