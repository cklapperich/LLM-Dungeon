import { describe, test, expect } from 'vitest';
import { createCharacter } from '../src/types/actor.js';
import { applyEffect } from '../src/game_engine/combat/effect.js';
import { EffectType, CombatFlags, GrappleType } from '../src/types/constants.js';
import { createTestGameState } from '../src/types/gamestate.js';
import { applyStatus } from '../src/game_engine/combat/modifyCombatState.js';
import { StatusName } from '../src/types/status.js';

// Helper functions for tests
function createWoundEffect(value: number) {
    return {
        type: EffectType.WOUND,
        params: { value }
    };
}

function createGrappleEffect(type: typeof GrappleType[keyof typeof GrappleType] = GrappleType.GRAB) {
    return {
        type: EffectType.GRAPPLE,
        params: { type }
    };
}

describe('Effect Tests', () => {
    test('wound effect reduces vitality', () => {
        const source = createCharacter({ might: 15 }); // Attacker
        const target = createCharacter({ might: 12 }); // 3 vitality
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });
        
        expect(target.vitality).toBe(3);
        
        const wound = createWoundEffect(1);
        applyEffect(wound, source, target, gameState);
        
        expect(target.vitality).toBe(2);
    });

    test('wound effect cannot reduce vitality below 0', () => {
        const source = createCharacter({ might: 15 }); // Attacker
        const target = createCharacter({ might: 12 }); // 3 vitality
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });
        
        const wound = createWoundEffect(5); // More than max vitality
        applyEffect(wound, source, target, gameState);
        
        expect(target.vitality).toBe(0);
    });

    test('grapple effect with GRAB type sets grappled flag', () => {
        const source = createCharacter();
        const target = createCharacter();
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });
        
        expect(target.flags[CombatFlags.GRAPPLED]).toBeUndefined();
        
        const grapple = createGrappleEffect();  // Defaults to GRAB type
        applyEffect(grapple, source, target, gameState);
        
        expect(target.flags[CombatFlags.GRAPPLED]).toBe(1);
    });

    test('grapple effect with PENETRATE type sets penetrated flag', () => {
        const source = createCharacter();
        const target = createCharacter();
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });
        
        expect(target.flags[CombatFlags.PENETRATED]).toBeUndefined();
        
        const penetrate = createGrappleEffect(GrappleType.PENETRATE);
        applyEffect(penetrate, source, target, gameState);
        
        expect(target.flags[CombatFlags.PENETRATED]).toBe(1);
    });

    test('wound effect requires numeric value', () => {
        const source = createCharacter();
        const target = createCharacter();
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });
        
        const invalidWound = {
            type: EffectType.WOUND,
            params: { value: 'not a number' }
        };
        
        expect(() => {
            applyEffect(invalidWound as any, source, target, gameState);
        }).toThrow('Wound effect requires a numeric value parameter');
    });

    test('status stacking behavior', () => {
        const source = createCharacter();
        const target = createCharacter();
        const gameState = createTestGameState({
            characters: { 
                'source': source,
                'target': target 
            }
        });

        // Test applying new status
        const result1 = applyStatus(gameState, source, target, { type: StatusName.HEAT });
        expect(result1.success).toBe(true);
        expect(target.statuses.length).toBe(1);
        expect(target.statuses[0].stacks).toBe(1);

        // Test stacking existing status
        const result2 = applyStatus(gameState, source, target, { type: StatusName.HEAT });
        expect(result2.success).toBe(true);
        expect(target.statuses.length).toBe(1);
        expect(target.statuses[0].stacks).toBe(2);

        // Test stacking beyond max (HEAT has max_stacks of 3)
        const result3 = applyStatus(gameState, source, target, { type: StatusName.HEAT });
        expect(result3.success).toBe(true);
        expect(target.statuses[0].stacks).toBe(3);

        // Test attempting to stack beyond max
        const result4 = applyStatus(gameState, source, target, { type: StatusName.HEAT });
        expect(result4.success).toBe(false);
        expect(target.statuses[0].stacks).toBe(3);
    });
});
