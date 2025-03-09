import { Character } from '../../types/actor';
import { CombatState } from '../../types/combatState';
import { Trait } from '../../types/abilities';
import { TargetType, CharacterType, BodyPartType } from '../../types/constants';
import { system_actions, default_hero_abilities } from './default_abilities';
import { StatusName } from '../../types/status';

/**
 * Checks if an ability's requirements are met
 * 
 * @param actor - The character attempting to use the ability
 * @param ability - The ability to check requirements for
 * @param state - Current combat state
 * @returns Object with success flag and optional reason for failure
 */
export function checkRequirements(
    actor: Character,
    ability: Trait,
    state: CombatState
): { 
    success: boolean;
    reason?: string;
} {
    // Check if ability is on cooldown
    const cooldownStatus = actor.statuses?.find(s => 
        s.name === StatusName.ABILITY_COOLDOWN && 
        s.sourceAbility === ability.name
    );
    
    if (cooldownStatus) {
        return {
            success: false,
            reason: `On cooldown (${cooldownStatus.duration} turns remaining)`
        };
    }

    // Check body part requirements
    if (ability.requirements?.parts) {
        const requiredParts = ability.requirements.parts;
        
        // Check each required part
        for (const [partType, requiredCount] of Object.entries(requiredParts)) {
            let boundCount = 0;
            
            // Check both specific and generic bound statuses
            if (actor.statuses) {
                // Check specific bound status (e.g. BOUND_ARMS for ARM)
                const specificStatusName = `bound_${partType.toLowerCase()}${partType === BodyPartType.ARM || partType === BodyPartType.LEG ? 's' : ''}`;
                const specificBoundStatus = actor.statuses.find(s => s.name === specificStatusName);
                boundCount += specificBoundStatus?.stacks || 0;

                // Check generic BOUND_MONSTER_PART statuses
                const monsterPartStatuses = actor.statuses.filter(s => 
                    s.name === StatusName.BOUND_MONSTER_PART && 
                    s.params.part === partType
                );
                boundCount += monsterPartStatuses.reduce((total, status) => 
                    total + status.stacks, 0
                );
            }
            
            if (boundCount >= requiredCount) {
                const partName = partType.toLowerCase();
                return {
                    success: false,
                    reason: `Requires ${requiredCount} free ${partName}${requiredCount > 1 ? 's' : ''}. (${boundCount} ${partName}${boundCount > 1 ? 's' : ''} bound)`
                };
            }
        }
    }

    // Check status requirements
    if (ability.requirements?.statuses) {
        for (const requirement of ability.requirements.statuses) {
            // Get the character to check based on the requirement target
            const characterToCheck = requirement.target === 'other' ?
                state.characters.find(c => c.type !== actor.type) :
                actor;

            // Convert enum value back to string for status check
            const status = characterToCheck?.statuses?.find(s => s.name === requirement.name.toLowerCase());
            const currentStacks = status?.stacks || 0;
            if (currentStacks < requirement.stacks) {
                const targetText = requirement.target === 'other' ? 'target' : 'self';
                return {
                    success: false,
                    reason: `Requires ${targetText} to have ${requirement.stacks} stack${requirement.stacks > 1 ? 's' : ''} of ${requirement.name.toLowerCase()}`
                };
            }
        }
    }

    // Check clothing level requirements
    if (ability.requirements?.clothing?.maxLevel !== undefined) {
        // Find target character for this action
        const target = ability.effects.some(e => e.target === 'other') ? 
            state.characters.find(c => c.type !== actor.type) :
            actor;
        
        const clothingLevel = target.armor.current;
        if (clothingLevel > ability.requirements.clothing.maxLevel) {
            return {
                success: false,
                reason: `Requires armor level ${ability.requirements.clothing.maxLevel} or less`
            };
        }
    }
    
    // Check room attribute requirements
    if (ability.requirements?.room_attributes && ability.requirements.room_attributes.length > 0) {
        for (const attrReq of ability.requirements.room_attributes) {
            // First check if the room has attributes defined
            if (!state.room.attributes) {
                return {
                    success: false,
                    reason: `Room attributes not defined`
                };
            }
            
            const attrValue = state.room.attributes[attrReq.attribute];
            
            // If the attribute doesn't exist and we're checking for equality, fail
            if (attrValue === undefined) {
                if (attrReq.comparison === 'eq') {
                    return {
                        success: false,
                        reason: `Requires room with ${attrReq.attribute} = ${attrReq.value}`
                    };
                }
                continue; // Skip other comparisons if attribute doesn't exist
            }
            
            // Compare the attribute value based on the comparison type
            let requirementMet = false;
            switch (attrReq.comparison) {
                case 'eq':
                    requirementMet = attrValue === attrReq.value;
                    break;
                case 'neq':
                    requirementMet = attrValue !== attrReq.value;
                    break;
                case 'lt':
                    requirementMet = attrValue < attrReq.value;
                    break;
                case 'lte':
                    requirementMet = attrValue <= attrReq.value;
                    break;
                case 'gt':
                    requirementMet = attrValue > attrReq.value;
                    break;
                case 'gte':
                    requirementMet = attrValue >= attrReq.value;
                    break;
            }
            
            if (!requirementMet) {
                return {
                    success: false,
                    reason: `Requires room with ${attrReq.attribute} ${attrReq.comparison} ${attrReq.value}`
                };
            }
        }
    }
    
    // All requirements passed
    return { success: true };
}

