import { Character } from '../../types/actor';
import { CombatState } from '../../types/combatState';
import { Trait } from '../../types/abilities';
import { TargetType, CharacterType, BodyPartType } from '../../types/constants';
import { system_actions, hero_actions } from './default_abilities';
import { StatusName } from '../../types/status';

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
 * @param gameState - Overall game state
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

    // Add all traits from the actor first
    actor.traits.forEach(trait => {
        // Check if ability is on cooldown
        const cooldownStatus = actor.statuses?.find(s => 
            s.name === StatusName.ABILITY_COOLDOWN && 
            s.sourceAbility === trait.name
        );
        
        if (cooldownStatus) {
            reasons[trait.name] = `On cooldown (${cooldownStatus.duration} turns remaining)`;
        }

        // Check body part requirements
        if (trait.requirements?.parts) {
            const requiredParts = trait.requirements.parts;
            
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
                    reasons[trait.name] = `Requires ${requiredCount} free ${partName}${requiredCount > 1 ? 's' : ''}. (${boundCount} ${partName}${boundCount > 1 ? 's' : ''} bound)`;
                }
            }
        }

        // Check status requirements
        if (trait.requirements?.statuses) {
            for (const requirement of trait.requirements.statuses) {
                // Get the character to check based on the requirement target
                const characterToCheck = requirement.target === 'other' ?
                    state.characters.find(c => c.type !== actor.type) :
                    actor;

                // Convert enum value back to string for status check
                const status = characterToCheck?.statuses?.find(s => s.name === requirement.name.toLowerCase());
                const currentStacks = status?.stacks || 0;
                if (currentStacks < requirement.stacks) {
                    const targetText = requirement.target === 'other' ? 'target' : 'self';
                    reasons[trait.name] = `Requires ${targetText} to have ${requirement.stacks} stack${requirement.stacks > 1 ? 's' : ''} of ${requirement.name.toLowerCase()}`;
                }
            }
        }

        // Check clothing level requirements
        if (trait.requirements?.clothing?.maxLevel !== undefined) {
            // Find target character for this action
            const target = trait.effects.some(e => e.target === 'other') ? 
                state.characters.find(c => c.type !== actor.type) :
                actor;
            
            const clothingLevel = target?.clothing || 0;
            if (clothingLevel > trait.requirements.clothing.maxLevel) {
                reasons[trait.name] = `Requires clothing level ${trait.requirements.clothing.maxLevel} or less`;
            }
        }
        
        // Always add the action to the list
        actions.push(trait);
    });

    // Add hero actions if character is a hero
    if (actor.type === CharacterType.HERO) {
        Object.values(hero_actions).forEach(action => {
            actions.push(action);
        });
    }

    if (state.isComplete) {
        actions.push(system_actions.exitCombat);
    }

    // if every action has a reason or if length is 0, push the system action 'pass'
    if ((actions.length === 0) || actions.every(action => reasons[action.name])) {
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
