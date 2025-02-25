/**
 * CombatLogFormatters
 * 
 * PURPOSE:
 * Unified system for formatting game events into human-readable text.
 * Supports multiple output modes:
 * - DETAILED: Full context with calculations and modifiers (formerly CombatLogFormatter)
 * - DEBUG: Terse technical output for debugging (formerly DebugLogGenerator)
 */

import { 
    GameEvent,
    SkillCheckEvent,
    AbilityEvent,
    EffectEvent,
    StatusEvent,
    CombatEvent,
    TurnEvent,
    InitiativeEvent
} from '../events/eventTypes';
import { RollResult } from '../../types/skilltypes';

export enum FormatMode {
    DETAILED = 'DETAILED',
    DEBUG = 'DEBUG'
}

export class CombatLogFormatters {
    private static mode: FormatMode = FormatMode.DETAILED;

    static setMode(mode: FormatMode) {
        this.mode = mode;
    }

    private static formatModifiers(modifiers?: { value: number; reason: string }[]): string {
        if (!modifiers?.length) return '';
        return modifiers.map(m => 
            `${m.value >= 0 ? '+' : ''}${m.value} (${m.reason})`
        ).join(', ');
    }

    private static formatRollResult(result: RollResult, mode: FormatMode = FormatMode.DETAILED): string {
        if (mode === FormatMode.DEBUG) {
            return `Roll: ${result.roll}, Attribute: ${result.attribute}, Margin: ${result.margin}\n` +
                   `Success: ${result.success}, Critical: ${result.isCriticalSuccess || result.isCriticalFailure}`;
        }

        const modifierStr = this.formatModifiers(result.modifiers);
        return `Roll: ${result.roll} vs Attribute: ${result.attribute}` +
               (modifierStr ? `\nModifiers: [${modifierStr}]` : '') +
               `\nResult: ${result.success ? 'Success' : 'Failure'} by ${Math.abs(result.margin)}` +
               (result.isCriticalSuccess ? ' [CRITICAL SUCCESS]' : '') +
               (result.isCriticalFailure ? ' [CRITICAL FAILURE]' : '') +
               (result.description ? `\nDescription: ${result.description}` : '');
    }

    private static formatSkillCheck(event: SkillCheckEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `SKILL_CHECK: ${event.actor.name} -> ${event.skill}\n${this.formatRollResult(event.result, FormatMode.DEBUG)}`;
        }

        let log = `${event.actor.name} rolled ${event.skill}: ${this.formatRollResult(event.result)}`;
        
        if (event.is_opposed && event.opposed_result) {
            log += `\nOpposed by ${event.target?.name}: ${this.formatRollResult(event.opposed_result)}`;
        }

        return log;
    }

    private static formatEffect(event: EffectEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `EFFECT: ${event.source.name} -> ${event.effect.type} -> ${event.target.name}\n` +
                   `Params: ${JSON.stringify(event.effect.params)}\n` +
                   `Success: ${event.success}`;
        }

        return `${event.source.name} used ${event.effect.type} on ${event.target.name}` +
               `\nParams: ${JSON.stringify(event.effect.params)}` +
               `\nResult: ${event.success ? 'Success' : 'Failure'}`;
    }

    private static formatStatus(event: StatusEvent): string {
        const status = event.status;
        
        if (this.mode === FormatMode.DEBUG) {
            return `STATUS: ${event.target.name} -> ${status.name} [${event.action}]\n` +
                   `Source: ${status.sourceAbility || status.sourceEffect || 'Unknown'}\n` +
                   `Stacks: ${status.stacks}/${status.max_stacks}\n` +
                   `Duration: ${status.duration || 'Permanent'}\n` +
                   (event.stackChange ? `Stack Change: ${event.stackChange}` : '');
        }

        let actionText = '';
        switch (event.action) {
            case 'ADDED':
                actionText = `${event.target.name} gained status: ${status.name}`;
                break;
            case 'REMOVED':
                actionText = `${event.target.name} lost status: ${status.name}`;
                break;
            case 'STACKS_INCREASED':
                actionText = `${event.target.name}'s ${status.name} increased by ${event.stackChange || 1} (now ${status.stacks})`;
                break;
            case 'STACKS_DECREASED':
                actionText = `${event.target.name}'s ${status.name} decreased by ${event.stackChange || 1} (now ${status.stacks})`;
                break;
            default:
                actionText = `${event.target.name} status: ${status.name}`;
        }

        return actionText +
               `\nSource: ${status.sourceAbility || status.sourceEffect || 'Unknown'}` +
               `\nStacks: ${status.stacks}/${status.max_stacks}` +
               (status.duration ? `\nDuration: ${status.duration} rounds` : '');
    }

    private static formatCombat(event: CombatEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `COMBAT: ${event.subtype}\n` +
                   `Room: ${event.room_id}\n` +
                   `Participants: ${event.characters?.map(c => c.name).join(', ')}`;
        }

        if (event.subtype === 'START') {
            const participants = event.characters?.map(c => c.name).join(' vs ') || '';
            return `Combat started in room ${event.room_id}\nParticipants: ${participants}`;
        } else {
            return `Combat ended - ${event.winner?.name} wins (${event.reason})`;
        }
    }

    private static formatTurn(event: TurnEvent): string {
        const base = `Round ${event.round}: ${event.actor.name}'s turn`;
        return this.mode === FormatMode.DEBUG ? `TURN: ${base}` : base;
    }

    private static formatInitiative(event: InitiativeEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `INITIATIVE:\n` +
                   `${event.characters[0].name}: ${this.formatRollResult(event.results[0], FormatMode.DEBUG)}\n` +
                   `${event.characters[1].name}: ${this.formatRollResult(event.results[1], FormatMode.DEBUG)}\n` +
                   `First: ${event.first_actor.name}`;
        }

        const [char1, char2] = event.characters;
        const [result1, result2] = event.results;
        
        return `Initiative rolls:` +
               `\n${char1.name}: ${this.formatRollResult(result1)}` +
               `\n${char2.name}: ${this.formatRollResult(result2)}` +
               `\n${event.first_actor.name} acts first`;
    }

    private static formatAbility(event: AbilityEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `ABILITY: ${event.actor.name} -> ${event.ability.name}\n` +
                   `Skill: ${event.ability.skill}, Modifier: ${event.ability.modifier}`;
        }

        return `${event.actor.name} used ${event.ability.name}` +
               (event.target ? ` on ${event.target.name}` : '') +
               `\nDescription: ${event.ability.description}` +
               `\nSkill: ${event.ability.skill}` +
               `\nModifier: ${event.ability.modifier}` +
               `\nEffects: ${event.ability.effects.map(e => e.type).join(', ')}`;
    }

    static formatEvent(event: GameEvent): string {
        switch (event.type) {
            case 'SKILL_CHECK':
                return this.formatSkillCheck(event);
            case 'ABILITY':
                return this.formatAbility(event);
            case 'EFFECT':
                return this.formatEffect(event);
            case 'STATUS':
                return this.formatStatus(event);
            case 'COMBAT':
                return this.formatCombat(event);
            case 'TURN':
                return this.formatTurn(event);
            case 'INITIATIVE':
                return this.formatInitiative(event);
            default:
                const defaultMsg = `Unknown event type: ${(event as any).type}`;
                return this.mode === FormatMode.DEBUG ? 
                    `ERROR: ${defaultMsg}\nEvent: ${JSON.stringify(event)}` : 
                    defaultMsg;
        }
    }

    static formatEvents(events: GameEvent[]): string[] {
        return events.map(event => this.formatEvent(event));
    }
}
