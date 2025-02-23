import { Character } from '../types/actor';
import { UIAction } from '../react_ui/types/uiTypes';
import { processInitiative } from './utils/skillCheck';

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
        round: 1,
        isComplete: false,
        activeCharacterIndex: 0,
        playerActions: [],
        combatLog: [{
            combatLogs: [],
            round: 1,
            narrations: []
        }],
    };
}

export function initializeCombatState(
    characterIds: string[],
    characters: [Character, Character], // Exactly two characters for combat
    roomId: string
): CombatState {
    const initiativeResult = processInitiative(characters[0], characters[1]);
    
    // Create initial state
    const state = createCombatState(characterIds, roomId);
    state.activeCharacterIndex = characterIds.findIndex(
        id => characters.indexOf(initiativeResult.firstActor) === 0
    );
    
    // Set initiative values
    const [char1, char2] = characters;
    char1.initiative = char1 === initiativeResult.firstActor ? 0 : 1;
    char2.initiative = char2 === initiativeResult.firstActor ? 0 : 1;
    
    // Log initiative
    state.combatLog[0].combatLogs.push(
        `${initiativeResult.firstActor.name} moves first! ${initiativeResult.description}`
    );
    
    return state;
}

export async function startNewRound(
    state: CombatState,
    characters: [Character, Character]
): Promise<void> {
    state.round += 1;
    state.combatLog.push({
        combatLogs: [],
        round: state.round,
        narrations: []
    });
    
    // Process new round initiative
    const initiativeResult = processInitiative(characters[0], characters[1]);
    
    // Update initiative values
    const [char1, char2] = characters;
    char1.initiative = char1 === initiativeResult.firstActor ? 0 : 1;
    char2.initiative = char2 === initiativeResult.firstActor ? 0 : 1;
    
    // Update active character
    state.activeCharacterIndex = characters.indexOf(initiativeResult.firstActor);
    
    // Log initiative
    state.combatLog[state.round - 1].combatLogs.push(
        `${initiativeResult.firstActor.name} moves first! ${initiativeResult.description}`
    );

    // Reduce cooldowns on all abilities
    characters.forEach(character => {
        character.traits.forEach(trait => {
            if (trait.cooldown?.current > 0) {
                trait.cooldown.current--;
            }
        });
    });
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
