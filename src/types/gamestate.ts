import { Character } from './actor.js';
import { type Trait } from './abilities.js';
import { 
    RoomCapacity,
    MonsterSize,
    LimbType,
    RarityType,
} from './constants.js';
import { DungeonLayout } from './dungeon.js';

export interface Card {
    id: string;
    name: string;
    type: 'baseMonster' | 'trait' | 'trap';
    rarity: typeof RarityType[keyof typeof RarityType];
    description: string;
    artworkUrl?: string;
}

export interface BaseMonster extends Character {
    size: MonsterSize;
    traits: Trait[];
}

export interface Trap {
    id: string;
    name: string;
    description: string;
    modifier: Number;
    artworkUrl?: string;
    effect: Trait;
}

export interface CombatState {
    roomId: string;
    monster: BaseMonster;
    hero: Character;
    grappleState: number;
    turnCounter: number;
    initiative: number;
    restrainedLimbs: typeof LimbType[keyof typeof LimbType][];
}

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
    
    // Active heroes in dungeon
    heroes: Character[];
    
    // Combat state (only one active at a time)
    activeCombat?: CombatState | null;
}
