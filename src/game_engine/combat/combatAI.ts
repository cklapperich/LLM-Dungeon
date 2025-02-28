import { CombatState } from '../../types/combatState';
import { Trait } from '../../types/abilities';
import { Character, getCombinedModifiers, getAttributeValue, getSkillModifier } from '../../types/actor';
import { getAvailableActions } from './getAvailableActions';
import { system_actions, default_hero_abilities} from './default_abilities';
import { EffectType } from '../../types/constants';
import { getSkillAttribute } from '../../types/skilltypes';

// Get an action for the AI to take, prioritizing escape if grappled
export function getAIAction(actor: Character, state: CombatState): Trait {
    // Get all available actions and filter out disabled ones first
    const { actions, reasons } = getAvailableActions(actor, state);
    const availableActions = actions.filter(action => !(action.name in reasons));
    const {breakFree, slipFree} = default_hero_abilities

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
            // Choose random break free trait
            const randomIndex = Math.floor(Math.random() * breakFreeTraits.length);
            return breakFreeTraits[randomIndex];
        }
        
        // If no break free traits, check system actions
        const breakFree = availableActions.find(action => action.name === breakFree.name);
        const slipFree = availableActions.find(action => action.name === slipFree.name);
        
        if (breakFree || slipFree) {
            const modifiers = getCombinedModifiers(actor.statuses);
            
            // Calculate total modifier for Break Free
            let breakFreeTotal = 0;
            if (breakFree) {
                const breakFreeAttr = getSkillAttribute(breakFree.skill);
                breakFreeTotal = getAttributeValue(actor, breakFreeAttr) + // Base attribute
                                getSkillModifier(actor, breakFree.skill) + // Skill modifier
                                (modifiers.attribute_modifiers[breakFreeAttr.toLowerCase()] || 0) + // Attribute modifier from status
                                breakFree.modifier; // Action's own modifier
            }
            
            // Calculate total modifier for Slip Free
            let slipFreeTotal = 0;
            if (slipFree) {
                const slipFreeAttr = getSkillAttribute(slipFree.skill);
                slipFreeTotal = getAttributeValue(actor, slipFreeAttr) +
                               getSkillModifier(actor, slipFree.skill) +
                               (modifiers.attribute_modifiers[slipFreeAttr.toLowerCase()] || 0) +
                               slipFree.modifier;
            }
            
            // Return the action with better total modifier
            if (breakFreeTotal >= slipFreeTotal) {
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

    const randomIndex = Math.floor(Math.random() * normalActions.length);
    return normalActions[randomIndex];
}
