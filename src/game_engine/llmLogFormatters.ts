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
    StatusEvent,
    CombatPhaseChangedEvent,
    InitiativeEvent,
    CombatStartEndEvent
} from '../events/eventTypes';
import { Character } from '../types/actor';
import { DescriptionManager } from './utils/descriptionManager';
import { CharacterType, CombatEndReason} from '../types/constants';

export class LLMLogFormatters {
    private static formatSkillCheck(event: SkillCheckEvent): string {
        const intensity = DescriptionManager.getIntensityFromRoll(event.result);
        const description = DescriptionManager.getSkillDescription(event.skill, intensity);
        
        if (event.is_opposed && event.opposed_result) {
            const opposedIntensity = DescriptionManager.getIntensityFromRoll(event.opposed_result);
            const opposedDescription = DescriptionManager.getSkillDescription(event.skill, opposedIntensity);
            
            return event.result.success
                ? `${event.actor.name}: ${description}`
                : `${event.actor.name}: ${description}`;
        }
 
        return `${event.actor.name}: ${description}`;
    }

    private static formatAbility(event: AbilityEvent): string {
        const target = event.target?.name ?? "itself";
        
        // Check if the ability failed due to requirements not being met
        if (event.success === false && event.failureReason) {
            return `${event.actor.name} tries to use ${event.ability.description} on ${target}, but fails: ${event.failureReason}`;
        }
        
        return `${event.actor.name} uses ${event.ability.description} on ${target}`;
    }

    private static formatStatus(event: StatusEvent): string {
        const statusName = event.status.name;
        const baseDescription = DescriptionManager.getStatusDescription(statusName)

        switch (event.action) {
            case 'ADDED':
                // dont log a status if no description
                return baseDescription ? `${event.target.name} ${baseDescription}` : null;
            case 'REMOVED':
                return `${event.target.name} is no longer ${statusName.replace(/_/g, ' ')}`;
            case 'STACKS_INCREASED':
                return `The effect on ${event.target.name} intensifies`;
            case 'STACKS_DECREASED':
                return `The effect on ${event.target.name} weakens`;
            default:
                return null;
        }
    }

