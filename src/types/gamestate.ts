import { Character } from './actor.js';
import { type Trait } from './abilities.js';
import { 
    RarityType,
} from './constants.js';
import { DungeonLayout } from './dungeon.js';
import type { CombatState } from './combatState.js';

// Base interface for all game actions
export interface GameActionResult {
    success: boolean;
    message?: string;  // Optional message for logging/debugging
}

export interface GameLogMessage {
    text: string;
    type: 'narration' | 'combat';
}

export interface Card {
    id: string;
    name: string;
    type: 'baseMonster' | 'trait' | 'trap';
    rarity: typeof RarityType[keyof typeof RarityType];
    description: string;
    artworkUrl?: string;
}

export interface Trap {
    id: string;
    name: string;
    description: string;
    modifier: Number;
    artworkUrl?: string;
    effect: Trait;
}

export type GamePhase = 'combat' | 'dungeon_building' | 'planning' | 'event';

export interface GameState {
    // Game settings
    narrationEnabled: boolean;

    // Time tracking
    turnCounter: number;
    dayCounter: number;
    
    // Dungeon state
    dungeon: DungeonLayout;
    
    // Card System
    deck: {
        baseMonsters: Card[];
        traits: Card[];
        traps: Card[];
    };
    
    // Resources & Progress
    infamy: number;
    dailyPacksRemaining: number;
    
    // Active characters in game
    characters: Record<string, Character>;
    
    // Combat state (only one active at a time)
    activeCombat?: CombatState | null;

    // Game phase
    currentPhase: GamePhase;

}

// Helper function to create a minimal GameState for testing
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    return {
        narrationEnabled: false,
        turnCounter: 0,
        dayCounter: 0,
        dungeon: {
            grid: [],
            rooms: {},
            templates: []
        },
        deck: {
            baseMonsters: [],
            traits: [],
            traps: []
        },
        infamy: 0,
        dailyPacksRemaining: 0,
        characters: {},
        currentPhase: 'planning',
        ...overrides
    };
}

// Helper functions for character lookups
export function getCharactersFromIdList(characterIdList: string[], gameState: GameState): Character[] {
    return characterIdList.map(id => {
        const character = gameState.characters[id];
        if (!character) throw new Error(`Character with ID ${id} not found`);
        return character;
    });
}
