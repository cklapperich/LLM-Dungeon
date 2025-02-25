import { SkillName, RollResult } from '../../types/skilltypes';
import { Status } from '../../types/status';
import { Effect } from '../effect';
import { Character } from '../../types/actor';
import { Trait } from '../../types/abilities';

export type EventType = 
    | 'SKILL_CHECK'
    | 'ABILITY'
    | 'EFFECT'
    | 'STATUS'
    | 'COMBAT'
    | 'TURN'
    | 'INITIATIVE';

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

export interface CombatEvent {
    type: 'COMBAT';
    subtype: 'START' | 'END';
    room_id?: string;
    characters?: Character[];
    winner?: Character;
    reason?: string;
}

export interface TurnEvent {
    type: 'TURN';
    actor: Character;
    round: number;
}

export interface InitiativeEvent {
    type: 'INITIATIVE';
    characters: [Character, Character];
    results: [RollResult, RollResult];
    first_actor: Character;
}

// Union type for all events
export type GameEvent = 
    | SkillCheckEvent
    | AbilityEvent
    | EffectEvent
    | StatusEvent
    | CombatEvent
    | TurnEvent
    | InitiativeEvent;

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
    round: number;
    stateChanges: StateChange[];
}
