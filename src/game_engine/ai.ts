import { CombatState, GameState } from '../types/gamestate';
import { UIAction } from '../react_ui/types/uiTypes';
import { getCurrentActorActions } from './combat';

// Get a random action for the AI to take, excluding system actions
export function getAIAction(state: CombatState, gameState: GameState): UIAction {
    // Get current actor's actions and filter out system actions
    const availableActions = getCurrentActorActions(state, gameState).filter(
        action => action.category !== 'system'
    );

    if (availableActions.length === 0) {
        // If no trait actions available, use PASS action
        return getCurrentActorActions(state, gameState).find(action => action.type === 'PASS') || {
            type: 'PASS',
            label: 'Pass',
            category: 'system',
            tooltip: 'End turn without taking any action'
        };
    }

    // Select random action from available actions
    const randomIndex = Math.floor(Math.random() * availableActions.length);
    return availableActions[randomIndex];
}
