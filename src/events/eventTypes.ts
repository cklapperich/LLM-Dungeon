// Event type constants
export const EventType = {
  SKILL_CHECK: 'SKILL_CHECK' as const,
  ABILITY: 'ABILITY' as const,
  EFFECT: 'EFFECT' as const,
  STATUS: 'STATUS' as const,
  PHASECHANGE: 'PHASECHANGE' as const,
  INITIATIVE: 'INITIATIVE' as const
};

export const PhaseChangeSubtype = {
  START: 'START' as const,
  END: 'END' as const,
  TURN: 'TURN' as const,
  ROUND_END: 'ROUND_END' as const
};

/*
THIS IS USED BY THE COMBAT ENGINE / GAME ENGINE TO POPULATE THE LOGS
THESE EVENTS CURRENTLY DO NOT GET PUSHED TO ANY QUEUE
*/
import { SkillName, RollResult } from '../types/skilltypes';
import { Status } from '../types/status';
import { Effect } from '../game_engine/combat/effect';
import { Character } from '../types/actor';
import { Trait } from '../types/abilities';
import { CombatEndReasonType } from '../types/constants';
import {Room} from '../types/dungeon';

// Define the event type literals for combat events
export type CombatEventType = 
    | 'SKILL_CHECK'
    | 'ABILITY'
    | 'EFFECT'
    | 'STATUS'
    | 'PHASECHANGE'
    | 'INITIATIVE';

// Define the event type literals for dungeon events
export type DungeonEventType = 
    | 'MONSTER_ADDED'
    | 'COMBAT_STATE_CHANGE';
    // Add more as needed: 'TRAP_PLACED', 'MONSTER_MOVED', etc.

// Core event data types
export interface SkillCheckEvent {
    type: 'SKILL_CHECK';
    actor: Character;
    target?: Character;
    skill: SkillName;
    result: RollResult;
    is_opposed?: boolean;
    opposed_result?: RollResult;
}

export interface AbilityEvent {
    type: 'ABILITY';
    actor: Character;
    ability: Trait;
    target?: Character;
    success?: boolean;
    failureReason?: string;
}

export interface EffectEvent {
    type: 'EFFECT';
    effect: Effect;  // Effect contains target info
    source: Character;
    target: Character; // Need this for formatter access
    success: boolean;
}

export interface StatusEvent {
    type: 'STATUS';
    status: Status;  // Status contains source info
    target: Character; // Need this for formatter access
    action: 'ADDED' | 'REMOVED' | 'STACKS_INCREASED' | 'STACKS_DECREASED';
    stackChange?: number; // The amount by which stacks changed
    // If action is 'REMOVED' and stackChange is present, it means the status was removed because stacks reached 0
}

export interface CombatPhaseChangedEvent {
    type: 'PHASECHANGE';
    subtype: 'START' | 'END' | 'TURN' | 'ROUND_END';
    room: Room;
    characters?: Character[];
    winner?: Character;
    reason?: CombatEndReasonType | string;
}

export interface InitiativeEvent {
    type: 'INITIATIVE';
    characters: [Character, Character];
    results: [RollResult, RollResult];
    first_actor: Character;
}

// Core dungeon event interfaces
export interface MonsterAddedEvent {
    type: 'MONSTER_ADDED';
    monster: Character;
    room: Room;
}

export interface CombatStartEndEvent {
    type: 'COMBAT_STATE_CHANGE';
    subtype: 'START' | 'END';
    room: Room;
    characters?: Character[];
    winner?: Character;
    reason?: CombatEndReasonType | string;
}

// Union types for event categories
export type CombatEvent = 
    | SkillCheckEvent
    | AbilityEvent
    | EffectEvent
    | StatusEvent
    | CombatPhaseChangedEvent
    | InitiativeEvent;

export interface HeroMovedEvent {
  type: 'HERO_MOVED';
  hero: Character;
  fromRoom: Room;
  toRoom: Room;
}

export type DungeonEvent = 
  | MonsterAddedEvent
  | CombatStartEndEvent
  | HeroMovedEvent;
    // Add more as needed

// GameEvent is a union of all event types
export type GameEvent = CombatEvent | DungeonEvent;

// State change tracking
export interface StateChange {
    event: GameEvent;
    timestamp: number;
    changes: {
        target: Character;
        property: string;
        oldValue: any;
        newValue: any;
    }[];
}

// Combat round logging
export interface CombatRoundLog {
    events: GameEvent[];
    debugLog: string[];
    llmContextLog: string[];
    llmNarrations:string[];
    round: number;
}