    private static formatCombatPhaseChange(event: CombatPhaseChangedEvent): string {
        if (event.subtype === 'START') {
            // character vitality and clothing descriptions should be handled by
            // this.formatCharactersForLLM - no need to do anything here.
            return '';
        } else if (event.subtype === 'END') {
            const winner = event.winner;
            if (!winner) return '';
            
            // Determine the loser from the event characters
            const loser = event.characters?.find(c => c.id !== winner.id);
            
            const vitalityDesc = DescriptionManager.getVitalityDescription(winner.vitality);
            const clothingDesc = DescriptionManager.getClothingDescription(winner.clothing);
            
            // Check for specific combat end reasons
            if (event.reason === CombatEndReason.DEATH && loser) {
                return `${loser.name} is dead. ${winner.name} stands triumphant, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.BREEDING && loser) {
                return `${winner.name} has bred with ${loser.name} and stands triumphant, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.ESCAPE && loser) {
                return `${loser.name} has escaped. ${winner.name} remains, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.SURRENDER && loser) {
                return `${loser.name} has surrendered. ${winner.name} stands triumphant, ${vitalityDesc}`;
            }
            
            // Default message for other reasons
            let result = `${winner.name} stands triumphant, ${vitalityDesc}`;
            if (winner.type !== CharacterType.MONSTER) {
                result += ` and ${clothingDesc}`;
            }
        return result;
    } else if (event.subtype === 'ROUND_END') {
        // Skip round end messages
        return '';
    }
    
    return '';
}

    private static formatCombatStateChange(event: CombatStartEndEvent): string {
        if (event.subtype === 'START') {
            return event.characters?.map(c => {
                const vitalityDesc = DescriptionManager.getVitalityDescription(c.vitality);
                const clothingDesc = c.type !== CharacterType.MONSTER ? 
                    ` and ${DescriptionManager.getClothingDescription(c.clothing)}` : '';
                return `${c.name} appears ${vitalityDesc}${clothingDesc}`;
            }).join('. ') || '';
        } else if (event.subtype === 'END') {
            const winner = event.winner;
            if (!winner) return '';
            
            // Determine the loser from the event characters
            const loser = event.characters?.find(c => c.id !== winner.id);
            
            const vitalityDesc = DescriptionManager.getVitalityDescription(winner.vitality);
            const clothingDesc = DescriptionManager.getClothingDescription(winner.clothing);
            
            // Check for specific combat end reasons
            if (event.reason === CombatEndReason.DEATH && loser) {
                return `${loser.name} is dead. ${winner.name} stands triumphant, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.BREEDING && loser) {
                return `${winner.name} has bred with ${loser.name} and stands triumphant, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.ESCAPE && loser) {
                return `${loser.name} has escaped. ${winner.name} remains, ${vitalityDesc}`;
            } else if (event.reason === CombatEndReason.SURRENDER && loser) {
                return `${loser.name} has surrendered. ${winner.name} stands triumphant, ${vitalityDesc}`;
            }
            
            // Default message for other reasons
            let result = `${winner.name} stands triumphant, ${vitalityDesc}`;
            if (winner.type !== CharacterType.MONSTER) {
                result += ` and ${clothingDesc}`;
            }
            return result;
        }
        
        return '';
    }

    private static formatInitiative(event: InitiativeEvent): string {
        const [result1, result2] = event.results;
        const intensity1 = DescriptionManager.getIntensityFromRoll(result1);
        const intensity2 = DescriptionManager.getIntensityFromRoll(result2);
        const desc1 = DescriptionManager.getSkillDescription('Initiative', intensity1);
        const desc2 = DescriptionManager.getSkillDescription('Initiative', intensity2);
        
        return `${event.characters[0].name}: ${desc1}. ` +
               `${event.characters[1].name}: ${desc2}. ` +
               `${event.first_actor.name} moves first`;
    }

    static formatEvent(event: GameEvent): string {
        if (!event) {
            console.error('formatEvent received undefined or null event');
            return 'ERROR: Missing event';
        }

        // Use a type assertion to ensure TypeScript recognizes event as GameEvent
        const gameEvent = event as GameEvent;
        
        // Ensure event has a valid type before using it
        if (!gameEvent.type) {
            console.error('Event missing type property:', gameEvent);
            return 'ERROR: Event missing type';
        }

        const description = (() => {
            switch (gameEvent.type) {
                case 'SKILL_CHECK':
                    return this.formatSkillCheck(gameEvent as SkillCheckEvent);
                case 'ABILITY':
                    return this.formatAbility(gameEvent as AbilityEvent);
                case 'EFFECT':
                    return '';
                case 'STATUS':
                    return this.formatStatus(gameEvent as StatusEvent);
                case 'PHASECHANGE':
                    return this.formatCombatPhaseChange(gameEvent as CombatPhaseChangedEvent);
                case 'INITIATIVE':
                    return this.formatInitiative(gameEvent as InitiativeEvent);
                default:
                    console.error('Unknown event type:', event.type, event);
                    return '';
            }
        })();

        // Log if we're returning an empty string or just a character name
        if (!description) {
            console.error('Empty description for event:', event);
        } else if (description.match(/^[A-Za-z\s]+$/)) {
            console.error('Description contains only a name for event:', event, description);
        }

        return description;
    }

    static formatEvents(events: GameEvent[]): string[] {
        if (!events || !Array.isArray(events)) {
            console.error('formatEvents received invalid events:', events);
            return ['ERROR: Invalid events array'];
        }

        // Simply process each event in order and filter out empty descriptions
        return events
            .map(event => {
                if (!event) {
                    console.error('Null or undefined event');
                    return null;
                }
                
                // Skip EFFECT events - they should return empty strings
                if (event.type === 'EFFECT') {
                    return null;
                }
                
                const desc = this.formatEvent(event);
                if (!desc || desc.trim() === '') {
                    console.error('Empty or whitespace-only description for event:', event);
                    return null;
                }
                
                // Log if we're returning just a character name
                if (desc.match(/^[A-Za-z\s]+$/)) {
                    console.error('Description contains only a name for event:', event, desc);
                }
                
                return desc;
            })
            .filter(Boolean) as string[];
    }

    /**
     * Formats character information for LLM consumption
     * Creates a narrative-friendly description of characters for the LLM
     */
    static formatCharactersForLLM(hero: Character, monster: Character): string {
        const formatCharacter = (character: Character, isHero: boolean) => {
            const type = isHero ? 'Hero' : 'Monster';
            const vitalityDesc = DescriptionManager.getVitalityDescription(character.vitality);
            
            // Only include clothing description for heroes, not monsters
            const appearanceSection = isHero ? 
                `Appearance: ${DescriptionManager.getClothingDescription(character.clothing)}` : '';
            
            // Format active statuses
            const statusDescriptions = character.statuses
                .map(status => DescriptionManager.getStatusDescription(status.name))
                .filter(Boolean);
            
            const statusSection = statusDescriptions.length > 0 
                ? `\nCondition: ${statusDescriptions.join(', ')}`
                : '';
                
            return `=== ${type}: ${character.name} ===
Vitality: ${vitalityDesc}
${appearanceSection}${statusSection}
${character.description ? `\n${character.description}` : ''}`;
        };

        return `${formatCharacter(hero, true)}\n\n${formatCharacter(monster, false)}`;
    }
}
