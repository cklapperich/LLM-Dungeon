/**
 * LLMLogFormatters
 * 
 * PURPOSE:
 * Transforms game events into natural language narratives suitable for LLM processing.
 * Focuses on descriptive text without numerical values to maintain narrative immersion.
 * Uses DescriptionManager to ensure consistent vocabulary and theming.
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
import { Character } from '../../types/actor';
import { DescriptionManager } from '../utils/descriptionManager';

export class LLMLogFormatters {
    private static formatSkillCheck(event: SkillCheckEvent): string {
        const intensity = DescriptionManager.getIntensityFromRoll(event.result);
        const description = DescriptionManager.getSkillDescription(event.skill, intensity);
        
        if (event.is_opposed && event.opposed_result) {
            const opposedIntensity = DescriptionManager.getIntensityFromRoll(event.opposed_result);
            const opposedDescription = DescriptionManager.getSkillDescription(event.skill, opposedIntensity);
            
            return event.result.success
                ? `${event.actor.name} ${description}. ${event.target?.name} ${opposedDescription}, but fails to overcome.`
                : `${event.actor.name} ${description}. ${event.target?.name} ${opposedDescription}, and prevails.`;
        }

        return `${event.actor.name} ${description}`;
    }

    private static formatAbility(event: AbilityEvent): string {
        return event.ability.description;
    }

    private static formatEffect(event: EffectEvent): string {
        const { effect, target, success } = event;

        switch (effect.type) {
            case 'WOUND':
                return success 
                    ? `${target.name} ${DescriptionManager.getVitalityDescription(target.vitality)}`
                    : `${target.name} evades harm`;

            case 'HEAL':
                return success 
                    ? `${target.name} ${DescriptionManager.getVitalityDescription(target.vitality)}`
                    : `${target.name} remains unhealed`;

            case 'GRAPPLE':
                if (!success) return `${target.name} resists`;
                
                const grappleType = effect.params.type || 'grab';
                const limbType = effect.params.limbType;
                
                if (grappleType === 'penetrate') {
                    return DescriptionManager.getStatusDescription('penetrated');
                }
                if (limbType) {
                    return DescriptionManager.getStatusDescription(`bound_${limbType.toLowerCase()}`);
                }
                return DescriptionManager.getStatusDescription('grappled');

            case 'MODIFY_CLOTHING':
                return DescriptionManager.getClothingDescription(target.clothing);

            case 'BREAK_FREE':
                if (!success) return DescriptionManager.getStatusDescription('grappled');
                
                const wasPenetrated = target.statuses?.some(s => s.name === 'penetrated');
                if (wasPenetrated) return `${target.name} breaks free`;
                
                const boundStatuses = target.statuses?.filter(s => s.name.startsWith('bound_')) || [];
                if (boundStatuses.length > 0) {
                    return boundStatuses
                        .map(s => DescriptionManager.getStatusDescription(s.name))
                        .filter(Boolean)
                        .join('. ');
                }
                return DescriptionManager.getStatusDescription('grappled');

            case 'CORRUPT':
                return success 
                    ? `Dark energy courses through ${target.name}`
                    : `${target.name} resists the corruption`;

            case 'STATUS':
                return success 
                    ? DescriptionManager.getStatusDescription(effect.params.type)
                    : `${target.name} resists the effect`;

            case 'END_COMBAT':
                const winner = effect.params.winner;
                return winner 
                    ? `${winner.name} stands triumphant`
                    : 'The confrontation ends';

            default:
                return '';
        }
    }

    private static formatStatus(event: StatusEvent): string {
        const statusName = event.status.name;
        const baseDescription = DescriptionManager.getStatusDescription(statusName)
            ?.replace(/\[.*?\]/g, '')
            .trim() || '';
        
        switch (event.action) {
            case 'ADDED':
                return `${event.target.name} ${baseDescription}`;
            case 'REMOVED':
                return `${event.target.name} is no longer ${statusName.replace(/_/g, ' ')}`;
            case 'STACKS_INCREASED':
                return `The effect on ${event.target.name} intensifies`;
            case 'STACKS_DECREASED':
                return `The effect on ${event.target.name} weakens`;
            default:
                return baseDescription;
        }
    }

    private static formatCombat(event: CombatEvent): string {
        if (event.subtype === 'START') {
            return event.characters?.map(c => {
                const vitalityDesc = DescriptionManager.getVitalityDescription(c.vitality);
                const clothingDesc = DescriptionManager.getClothingDescription(c.clothing);
                return `${c.name} appears ${vitalityDesc} and ${clothingDesc}`;
            }).join('. ') || '';
        }

        const winner = event.winner;
        if (!winner) return 'The battle concludes';
        
        const vitalityDesc = DescriptionManager.getVitalityDescription(winner.vitality);
        const clothingDesc = DescriptionManager.getClothingDescription(winner.clothing);
        return `${winner.name} stands triumphant, ${vitalityDesc} and ${clothingDesc}`;
    }

    private static formatTurn(event: TurnEvent): string {
        return `${event.actor.name} ${DescriptionManager.getVitalityDescription(event.actor.vitality)}`;
    }

    private static formatInitiative(event: InitiativeEvent): string {
        const [result1, result2] = event.results;
        const intensity1 = DescriptionManager.getIntensityFromRoll(result1);
        const intensity2 = DescriptionManager.getIntensityFromRoll(result2);
        const desc1 = DescriptionManager.getSkillDescription('Initiative', intensity1);
        const desc2 = DescriptionManager.getSkillDescription('Initiative', intensity2);
        
        return `${event.characters[0].name} ${desc1}. ` +
               `${event.characters[1].name} ${desc2}. ` +
               `${event.first_actor.name} moves first`;
    }

    private static cleanDescription(description: string): string {
        return description
            .replace(/\[.*?\]/g, '')       // Remove bracketed content
            .replace(/\b\d+\b/g, '')       // Remove standalone numbers
            .replace(/\s+/g, ' ')          // Normalize whitespace
            .replace(/\s+\./g, '.')        // Fix spacing before periods
            .replace(/\s+,/g, ',')         // Fix spacing before commas
            .trim();
    }

    static formatEvent(event: GameEvent): string {
        const description = (() => {
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
                    return '';
            }
        })();

        return this.cleanDescription(description);
    }

    static formatEvents(events: GameEvent[]): string[] {
        const descriptions: string[] = [];
        let i = 0;
        
        while (i < events.length) {
            const event = events[i];
            
            if (event.type === 'ABILITY') {
                // Group ability with its related events
                const abilityEvent = event;
                const relatedEvents: GameEvent[] = [];
                let j = i + 1;
                
                while (j < events.length) {
                    const nextEvent = events[j];
                    if (nextEvent.type === 'SKILL_CHECK' || 
                        nextEvent.type === 'EFFECT' || 
                        nextEvent.type === 'STATUS') {
                        relatedEvents.push(nextEvent);
                        j++;
                    } else {
                        break;
                    }
                }
                
                const descriptions = [
                    this.formatEvent(abilityEvent),
                    ...relatedEvents.map(e => this.formatEvent(e))
                ].filter(Boolean);
                
                if (descriptions.length > 0) {
                    descriptions.push(descriptions.join('. '));
                }
                
                i = j;
            } else {
                const desc = this.formatEvent(event);
                if (desc) {
                    descriptions.push(desc);
                }
                i++;
            }
        }
        
        return descriptions;
    }

    /**
     * Formats character information for LLM consumption
     * Creates a narrative-friendly description of characters for the LLM
     */
    static formatCharactersForLLM(hero: Character, monster: Character): string {
        const formatCharacter = (character: Character, isHero: boolean) => {
            const type = isHero ? 'Hero' : 'Monster';
            const vitalityDesc = DescriptionManager.getVitalityDescription(character.vitality);
            const clothingDesc = DescriptionManager.getClothingDescription(character.clothing);
            
            // Format active statuses
            const statusDescriptions = character.statuses
                .map(status => DescriptionManager.getStatusDescription(status.name))
                .filter(Boolean);
            
            const statusSection = statusDescriptions.length > 0 
                ? `\nCondition: ${statusDescriptions.join(', ')}`
                : '';
                
            return `=== ${type}: ${character.name} ===
Vitality: ${vitalityDesc}
Appearance: ${clothingDesc}${statusSection}
${character.description ? `\n${character.description}` : ''}`;
        };

        return `${formatCharacter(hero, true)}\n\n${formatCharacter(monster, false)}`;
    }
}
