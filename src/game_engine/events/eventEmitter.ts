/**
 * EventEmitter
 * 
 * PURPOSE:
 * Created to enforce a standardized approach to event creation and handling.
 * This component acts as a single source of truth for event structure, ensuring
 * type safety and data consistency throughout the event system. This prevents
 * bugs from malformed events and enables reliable state change tracking tied
 * to specific game actions.
 */

import { 
    GameEvent,
    SkillCheckEvent,
    AbilityEvent,
    EffectEvent,
    StatusEvent,
    CombatEvent,
    TurnEvent,
    InitiativeEvent,
    StateChange
} from './eventTypes';
import { Character } from '../../types/actor';
import { SkillName, RollResult } from '../../types/skilltypes';
import { Effect } from '../effect';
import { Status } from '../../types/status';
import { Trait } from '../../types/abilities';

export class EventEmitter {
    static emitSkillCheck(
        actor: Character,
        skill: SkillName,
        result: RollResult,
        target?: Character,
        isOpposed: boolean = false,
        opposedResult?: RollResult
    ): SkillCheckEvent {
        return {
            type: 'SKILL_CHECK',
            actor,
            target,
            skill,
            result,
            is_opposed: isOpposed,
            opposed_result: opposedResult
        };
    }

    static emitAbility(
        actor: Character,
        ability: Trait,
        target?: Character
    ): AbilityEvent {
        return {
            type: 'ABILITY',
            actor,
            ability,
            target
        };
    }

    static emitEffect(
        effect: Effect,
        source: Character,
        target: Character,
        success: boolean
    ): EffectEvent {
        return {
            type: 'EFFECT',
            effect,
            source,
            target,
            success
        };
    }

    static emitStatus(
        status: Status,
        target: Character
    ): StatusEvent {
        return {
            type: 'STATUS',
            status,
            target
        };
    }

    static emitCombat(
        subtype: 'START' | 'END',
        params: {
            room_id?: string;
            characters?: Character[];
            winner?: Character;
            reason?: string;
        }
    ): CombatEvent {
        return {
            type: 'COMBAT',
            subtype,
            ...params
        };
    }

    static emitTurn(
        actor: Character,
        round: number
    ): TurnEvent {
        return {
            type: 'TURN',
            actor,
            round
        };
    }

    static emitInitiative(
        characters: [Character, Character],
        results: [RollResult, RollResult],
        firstActor: Character
    ): InitiativeEvent {
        return {
            type: 'INITIATIVE',
            characters,
            results,
            first_actor: firstActor
        };
    }

    static createStateChange(
        event: GameEvent,
        changes: StateChange['changes']
    ): StateChange {
        return {
            event,
            timestamp: Date.now(),
            changes
        };
    }
}
