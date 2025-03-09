/**
 * This file contains the trait execution functions, separated to avoid circular dependencies
 * between combatEngine.ts and combatLogManager.ts
 */
import { Character } from '../../types/actor';
import { Trait, canTriggerPassive, markPassiveTriggered, targetsOther } from '../../types/abilities';
import { CombatState } from '../../types/combatState';
import { Skills } from '../../types/skilltypes';
import { makeSkillCheck, makeOpposedCheck } from '../utils/skillCheck';
import { applyEffect } from './effect';
import { checkRequirements } from './getAvailableActions';
import { logAndEmitCombatEvent } from './combatLogManager';
import {
    SkillCheckEvent,
    AbilityEvent,
    EffectEvent,
    CombatEvent
} from '../../events/eventTypes';

/**
 * Checks for and executes passive abilities that should trigger in response to an event
 * 
 * @param event The event that was emitted
 * @param state The current combat state
 */
export async function executePassiveAbilities(event: CombatEvent, state: CombatState): Promise<void> {
  // Skip if no characters or no event type
  if (!state.characters || !event.type) return;
  
  // Loop through all characters in combat
  for (const character of state.characters) {
    // Skip if character doesn't have traits
    if (!character.traits || character.traits.length === 0) continue;
    
    // Check each trait to see if it's a passive that should trigger
    for (const trait of character.traits) {
      if (trait.passive && 
          trait.passive_event_type && 
          trait.passive_event_type.type === event.type &&
          // If subtype is specified, check it matches, otherwise accept any subtype
          (!trait.passive_event_type.subtype || 
           (('subtype' in event) && trait.passive_event_type.subtype === event['subtype'])) &&
          canTriggerPassive(trait, state.round)) {
        
        // Determine target based on the trait's effects
        const target = targetsOther(trait) ? 
          state.characters.find(c => c !== character) : 
          undefined;
        
        // Execute the passive trait
        await executeTrait(trait, character, target, state);
        
        // Mark as triggered this round
        markPassiveTriggered(trait, state.round);
      }
    }
  }
}

/**
 * Execute a trait (ability) for a character
 * @param trait The trait to execute
 * @param actor The character executing the trait
 * @param target The target character (if any)
 * @param state The current combat state
 * @returns The updated combat state
 */
export async function executeTrait(
    trait: Trait, 
    actor: Character, 
    target: Character | undefined, 
    state: CombatState
): Promise<CombatState> {    
    // Check requirements before proceeding
    const requirementsCheck = checkRequirements(actor, trait, state);
    
    // Emit ability event with success/failure info
    const abilityEvent: AbilityEvent = {
        type: 'ABILITY',
        actor,
        ability: trait,
        target,
        success: requirementsCheck.success,
        failureReason: !requirementsCheck.success ? requirementsCheck.reason : undefined
    };
    await logAndEmitCombatEvent(abilityEvent, state);
    
    // If requirements aren't met, exit early without applying effects
    if (!requirementsCheck.success) {
        return state;
    }
    
    let skillCheckResult = null;
    let opposedCheck = null;
    
    if (trait.skill!==Skills.NONE){
        // Perform skill check
        // Get modifier from trait
        const modifier = trait.modifier ?? 0;
        
        if (target && target !== actor) {
            // Perform opposed skill check
            opposedCheck = makeOpposedCheck(
                actor, 
                trait.skill,
                target,
                trait.defenseOptions, // Use the defense options from the trait
                modifier
            );
            skillCheckResult = opposedCheck.attacker;
        } else {
            // Perform regular skill check
            skillCheckResult = makeSkillCheck(
                actor, 
                trait.skill,
                modifier
            );
        }
        
        // Emit skill check event
        const skillCheckEvent: SkillCheckEvent = {
            type: 'SKILL_CHECK',
            actor,
            target,
            skill: trait.skill,
            result: skillCheckResult,
            is_opposed: !!target,
            opposed_result: target ? opposedCheck.defender : undefined,
            opposed_margin: target ? opposedCheck.margin : undefined,
            opposed_skill: target ? opposedCheck.defenderSkill : undefined
        };
        await logAndEmitCombatEvent(skillCheckEvent, state);

    }
    // Apply effects based on skill check result
    for (const effect of trait.effects) {
        // For opposed checks, only apply effects if attacker wins or effect should apply on failure
        // For regular checks, apply if successful or if it should apply on failure
        const shouldApplyEffect = 
            effect.applyOnSkillCheckFailure || 
            trait.skill === Skills.NONE || 
            (skillCheckResult.success && 
             (!target || !trait.defenseOptions || trait.defenseOptions.length === 0 || 
              (opposedCheck && opposedCheck.attackerWins)));
              
        if (shouldApplyEffect) {
            // Use effect's target to determine who to apply it to
            const effectTarget = effect.target === 'other' ? target : actor;
            const effectResult = await applyEffect(effect, actor, effectTarget, state);
            
            // Emit effect event
            const effectEvent: EffectEvent = {
                type: 'EFFECT',
                effect,
                source: actor,
                target: effectTarget,
                success: effectResult.success
            };
            await logAndEmitCombatEvent(effectEvent, state);
        }
    }
    return state;
}