/**
 * Gets ALL possible actions for a given actor, along with reasons why certain actions might be disabled.
 * available ones. The reasons object indicates which actions should be disabled in the UI and why.
 * 
 * For example:
 * - If an ability is on cooldown, it's still returned in the actions array, but will have an entry
 *   in the reasons object like "On cooldown (2 turns remaining)"
 * - Break Free is always returned for all actors, but has a reason if the actor isn't grappled
 * 
 * The UI uses this information to:
 * 1. Show all possible actions (from the actions array)
 * 2. Disable buttons for actions that have entries in the reasons object
 * 3. Display tooltips explaining why actions are disabled (using the reason text)
 * 
 * @param actor - The character whose actions we're getting
 * @param state - Current combat state
 * @returns Object containing all actions and reasons for disabled ones
 */
export function getAvailableActions(actor: Character, state: CombatState): {
    actions: Trait[];  // ALL possible actions, including disabled ones
    reasons: Record<string, string>;  // Map of action name to reason why it's disabled
} {
    const actions: Trait[] = [];
    const reasons: Record<string, string> = {};

    // If combat is complete, only allow Exit Combat action
    if (state.isComplete) {
        // Add only Pass from system actions
        const passAction = system_actions.exitCombat;
        actions.push(passAction);
        
        // Disable all other system actions
        Object.values(system_actions).forEach((action: Trait) => {
            if (action.name !== system_actions.exitCombat.name) {
                reasons[action.name] = 'Combat is over';
            }
        });
        
        // Add all actor traits but mark them as disabled
        actor.traits.forEach(trait => {
            actions.push(trait);
            reasons[trait.name] = 'Combat is over';
        });
        
        return { actions, reasons };
    }

    // Add all non-passive traits from the actor first
    actor.traits.forEach(trait => {
        // Skip passive abilities - they shouldn't be available as actions
        if (trait.passive) {
            return;
        }
        
        // Check requirements and add reason if they're not met
        const requirementsCheck = checkRequirements(actor, trait, state);
        if (!requirementsCheck.success && requirementsCheck.reason) {
            reasons[trait.name] = requirementsCheck.reason;
        }
        
        // Add the action to the list
        actions.push(trait);
    });

    // Add hero actions if character is a hero
    if (actor.type === CharacterType.HERO) {
        Object.values(default_hero_abilities).forEach(action => {
            actions.push(action);
            
            // Check requirements and add reason if they're not met
            const requirementsCheck = checkRequirements(actor, action, state);
            if (!requirementsCheck.success && requirementsCheck.reason) {
                reasons[action.name] = requirementsCheck.reason;
            }
        });
    }

    if (state.isComplete) {
        actions.push(system_actions.exitCombat);
    }

    // Always add the pass action for monsters
    if (actor.type === CharacterType.MONSTER) {
        actions.push(system_actions.pass);
    }
    // For heroes, add pass only if no other actions are available or all have reasons
    else if ((actions.length === 0) || actions.every(action => reasons[action.name])) {
        actions.push(system_actions.pass);
    }

    return { actions, reasons };
}

// Get actions for current actor (used by combat/AI logic)
export function getCurrentActorActions(state: CombatState) {
    const actor = state.characters[state.activeCharacterIndex];
    return getAvailableActions(actor, state);
}

// Get monster's actions (used to update playerActions)
export function getMonsterActions(state: CombatState) {
    const monster = state.characters.find(c => c.type === CharacterType.MONSTER);
    return monster ? getAvailableActions(monster, state) : { actions: [], reasons: {} };
}
