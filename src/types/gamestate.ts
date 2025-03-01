import { Character } from './actor.js';
import { type Trait } from './abilities.js';
import { 
    RarityType,
} from './constants.js';
import { DungeonLayout } from './dungeon.js';
import type { CombatState } from './combatState.js';
import { GameEvent } from '../events/eventTypes';

// Base interface for all game actions
export interface GameAction {
    type: string;
    name: string;
    description: string;
    disabled?: boolean;
    disabledReason?: string;
}

// Specific action for adding a monster to a room
export interface AddMonsterToRoomAction extends GameAction {
    type: 'ADD_MONSTER_TO_ROOM';
    monsterId: string;
    roomId: string;
}

// Combat-specific game action
export interface CombatGameAction extends GameAction {
    type: 'combat';
    trait: Trait;  // Store the full trait object
    characterId: string;  // Store which character is using the trait
}

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

export interface GameRoundLog {
    events: GameEvent[];          // Raw event data for structured logging
    debugLog: string[];          // Technical debug log with roll details
    day: number;
    turn: number;
}

// Helper function to create a minimal GameState for testing
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    // Initialize with empty objects for heroes and monsters
    const heroes = overrides.heroes || {};
    const monsters = overrides.monsters || {};

    return {
        settings: { narrationEnabled: false, llm:null, spicy_llm:null},
        turnCounter: 0,
        dayCounter: 0,
        waveCounter: 0,
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
        heroes,
        monsters,
        currentPhase: 'planning',
        ...overrides
    };
}

export enum WaveCompletionReason {
  ALL_HEROES_MOVED = 'ALL_HEROES_MOVED',
  ALL_HEROES_DEFEATED = 'ALL_HEROES_DEFEATED',
  HEROES_REACHED_NURSERY = 'HEROES_REACHED_NURSERY'
}

export interface WaveData {
    waveNumber: number;
    heroesToMove: string[];  // IDs of heroes that still need to move this wave
    isComplete: boolean;
    completionReason?: WaveCompletionReason;
    heroesDefeated: string[];  // IDs of heroes defeated during this wave
    combatsInitiated: number;  // Number of combats that occurred during this wave
}

export interface GameSettings {
    narrationEnabled: boolean;
    llm: string;
    spicy_llm: string;
    // Add other settings as needed
}

export interface GameState {
    settings: GameSettings;
    dungeon: DungeonLayout;
    // Card System
    deck: {
        baseMonsters: Card[];
        traits: Card[];
        traps: Card[];
    };
    waveCounter: number;
    currentWave?: WaveData;
    waveHistory?: WaveData[];
    turnCounter: number;
    dayCounter: number;
    // Combat state (only one active at a time)
    activeCombat?: CombatState | null;
    // Active characters in game, separated by type
    heroes: Record<string, Character>;
    monsters: Record<string, Character>;
    // Game phase
    currentPhase: GamePhase;
    // Game log for all events
    gameLog?: GameRoundLog[];
    // Available game actions
    gameActions?: GameAction[];
}
