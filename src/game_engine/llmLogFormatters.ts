/**
 * LLMLogFormatters
 * 
 * PURPOSE:
 * Transforms game events into natural language narratives suitable for LLM processing.
 * Focuses on descriptive text without numerical values to maintain narrative immersion.
 * Uses DescriptionManager to ensure consistent vocabulary and theming.
 * Handles all section formatting with headers to ensure consistency.
 */

import { 
    GameEvent,
    SkillCheckEvent,
    AbilityEvent,
    StatusEvent,
    CombatPhaseChangedEvent,
} from '../events/eventTypes';
import { Character } from '../types/actor';
import { DescriptionManager } from './utils/descriptionManager';
import { CharacterType, CombatEndReason} from '../types/constants';
import promptsData from '@assets/descriptions/prompts.json';

export class LLMLogFormatters {
    /**
     * Formats a section with a header, only including the header if content exists
     * @param title The section title
     * @param content The section content
     * @returns Formatted section with header, or empty string if content is empty
     */
    static formatSectionWithHeader(title: string, content: string | string[]): string {
        // If content is an array, join it with newlines
        const contentStr = Array.isArray(content) ? content.join('\n') : content;
        
        // Only include the section if content exists and is not just whitespace
        if (contentStr && contentStr.trim()) {
            return `=== ${title} ===\n${contentStr}`;
        }
        
        // Return empty string if no content
        return '';
    }
    
    /**
     * Formats room description with header
     */
    static formatRoomDescription(description?: string): string {
        return this.formatSectionWithHeader('Room Description', description || '');
    }
    
    /**
     * Formats combat logs with header
     */
    static formatCombatLogs(logs: string[]): string {
        return this.formatSectionWithHeader('Recent Combat Actions', logs);
    }
    
    /**
     * Formats narration settings section
     */
    static formatNarrationSettings(spiceLevel: string, length: string): string {
        const spiceLevelDescription = promptsData.spiceLevels[spiceLevel];
        const lengthDescription = promptsData.lengths[length];
        
        const content = `SPICE LEVEL: ${spiceLevelDescription}\nLENGTH: ${lengthDescription}`;
        return this.formatSectionWithHeader('Narration Settings', content);
    }
    
    /**
     * Formats task section
     */
    static formatTask(task: string): string {
        return this.formatSectionWithHeader('TASK', task);
    }
    
    /**
     * Formats previous narration section
     */
    static formatPreviousNarration(narration: string[]): string {
        return this.formatSectionWithHeader('The Story So Far: ', narration);
    }
    private static formatSkillCheck(event: SkillCheckEvent): string {
        // Handle non-opposed skill checks
        if (!event.is_opposed || !event.opposed_result || !event.target) {
            // Use the intensity directly from the roll result
            const description = DescriptionManager.getSkillDescription(event.skill, event.result.intensity);
            return `${event.actor.name}: ${description}`;
        }
        
        // From here on, we're dealing with opposed skill checks (including initiative)
        
        // Randomly choose between describing from winner's or loser's perspective
        const randomChoice = Math.random() > 0.5;
        
        if (event.opposed_margin === undefined) {
            // If no margin is provided, just use the actor's perspective
            const description = DescriptionManager.getSkillDescription(event.skill, event.result.intensity);
            return `${event.actor.name}: ${description}`;
        }
        
        // Determine winner and loser
        const isActorWinner = event.opposed_margin > 0;
        const winner = isActorWinner ? event.actor : event.target;
        const loser = isActorWinner ? event.target : event.actor;
        
        // Choose perspective based on random choice
        let character, description;
        if (randomChoice) {
            // Winner's perspective with positive margin
            character = winner;
            description = DescriptionManager.getSkillDescriptionFromMargin(
                event.skill, 
                Math.abs(event.opposed_margin)
            );
        } else {
            // Loser's perspective with negative margin
            character = loser;
            description = DescriptionManager.getSkillDescriptionFromMargin(
                event.skill, 
                -Math.abs(event.opposed_margin)
            );
        }
        
        // Special handling for initiative checks - add "moves first" for the winner
        if (event.skill === 'Initiative') {
            return `${winner.name} moves first. ${character.name}: ${description}`;
        }
        
        // Regular opposed skill check
        return `${character.name}: ${description}`;
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
        const baseDescription = DescriptionManager.getStatusDescription(statusName, event.status.stacks);
        
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
            if (!loser) return '';
            
            const vitalityDesc = DescriptionManager.getVitalityDescription(winner.vitality);
            
            // First handle the case where a monster lost
            if (loser.type === 'monster' && event.reason === CombatEndReason.DEATH) {
                return `${loser.name} has retreated from battle. ${winner.name} remains, ${vitalityDesc}.`;
            }
            
            // For other cases, use the original logic
            if (event.reason === CombatEndReason.DEATH) {
                // Heroes can still die
                return `${loser.name} is dead. ${winner.name} stands triumphant, ${vitalityDesc}.`;
            } else if (event.reason === CombatEndReason.BREEDING && loser) {
                return `${winner.name} has bred with ${loser.name} and stands triumphant, ${vitalityDesc}.`;
            } else if (event.reason === CombatEndReason.ESCAPE && loser) {
                return `${loser.name} has escaped. ${winner.name} remains, ${vitalityDesc}.`;
            } else if (event.reason === CombatEndReason.SURRENDER && loser) {
                return `${loser.name} has surrendered. ${winner.name} stands triumphant, ${vitalityDesc}.`;
            }
        } else if (event.subtype === 'ROUND_END') {
            // Skip round end messages
            return '';
        }
        
        return '';
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
                `Appearance: ${DescriptionManager.getArmorDescription(character.armor)}` : '';
            
            // Format active statuses
            const statusDescriptions = character.statuses
                .map(status => DescriptionManager.getStatusDescription(status.name, status.stacks))
                .filter(Boolean);
            
            const statusSection = statusDescriptions.length > 0 
                ? `\nCondition: ${statusDescriptions.join(', ')}`
                : '';
            
            const content = `Vitality: ${vitalityDesc}
${appearanceSection}${statusSection}
${character.description ? `\n${character.description}` : ''}`;
            
            return this.formatSectionWithHeader(`${type}: ${character.name}`, content);
        };

        const heroSection = formatCharacter(hero, true);
        const monsterSection = formatCharacter(monster, false);
        
        // Only include sections if they have content
        const sections = [heroSection, monsterSection].filter(Boolean);
        return sections.join('\n\n');
    }
    
    /**
     * Formats the complete character information section with header
     */
    static formatCharacterInfoSection(hero: Character, monster: Character): string {
        const characterInfo = this.formatCharactersForLLM(hero, monster);
        return characterInfo ? this.formatSectionWithHeader('Character Information', characterInfo) : '';
    }
}
