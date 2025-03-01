import { CombatState } from '../../types/combatState';
import { Trait } from '../../types/abilities';
import { Character, getCombinedModifiers, getAttributeValue, getSkillModifier } from '../../types/actor';
import { getAvailableActions } from './getAvailableActions';
import { system_actions, default_hero_abilities} from './default_abilities';
import { EffectType } from '../../types/constants';
import { getSkillAttribute, Attribute, SkillName } from '../../types/skilltypes';
import { Skills } from '../../types/skilltypes';

/**
 * Get the modified attribute value for a character, including status effects
 * 
 * @param actor - The character to get the attribute value for
 * @param attributeName - The name of the attribute (Might, Grace, Wit, Will)
 * @returns The modified attribute value
 */
function getModifiedAttributeValue(actor: Character, attributeName: Attribute): number {
    const modifiers = getCombinedModifiers(actor.statuses);
    const baseValue = getAttributeValue(actor, attributeName);
    const statusModifier = modifiers.attribute_modifiers[attributeName.toLowerCase()] || 0;
    
    return baseValue + statusModifier;
}

/**
 * Get the modified skill value for a character, including attribute and status effects
 * 
 * @param actor - The character to get the skill value for
 * @param skill - The skill to get the value for
 * @returns The modified skill value
 */
function getModifiedSkillValue(actor: Character, skill: SkillName): number {
    const attributeName = getSkillAttribute(skill);
    const attributeValue = getModifiedAttributeValue(actor, attributeName);
    const skillModifier = getSkillModifier(actor, skill);
    
    return attributeValue + skillModifier;
}

/**
 * Get the total effectiveness value for an action, including attribute, skill, and action modifiers
 * 
 * @param actor - The character performing the action
 * @param action - The action to evaluate
 * @returns The total effectiveness value
 */
function getActionEffectiveness(actor: Character, action: Trait): number {
    if (!action) return 0;
    
    const skillValue = getModifiedSkillValue(actor, action.skill);
    const actionModifier = action.modifier || 0;
    
    return skillValue + actionModifier;
}

// Get an action for the AI to take, prioritizing escape if grappled
export function getAIAction(actor: Character, state: CombatState): Trait {
    // Get all available actions and filter out disabled ones first
    const { actions, reasons } = getAvailableActions(actor, state);
    const availableActions = actions.filter(action => !(action.name in reasons));

    // Check if grappled
    const isGrappled = actor.statuses?.some(s => s.name === 'grappled');
    
    if (isGrappled) {
        // First check actor's own traits for BREAK_FREE effects
        const breakFreeTraits = availableActions.filter(action =>
            // Only consider non-system actions that have BREAK_FREE effect
            !Object.values(system_actions).some(sysAction => sysAction.name === action.name) &&
            action.effects.some(effect => effect.type === EffectType.BREAK_FREE)

        );
        if (breakFreeTraits.length > 0) {
            // now choose a random one from the list of break free traits
            return breakFreeTraits[Math.floor(Math.random() * breakFreeTraits.length)];
        }
        // If no break free traits, check hero actions
        const breakFreeAction = default_hero_abilities.breakFree;
        const slipFreeAction = default_hero_abilities.slipFree;
        
        // Find these actions in the available actions list
        const breakFree = availableActions.find(action => action.name === breakFreeAction.name);
        const slipFree = availableActions.find(action => action.name === slipFreeAction.name);
        
        if (breakFree || slipFree) {
            // Calculate effectiveness of each action
            const breakFreeEffectiveness = getActionEffectiveness(actor, breakFree);
            const slipFreeEffectiveness = getActionEffectiveness(actor, slipFree);
            
            // Return the action with better effectiveness
            if (breakFreeEffectiveness >= slipFreeEffectiveness) {
                return breakFree || slipFree; // Fallback to slip if break not available
            } else {
                return slipFree || breakFree; // Fallback to break if slip not available
            }
        }
    }

    // Filter to just non-system, available actions
    const normalActions = availableActions.filter(action =>
        !Object.values(system_actions).some(sysAction => sysAction.name === action.name)
    );

    if (normalActions.length === 0) {
        return system_actions.pass;
    }

    // Calculate effectiveness for each action
    const actionEffectiveness = normalActions.map(action => ({
        action,
        effectiveness: getActionEffectiveness(actor, action)
    }));
    
    // Ensure all effectiveness values are positive for weighting
    // Find the minimum effectiveness
    const minEffectiveness = Math.min(...actionEffectiveness.map(a => a.effectiveness));
    
    // Add an offset to make all values positive if needed
    const offset = minEffectiveness < 0 ? Math.abs(minEffectiveness) + 1 : 0;
    
    // Calculate total weight for weighted random selection
    const totalWeight = actionEffectiveness.reduce(
        (sum, a) => sum + (a.effectiveness + offset), 
        0
    );
    
    // Select an action using weighted random selection
    let randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const { action, effectiveness } of actionEffectiveness) {
        cumulativeWeight += (effectiveness + offset);
        if (randomValue <= cumulativeWeight) {
            return action;
        }
    }
    
    // Fallback to the last action if something goes wrong
    return normalActions[normalActions.length - 1];
}
