import { createCharacter, calculateMaxVitality, calculateMaxConviction, saveCharacter, loadCharacter, getSkillBonus } from '../src/types/actor.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Actor Tests', () => {
    test('character creation', () => {
        // Test default creation
        const defaultChar = createCharacter();
        expect(defaultChar.might).toBeGreaterThan(0);
        expect(defaultChar.maxVitality).toBeGreaterThan(0);
        expect(defaultChar.maxConviction).toBeGreaterThan(0);
        expect(defaultChar.grappleState).toBe(0);

        // Test custom creation
        const customChar = createCharacter({
            might: 15,
            will: 6,
            grace: 12,
            mind: 14
        });
        expect(customChar.might).toBe(15);
        expect(customChar.maxVitality).toBeGreaterThan(0);
        expect(customChar.maxConviction).toBeGreaterThan(0);
    });

    describe('stat calculations', () => {
        test('calculates vitality and conviction', () => {
            // Test some key breakpoints
            expect(calculateMaxVitality(5)).toBe(1);
            expect(calculateMaxVitality(18)).toBe(5);
            
            expect(calculateMaxConviction(6)).toBe(1);
            expect(calculateMaxConviction(20)).toBe(5);
        });
    });

    describe('character loading', () => {
        test('loads monsters with traits', () => {
            // Test green slime loads with both string-based and custom traits
            const greenSlimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'green_slime.json'), 'utf-8');
            const greenSlime = loadCharacter(greenSlimeJson);
            
            // Basic stats load as provided in JSON
            expect(greenSlime.might).toBe(6);
            expect(greenSlime.vitality).toBe(greenSlime.maxVitality);
            
            // String-based traits are converted to instances
            const slamTrait = greenSlime.traits.find(t => t.name === 'Slam');
            expect(slamTrait).toBeDefined();
            expect(slamTrait?.effects[0].type).toBe('WOUND');
            
            // Custom traits are preserved
            const dissolveTrait = greenSlime.traits.find(t => t.name === 'Dissolve');
            expect(dissolveTrait).toBeDefined();
            expect(dissolveTrait?.effects[0].type).toBe('STAT_CHANGE');
        });
    });
});
