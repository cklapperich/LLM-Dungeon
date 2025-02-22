import { Character } from './actor.js';
import { type Trait } from './abilities.js';
import { 
    RoomCapacity,
    MonsterSize,
    LimbType,
    RarityType,
} from './constants.js';
import { DungeonLayout } from './dungeon.js';
import { UIAction } from '../react_ui/types/uiTypes';

// Message types
export type MessageSender = 'user' | 'assistant' | 'system';

export interface GameLogMessage {
    sender: MessageSender;
    content: string;
    timestamp: number;
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

// Result of executing a trait/ability
export interface ActionResult {
    trait: Trait;
    actor: Character;
    target?: Character;
    success: boolean;
    message?: string;
    margin?: number;  // For skill checks
}

export interface CombatState {
    roomId: string;
    characters: Character[];
    round: number;
    isComplete: boolean;
    activeCharacterIndex: number;
    current_turn: 'AI' | 'player';
    legalActions: UIAction[];  // Available actions for the current actor
    actionResults: ActionResult[];  // Results of actions taken during combat
}

// Helper function to create a minimal GameState for testing
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    return {
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
        messageLog: [],
        currentPhase: 'planning',
        ...overrides
    };
}

export type GamePhase = 'combat' | 'dungeon_building' | 'planning' | 'event';

export interface GameState {
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

    // Message log
    messageLog: GameLogMessage[];

    // Game phase
    currentPhase: GamePhase;
}
