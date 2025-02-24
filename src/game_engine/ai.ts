import { GameState } from '../types/gamestate';
import { CombatState } from '../types/combatState';
import { Trait } from '../types/abilities';
import { Character } from '../types/actor';
import { getAvailableActions } from './getAvailableActions';
import { system_actions } from './default_abilities';

// Get a random action for the AI to take, excluding system actions
export function getAIAction(actor: Character, state: CombatState, gameState: GameState): Trait {
    const { actions, reasons } = getAvailableActions(actor, state, gameState);
    
    // Filter out system actions and disabled actions
    const availableActions = actions.filter(action => 
        !Object.values(system_actions).some(sysAction => sysAction.name === action.name) && 
        !(action.name in reasons)
    );

    if (availableActions.length === 0) {
        // If no trait actions available, use PASS action
        return system_actions.pass;
    }

    // Select random action from available actions
    const randomIndex = Math.floor(Math.random() * availableActions.length);
    return availableActions[randomIndex];
}
