import { GameState } from '../types/gamestate';
import { CombatState, createCombatState } from '../game_engine/combatState';
import { initializeCombat } from '../game_engine/combat';
import { Character } from '../types/actor';
import claraJson from '../../data/monsters/clara.json';
import greenSlimeJson from '../../data/monsters/green_slime.json';
import profanedTempleJson from '../../data/dungeons/profaned_temple.json';
import { loadMonster } from '../game_engine/utils/dataLoader';
import { loadDungeonFromJson } from '../game_engine/utils/dungeonUtils';

// TODO: ADD TEST MESSAGES TO COMBATLOG AND NARRATIN LOGS

export function createDefaultTestCharacters(): { player: Character; monster: Character } {
    return {
        player: loadMonster(claraJson),
        monster: loadMonster(greenSlimeJson)
    };
}

export function createTestCombatState(roomId: string, characterIds: string[] = [], overrides: Partial<CombatState> = {}): CombatState {
    const state = createCombatState(characterIds, roomId);
    
    // Add default combat log
    state.combatLog = [{
        round: 1,
        combatLogs: ["Combat Initialized."],
        narrations: ["A detested HEROINE approaches!"]
    }];

    return {
        ...state,
        ...overrides
    };
}

export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    // Load the profaned temple dungeon
    const dungeon = loadDungeonFromJson(JSON.stringify(profanedTempleJson));

    return {
        turnCounter: 0,
        dayCounter: 0,
        dungeon,
        deck: { baseMonsters: [], traits: [], traps: [] },
        infamy: 0,
        dailyPacksRemaining: 0,
        characters: {},
        currentPhase: 'combat',
        activeCombat: null,
        ...overrides
    };
}

// Helper to create a full combat scenario
export async function createTestCombatScenario(
    player: Character,
    monster: Character,
    roomId: string,
    overrides: Partial<GameState> = {}
): Promise<GameState> {
    const gameState = createTestGameState({
        characters: {
            [player.name]: player,
            [monster.name]: monster
        },
        ...overrides
    });
    
    const characterIds = Object.keys(gameState.characters);
    const characters = [player, monster] as [Character, Character];
    
    // Initialize combat state with proper setup
    const combatState = await initializeCombat(gameState, roomId);
    gameState.activeCombat = combatState;
    
    return gameState;
}
