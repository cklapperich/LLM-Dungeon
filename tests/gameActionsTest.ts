import { describe, it, expect } from 'vitest';
import { createTestCombatScenario, createDefaultTestCharacters } from '../src/testing/stateGenerators';
import { executeAction } from '../src/game_engine/combat/modifyCombatState';
import { getLegalActions } from '../src/game_engine/combatEngine';
import { TraitUIAction } from '../src/react_ui/uiTypes';

describe('Combat Flow', () => {
    it('should execute a legal action in combat', async () => {
        // Set up initial combat state
        const { player, monster } = createDefaultTestCharacters();
        const gameState = createTestCombatScenario(player, monster);
        const combat = gameState.activeCombat!;
        
        // Get legal actions for current character
        const legalActions = getLegalActions(player, combat);
        console.log('Legal actions:', JSON.stringify(legalActions, null, 2));
        expect(legalActions.length).toBeGreaterThan(0);
        
        // Take the Stab action and fix targeting
        const stabAction = legalActions.find(a => a.type === 'Stab');
        expect(stabAction).toBeDefined();
        // Need to cast since we know it's a trait action
        const action = stabAction as TraitUIAction;
        action.trait = {
            ...action.trait,
            target: 'opponent' // Fix targeting
        };
        console.log('Executing action:', JSON.stringify(action, null, 2));
        
        // Log initial combat log state
        console.log('Initial combat log:', JSON.stringify(combat.combatLog, null, 2));
        
        const result = await executeAction(gameState, action);
        
        // Log final combat log state
        console.log('Final combat log:', JSON.stringify(result.newState.activeCombat?.combatLog, null, 2));
        
        // Verify action execution
        expect(result.success).toBe(true);
        expect(result.newState.activeCombat).toBeDefined();
        
        // Check that error messages don't appear in combat log
        const newCombatLogs = result.newState.activeCombat?.combatLog[0].combatLogs || [];
        const errorMessages = newCombatLogs.filter(log => 
            log && (
                log.includes('Failed to apply') || 
                log.includes('undefined') ||
                log.includes('error')
            )
        );
        expect(errorMessages).toHaveLength(0);
        
        // Verify turn advanced
        expect(result.newState.activeCombat?.activeCharacterIndex).toBe(1);
        
        // Verify new legal actions were calculated for next character
        expect(result.newState.activeCombat?.playerActions).toBeDefined();
        expect(result.newState.activeCombat?.playerActions.length).toBeGreaterThan(0);
    });

    it('should handle errors without adding them to combat log', async () => {
        const { player, monster } = createDefaultTestCharacters();
        const gameState = createTestCombatScenario(player, monster);
        const combat = gameState.activeCombat!;
        
        // Get initial log length
        const initialLogLength = combat.combatLog.length;
        
        // Try to execute an invalid system action
        const result = await executeAction(gameState, {
            category: 'system',
            type: 'INVALID_ACTION',
            label: 'Invalid Action'
        });
        
        // Verify error handling
        expect(result.success).toBe(false);
        expect(result.message).toBe('Unknown system action type: INVALID_ACTION');
        
        // Verify no logs were added
        expect(result.newState.activeCombat?.combatLog.length).toBe(initialLogLength);
    });
});
