import { CombatState } from '../../types/combatState';
import { removeStatusesWithZeroStacks, updateStatusDurations, applyEndCombat } from './modifyCombatState';
import { CombatEndReason } from '../../types/constants';
import { StatusName } from '../../types/status';
import { getStatus } from '../statusEffects';

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
export async function processBetweenActions(state: CombatState): Promise<CombatState> {
    // Get all characters once
    const characters = state.characters;
    
    // Update status durations and check for defeat
    for (const char of characters) {
        if (char.vitality <= 0) {
            const winner = characters.find(c => c !== char);
            if (winner) {
                await applyEndCombat(state, winner, CombatEndReason.DEATH);
            }
            break;
        }
        // Check for insemination victory condition
        if (getStatus(char.statuses, StatusName.INSEMINATED)) {
            const winner = characters.find(c => c !== char);
            if (winner) {
                await applyEndCombat(state, winner, CombatEndReason.BREEDING);
            }
            break;
        }
    }
    return state;
}

export function processBetweenRounds(state: CombatState): CombatState {
    // Get all characters once
    const characters = state.characters;
    
    // Process status effects and round-based effects
    for (const char of characters) {
        updateStatusDurations(state, char);
        removeStatusesWithZeroStacks(state, char);
    }
    return state;
}
