import { describe, test, expect } from 'vitest';
import { createCharacter } from '../src/types/actor.js';
import { createWoundEffect, applyEffect } from '../src/types/effect.js';
import { EffectType } from '../src/types/constants.js';
import { createTestGameState } from '../src/types/gamestate.js';

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
});
