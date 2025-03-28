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
    CombatPhaseChangedEvent,
    CombatStartEndEvent
} from '../../events/eventTypes';
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
            let log = `SKILL_CHECK: ${event.actor.name} -> ${event.skill}\n${this.formatRollResult(event.result, FormatMode.DEBUG)}`;
            
            // Add more detailed information for opposed checks in DEBUG mode
            if (event.is_opposed && event.opposed_result) {
                log += `\nDEFENSIVE_CHECK: ${event.target?.name} -> ${event.opposed_skill || 'Defense'}\n${this.formatRollResult(event.opposed_result, FormatMode.DEBUG)}`;
                log += `\nOPPOSED_RESULT: ${event.opposed_margin! >= 0 ? 'Attacker wins' : 'Defender wins'} by ${Math.abs(event.opposed_margin || 0)}`;
            }
            
            return log;
        }

        let log = `${event.actor.name} rolled ${event.skill}: ${this.formatRollResult(event.result)}`;
        
        if (event.is_opposed && event.opposed_result) {
            log += `\n${event.target?.name} defended with ${event.opposed_skill || 'Defense'}: ${this.formatRollResult(event.opposed_result)}`;
            log += `\nResult: ${event.opposed_margin! >= 0 ? `${event.actor.name}'s attack succeeds` : `${event.target?.name}'s defense succeeds`} by ${Math.abs(event.opposed_margin || 0)}`;
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

    private static formatCombatPhaseChange(event: CombatPhaseChangedEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `PHASECHANGE: ${event.subtype}\n` +
                   `Room: ${event.room.name || 'Unknown'}\n` +
                   `Participants: ${event.characters?.map(c => c.name).join(', ')}`;
        }

        if (event.subtype === 'START') {
            const participants = event.characters?.map(c => c.name).join(' vs ') || '';
            return `Combat phase started in ${event.room.name || 'the room'}\nParticipants: ${participants}`;
        } else if (event.subtype === 'END') {
            return `Combat phase ended - ${event.winner?.name || 'No winner'} ${event.reason ? `(${event.reason})` : ''}`;
        } else if (event.subtype === 'ROUND_START') {
            // Assuming the first character in the array is the active one for the turn
            const activeCharacter = event.characters?.[0];
            if (!activeCharacter) return 'Turn phase';
            return `Turn phase: ${activeCharacter.name}'s turn`;
        } else if (event.subtype === 'ROUND_END') {
            return `Round ended in ${event.room.name || 'the room'}`;
        }
        
        return `Unknown phase change: ${event.subtype}`;
    }

    private static formatCombatStateChange(event: CombatStartEndEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `COMBAT_STATE_CHANGE: ${event.subtype}\n` +
                   `Room: ${event.room.name || 'Unknown'}\n` +
                   `Participants: ${event.characters?.map(c => c.name).join(', ')}`;
        }

        if (event.subtype === 'START') {
            const participants = event.characters?.map(c => c.name).join(' vs ') || '';
            return `Combat started in ${event.room.name || 'the room'}\nParticipants: ${participants}`;
        } else if (event.subtype === 'END') {
            return `Combat ended - ${event.winner?.name || 'No winner'} ${event.reason ? `(${event.reason})` : ''}`;
        }
        
        return `Unknown combat state change: ${event.subtype}`;
    }

    private static formatAbility(event: AbilityEvent): string {
        if (this.mode === FormatMode.DEBUG) {
            return `ABILITY: ${event.actor.name} -> ${event.ability.name}\n` +
                   `Skill: ${event.ability.skill}, Modifier: ${event.ability.modifier}` +
                   (event.success === false ? `\nFailed: ${event.failureReason || 'Unknown reason'}` : '');
        }

        // Check if the ability failed due to requirements not being met
        if (event.success === false) {
            return `${event.actor.name} attempted to use ${event.ability.name}` +
                   (event.target ? ` on ${event.target.name}` : '') +
                   `\nDescription: ${event.ability.description}` +
                   `\nFAILED: ${event.failureReason || 'Requirements not met'}` +
                   `\nSkill: ${event.ability.skill}` +
                   `\nModifier: ${event.ability.modifier}`;
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
            case 'PHASECHANGE':
                return this.formatCombatPhaseChange(event);
            case 'COMBAT_STATE_CHANGE':
                return this.formatCombatStateChange(event);
            case 'MONSTER_ADDED':
                return `Monster ${event.monster.name} added to ${event.room.name || 'the room'}`;
            default:
                const defaultMsg = `Unknown event type: ${(event as any).type}`;
                return this.mode === FormatMode.DEBUG ? 
                    `ERROR: ${defaultMsg}\nEvent: ${JSON.stringify(event)}` : 
                    defaultMsg;
        }
    }

    static formatEvents(events: GameEvent[]): string[] {
        return events.map((event, index) => `${index + 1}. ${this.formatEvent(event)}`);
    }
}
