import { Character } from '../types/actor';
import { GameState, getCharactersFromIdList } from '../types/gamestate';
import { CombatState } from '../types/combatState';
import { Trait } from '../types/abilities';
import { TargetType, CharacterType, BodyPartType } from '../types/constants';
import { system_actions } from './default_abilities';
import { StatusName } from '../types/status';

/**
 * Gets ALL possible actions for a given actor, along with reasons why certain actions might be disabled.
 * 
 * IMPORTANT: This function returns ALL actions the actor could potentially take, not just currently
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
export function getAvailableActions(actor: Character, state: CombatState, gameState: GameState): {
    actions: Trait[];  // ALL possible actions, including disabled ones
    reasons: Record<string, string>;  // Map of action name to reason why it's disabled
} {
    console.log('Actor state in getLegalActions:', {
        name: actor.name,
        type: actor.type,
        traits: actor.traits.map(t => t.name),
        vitality: actor.vitality,
        conviction: actor.conviction
    });
    
    const actions: Trait[] = [];
    const reasons: Record<string, string> = {};

    // If combat is complete, only allow Pass action
    if (state.isComplete) {
        // Add only Pass from system actions
        const passAction = system_actions.pass;
        actions.push(passAction);
        
        // Disable all other system actions
        Object.values(system_actions).forEach((action: Trait) => {
            if (action.name !== 'Pass') {
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

    // Add system actions (only if combat is not complete)
    Object.values(system_actions).forEach((action: Trait) => {
        // Check if action is break free related
        if (action.name === 'Break Free' || action.name === 'Slip Free') {
            // Only add if character is grappled
            const isGrappled = actor.statuses?.some(status => status.name === StatusName.GRAPPLED);
            if (!isGrappled) {
                reasons[action.name] = 'Can only be used while grappled';
                return;
            }
        }
        
        if (action.name === 'Retreat') {
            reasons[action.name] = 'Cannot retreat during combat';
        }
        
        actions.push(action);
    });

    // Add all traits from the actor
    actor.traits.forEach(trait => {
        console.log('Processing trait:', trait.name);
        
        // Check if ability is on cooldown
        const cooldownStatus = actor.statuses?.find(s => 
            s.name === StatusName.ABILITY_COOLDOWN && 
            s.sourceAbility === trait.name
        );
        
        if (cooldownStatus) {
            console.log('Trait on cooldown:', trait.name);
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
                    getCharactersFromIdList(state.characterIds, gameState).find(c => c.type !== actor.type) :
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
                getCharactersFromIdList(state.characterIds, gameState).find(c => c.type !== actor.type) :
                actor;
            
            const clothingLevel = target?.clothing || 0;
            if (clothingLevel > trait.requirements.clothing.maxLevel) {
                reasons[trait.name] = `Requires clothing level ${trait.requirements.clothing.maxLevel} or less`;
            }
        }
        
        // Always add the action to the list
        actions.push(trait);
    });

    console.log('Final actions:', actions.map(a => a.name));
    console.log('Reasons:', reasons);
    return { actions, reasons };
}

// Get actions for current actor (used by combat/AI logic)
export function getCurrentActorActions(state: CombatState, gameState: GameState) {
    const actor = getCharactersFromIdList(state.characterIds, gameState)[state.activeCharacterIndex];
    return getAvailableActions(actor, state, gameState);
}

// Get monster's actions (used to update playerActions)
export function getMonsterActions(state: CombatState, gameState: GameState) {
    const monster = getCharactersFromIdList(state.characterIds, gameState).find(c => c.type === CharacterType.MONSTER);
    console.log('Getting monster actions for:', monster?.name);
    return monster ? getAvailableActions(monster, state, gameState) : { actions: [], reasons: {} };
}
