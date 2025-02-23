import { CombatState } from './combatState';
import { GameState, getCharactersFromIdList } from '../types/gamestate';

/**
 * State-based actions are automatic game rules that are checked and applied during combat
 * without requiring explicit player actions. These include:
 * 
 * 1. Victory/Defeat Conditions
 *    - Checking if any character's vitality has dropped to 0
 *    - Determining combat winners/losers
 * 
 * 2. Status Effects (TODO)
 *    - Processing ongoing effects that trigger each round
 *    - Handling duration-based effects that may expire
 *    - Applying periodic damage/healing
 * 
 * 3. Special Conditions (TODO)
 *    - Heroine capture conditions
 *    - Environmental effects
 *    - Terrain-based triggers
 * 
 * State-based actions are processed:
 * - After each action resolves
 * - At the beginning of each round
 * - Any time the game state changes in a way that could trigger them
 * 
 * This system ensures that game rules are consistently enforced and
 * that complex interactions resolve in a predictable order.
 */
export function processStateBasedActions(state: CombatState, gameState: GameState): CombatState {
    // TODO: Process status effects and round-based effects when between rounds
    
    // TODO: Check for heroine capture condition
    
    // Check each character for defeat via HP
    const characters = getCharactersFromIdList(state.characterIds, gameState);
    for (const char of characters) {
        if (char.vitality <= 0) {
            state.isComplete = true;
            // Log the winner
            const winner = characters.find(c => c !== char);
            if (winner) {
                const currentRoundLog = state.combatLog[state.round - 1];
                currentRoundLog.combatLogs.push(
                    `Combat ended - ${winner.name} wins (${char.name} defeated at 0 HP)`
                );
            }
            break;
        }
    }

    return state;
}
