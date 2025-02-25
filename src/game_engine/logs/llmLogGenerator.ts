/**
 * LLMLogGenerator
 * 
 * PURPOSE:
 * Created to bridge the gap between mechanical game events and natural language processing.
 * This component transforms raw game events into rich, contextual narratives that LLMs can
 * understand and respond to appropriately. This enables more engaging and dynamic AI responses
 * by providing proper context and maintaining narrative consistency.
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
import { DescriptionManager } from '../utils/descriptionManager';

export class LLMLogGenerator {
    private static describeSkillCheck(event: SkillCheckEvent): string {
        const intensity = DescriptionManager.getIntensityFromRoll(event.result);
        const description = DescriptionManager.getSkillDescription(event.skill, intensity);
        
        if (event.is_opposed && event.opposed_result) {
            const opposedIntensity = DescriptionManager.getIntensityFromRoll(event.opposed_result);
            const opposedDescription = DescriptionManager.getSkillDescription(event.skill, opposedIntensity);
            
            if (event.result.success) {
                return `${event.actor.name} ${description}. ${event.target?.name} ${opposedDescription}, but fails to overcome`;
            } else {
                return `${event.actor.name} ${description}. ${event.target?.name} ${opposedDescription}, and prevails`;
            }
        }

        return `${event.actor.name} ${description}`;
    }

    private static describeAbility(event: AbilityEvent): string {
        return event.ability.description;
    }

    private static describeEffect(event: EffectEvent): string {
        const { effect, source, target, success } = event;
        let description = '';

        switch (effect.type) {
            case 'WOUND':
                const vitalityDesc = DescriptionManager.getVitalityDescription(target.vitality);
                description = success ? 
                    `${target.name} ${vitalityDesc}` :
                    `${target.name} evades harm`;
                break;

            case 'HEAL':
                const healVitalityDesc = DescriptionManager.getVitalityDescription(target.vitality);
                description = success ? 
                    `${target.name} ${healVitalityDesc}` :
                    `${target.name} remains unhealed`;
                break;

            case 'GRAPPLE':
                if (success) {
                    const grappleType = effect.params.type || 'grab';
                    const limbType = effect.params.limbType;
                    
                    if (grappleType === 'penetrate') {
                        description = DescriptionManager.getStatusDescription('penetrated');
                    } else if (limbType) {
                        description = DescriptionManager.getStatusDescription(`bound_${limbType.toLowerCase()}`);
                    } else {
                        description = DescriptionManager.getStatusDescription('grappled');
                    }
                } else {
                    description = `${target.name} resists`;
                }
                break;

            case 'MODIFY_CLOTHING':
                description = DescriptionManager.getClothingDescription(target.clothing);
                break;

            case 'BREAK_FREE':
                if (success) {
                    const wasPenetrated = target.statuses?.some(s => s.name === 'penetrated');
                    if (wasPenetrated) {
                        description = `${target.name} breaks free`;
                    } else {
                        const boundStatuses = target.statuses?.filter(s => s.name.startsWith('bound_')) || [];
                        if (boundStatuses.length > 0) {
                            const boundDescriptions = boundStatuses
                                .map(s => DescriptionManager.getStatusDescription(s.name))
                                .filter(Boolean);
                            description = boundDescriptions.join('. ');
                        } else {
                            description = DescriptionManager.getStatusDescription('grappled');
                        }
                    }
                } else {
                    description = DescriptionManager.getStatusDescription('grappled');
                }
                break;

            case 'CORRUPT':
                description = success ? 
                    `Dark energy courses through ${target.name}` :
                    `${target.name} resists the corruption`;
                break;

            case 'STATUS':
                description = success ? 
                    DescriptionManager.getStatusDescription(effect.params.type) :
                    `${target.name} resists the effect`;
                break;

            case 'ADVANCE_TURN':
                description = '';  // Skip turn advancement in narrative
                break;

            case 'END_COMBAT':
                const winner = effect.params.winner;
                description = winner ? 
                    `${winner.name} stands triumphant` :
                    'The confrontation ends';
                break;

            default:
                description = '';
        }

        return description;
    }

    private static describeStatus(event: StatusEvent): string {
        const statusDesc = DescriptionManager.getStatusDescription(event.status.name);
        return statusDesc ? statusDesc.replace(/\[.*?\]/g, '').trim() : '';
    }

    private static describeCombat(event: CombatEvent): string {
        if (event.subtype === 'START') {
            return event.characters?.map(c => {
                const vitalityDesc = DescriptionManager.getVitalityDescription(c.vitality);
                const clothingDesc = DescriptionManager.getClothingDescription(c.clothing);
                return `${c.name} appears ${vitalityDesc} and ${clothingDesc}`;
            }).join('. ') || '';
        } else {
            const winner = event.winner;
            if (!winner) return 'The battle concludes';
            
            const vitalityDesc = DescriptionManager.getVitalityDescription(winner.vitality);
            const clothingDesc = DescriptionManager.getClothingDescription(winner.clothing);
            return `${winner.name} stands triumphant, ${vitalityDesc} and ${clothingDesc}`;
        }
    }

    private static describeTurn(event: TurnEvent): string {
        const vitalityDesc = DescriptionManager.getVitalityDescription(event.actor.vitality);
        return `${event.actor.name} ${vitalityDesc}`;
    }

    private static describeInitiative(event: InitiativeEvent): string {
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
            .replace(/\[.*?\]/g, '')  // Remove bracketed content like [Grace]
            .replace(/\b\d+\b/g, '')  // Remove standalone numbers
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .replace(/\s+\./g, '.')   // Fix spacing before periods
            .replace(/\s+,/g, ',')    // Fix spacing before commas
            .trim();
    }

    static generateEventDescription(event: GameEvent): string {
        const description = (() => {
            switch (event.type) {
                case 'SKILL_CHECK':
                    return this.describeSkillCheck(event);
                case 'ABILITY':
                    return this.describeAbility(event);
                case 'EFFECT':
                    return this.describeEffect(event);
                case 'STATUS':
                    return this.describeStatus(event);
                case 'COMBAT':
                    return this.describeCombat(event);
                case 'TURN':
                    return this.describeTurn(event);
                case 'INITIATIVE':
                    return this.describeInitiative(event);
                default:
                    return '';
            }
        })();

        return this.cleanDescription(description);
    }

    static generateRoundContext(events: GameEvent[]): string[] {
        const descriptions: string[] = [];
        let i = 0;
        
        while (i < events.length) {
            const event = events[i];
            
            if (event.type === 'ABILITY') {
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
                    this.describeAbility(abilityEvent),
                    ...relatedEvents.map(e => this.generateEventDescription(e))
                ].filter(Boolean);
                
                if (descriptions.length > 0) {
                    descriptions.push(descriptions.join('. '));
                }
                
                i = j;
            } else {
                const desc = this.generateEventDescription(event);
                if (desc) {
                    descriptions.push(desc);
                }
                i++;
            }
        }
        
        return descriptions;
    }
}
