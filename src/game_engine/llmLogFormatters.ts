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
import promptsData from '@assets/descriptions/prompts.json';

export class LLMLogFormatters {
  /**
   * Formats a section with a header, only including the header if content exists
   * @param title The section title
   * @param content The section content
   * @returns Formatted section with header, or empty string if content is empty
   */
  static formatSectionWithHeader(title: string, content: string | string[]): string {
      const contentStr = Array.isArray(content) ? content.join('\n') : content;
      
      if (contentStr && contentStr.trim()) {
          return `## ${title}\n${contentStr}`;
      }
      
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
  static formatCombatLogs(logs: string): string {
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
  /**
   * Formats a combat start event
   * @param event The combat start event to format
   * @returns Formatted string for the combat start event
   */
  static formatCombatStartEvent(event: CombatPhaseChangedEvent): string {
      let formattedOutput: string[] = [];
      
      // Format combat start header
      formattedOutput.push(`## COMBAT BEGINS`);
      
      // Add any relevant combat start text
      const roomName = event.room?.name || "the area";
      const participants = event.characters?.map(c => c.name).join(" and ") || "the combatants";
      
      formattedOutput.push(`* ${participants} prepare for battle in ${roomName}.`);
      
      // Join the array of strings into a single string with newlines
      return formattedOutput.join('\n');
  }
  
  /**
   * Formats a combat end event
   * @param event The combat end event to format
   * @returns Formatted string for the combat end event
   */
  static formatCombatEndEvent(event: CombatPhaseChangedEvent): string {
      let formattedOutput: string[] = [];
      
      // Format combat end header
      formattedOutput.push(`### COMBAT ENDS`);
      
      // Get the loser and winner
      const loser = event.loser;
      const winner = event.winner;
      
      if (loser && winner) {
          // Check if the loser is a monster by looking at its type property
          if (loser.type === 'monster') {
              // If the loser is a monster, describe retreat instead of death
              formattedOutput.push(`* ${loser.name} has been defeated and retreats from the battle.`);
              formattedOutput.push(`* ${winner.name} stands victorious as ${loser.name} flees.`);
          } else {
              // If the hero is defeated, still use death terminology
              formattedOutput.push(`* ${loser.name} has been defeated by ${winner.name}.`);
          }
      }
      
      // Join the array of strings into a single string with newlines
      return formattedOutput.join('\n');
  }
  
  /**
   * Formats events for a single round, excluding combat start and end events
   * @param events The events to format
   * @returns Formatted string for the events
   */
  static formatEventsForSingleRound(events: GameEvent[]): string {
      let formattedOutput: string[] = [];
      let currentRound = null;
      let currentActor = null;
      let inInitiativePhase = false;
      let combatHasEnded = false;
      
      events.forEach(event => {
        // Skip combat start and end events - these are handled separately
        if (event.type === 'PHASECHANGE' && (event.subtype === 'START' || event.subtype === 'END')) {
          // If it's an END event, mark combat as ended to prevent round end messages
          if (event.subtype === 'END') {
            combatHasEnded = true;
          }
          return;
        }
        
        // Handle round start
        if (event.type === 'PHASECHANGE' && event.subtype === 'ROUND_START') {
          currentRound = event.round;
          currentActor = null;
          inInitiativePhase = true;
          formattedOutput.push(`## ROUND ${currentRound}`);
          return;
        }
        
        // Handle initiative phase
        if (inInitiativePhase && event.type === 'SKILL_CHECK' && event.skill === 'Initiative') {
          if (!formattedOutput.includes("### INITIATIVE")) {
            formattedOutput.push("### INITIATIVE");
          }
          
          // Determine winner (who moves first)
          const isActorWinner = event.opposed_margin > 0;
          const winner = isActorWinner ? event.actor : event.target;
          
          // Add "X moves first" bullet
          formattedOutput.push(`* ${winner.name} moves first.`);
          
          // Randomly choose a perspective for the description (keep existing random choice)
          const randomChoice = Math.random() > 0.5;
          const perspective = randomChoice ? winner : (isActorWinner ? event.target : event.actor);
          
          // Get appropriate description
          const margin = randomChoice ? 
            Math.abs(event.opposed_margin) : 
            -Math.abs(event.opposed_margin);
          
          const description = DescriptionManager.getSkillDescriptionFromMargin(
            'Initiative', margin
          );
          
          // Add description bullet
          formattedOutput.push(`* ${perspective.name}: ${description}`);
          
          return;
        }
        
        // End initiative phase when appropriate
        if (inInitiativePhase && !(event.type === 'SKILL_CHECK' && event.skill === 'Initiative')) {
          inInitiativePhase = false;
        }
        
        // Handle actor turns
        if (event.type === 'ABILITY' && event.actor?.name && event.actor.name !== currentActor) {
          currentActor = event.actor.name;
          formattedOutput.push(`### ${currentActor.toUpperCase()}'S TURN`);
        }
        
        // Handle different event types
        switch (event.type) {
          case 'ABILITY': {
              const abilityEvent = event as AbilityEvent;
              const ability = abilityEvent.ability;
              
              // Add ability header with appropriate verb based on success
              const actionVerb = abilityEvent.success === false ? "attempts to use" : "uses";
              formattedOutput.push(`* **Ability**: ${ability.name}`);
              
              // Add description with success/failure context
              if (abilityEvent.success === false) {
                formattedOutput.push(`  * ${abilityEvent.actor.name} attempts to ${ability.description}, but fails.`);
                if (abilityEvent.failureReason) {
                  formattedOutput.push(`  * Reason: ${abilityEvent.failureReason}`);
                }
              } else {
                formattedOutput.push(`  * ${ability.description}`);
              }
              
              break;
            }
          
          case 'SKILL_CHECK': {
            if ((event as SkillCheckEvent).skill === 'Initiative') break; // Already handled
            
            // Use the established formatSkillCheck function directly
            const skillCheckText = this.formatSkillCheck(event as SkillCheckEvent);
            formattedOutput.push(`  * ${skillCheckText}`);
            break;
          }
          
          case 'STATUS': {
            const statusEvent = event as StatusEvent;
            const statusName = statusEvent.status.name;
            const maxStacks = statusEvent.status.max_stacks || statusEvent.status.stacks;
            
            let statusText = "";
            
            switch (statusEvent.action) {
              case 'ADDED':
                const baseDescription = DescriptionManager.getStatusDescription(statusName, statusEvent.status.stacks);
                if (baseDescription) {
                  statusText = `${statusEvent.target.name} ${baseDescription} (${statusName}: ${statusEvent.status.stacks}/${maxStacks})`;
                }
                break;
              case 'REMOVED':
                statusText = `${statusEvent.target.name} is no longer affected by ${statusName.replace(/_/g, ' ')}`;
                break;
              case 'STACKS_INCREASED':
                statusText = `${statusEvent.target.name}'s ${statusName} intensifies (${statusEvent.status.stacks}/${maxStacks})`;
                break;
              case 'STACKS_DECREASED':
                statusText = `${statusEvent.target.name}'s ${statusName} weakens (${statusEvent.status.stacks}/${maxStacks})`;
                break;
            }
            
            if (statusText) {
              formattedOutput.push(`  * ${statusText}`);
            }
            
            break;
          }
          
          case 'PHASECHANGE': {
            const phaseEvent = event as CombatPhaseChangedEvent;
            
            // Only handle ROUND_END events here, START and END are handled separately
            if (phaseEvent.subtype === 'ROUND_END' && !combatHasEnded) {
              // Only show round end message if combat hasn't ended
              formattedOutput.push(`### END OF ROUND`);
              
              // Add any relevant round-end text
              const roomName = phaseEvent.room?.name || "the area";
              const participants = phaseEvent.characters?.map(c => c.name).join(", ") || "the combatants";
              
              formattedOutput.push(`* ${participants} reassess their positions in ${roomName}.`);
            }
            break;
          }
        }
      });
      
      // Join the array of strings into a single string with newlines
      return formattedOutput.join('\n');
  }

  /**
   * Formats character information for LLM consumption
   * Creates a narrative-friendly description of characters for the LLM
   */
  static formatCharactersForLLM(hero: Character, monster: Character): string {
      const formatCharacter = (character: Character, isHero: boolean) => {
          const type = isHero ? 'Hero' : 'Monster';
          const vitalityDesc = DescriptionManager.getVitalityDescription(character.vitality);
          
          const contentLines = [
              `**Vitality**: ${vitalityDesc}`
          ];
          
          // Only include clothing description for heroes, not monsters
          if (isHero) {
              contentLines.push(`**Appearance**: ${DescriptionManager.getArmorDescription(character.armor)}`);
          }
          
          // Format active statuses
          const statusDescriptions = character.statuses
              .map(status => DescriptionManager.getStatusDescription(status.name, status.stacks))
              .filter(Boolean);
          
          if (statusDescriptions.length > 0) {
              contentLines.push(`**Condition**: ${statusDescriptions.join(', ')}`);
          }
          
          if (character.description) {
              contentLines.push(`\n${character.description}`);
          }
          
          return `### ${type}: ${character.name}\n${contentLines.join('\n')}`;
      };
  
      const heroSection = formatCharacter(hero, true);
      const monsterSection = formatCharacter(monster, false);
      
      // Only include sections if they have content
      const sections = [heroSection, monsterSection].filter(Boolean);
      return sections.join('\n\n');
  }
}
