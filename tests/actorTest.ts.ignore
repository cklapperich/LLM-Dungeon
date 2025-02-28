import { createCharacter, calculateMaxVitality, calculateMaxConviction, saveCharacter, loadCharacter, getSkillBonus, getCombinedModifiers } from '../src/types/actor.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from 'vitest';
import { StatusName } from '../src/types/status.js';
import { createStatus } from '../src/game_engine/statusEffects.js';
import { Skills } from '../src/types/skilltypes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Actor Tests', () => {
    test('character creation', () => {
        // Test default creation
        const defaultChar = createCharacter();
        expect(defaultChar.might).toBeGreaterThan(0);
        expect(defaultChar.maxVitality).toBeGreaterThan(0);
        expect(defaultChar.maxConviction).toBeGreaterThan(0);

        // Test custom creation
        const customChar = createCharacter({
            might: 15,
            will: 6,
            grace: 12,
            wit: 14
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
            // Test clara loads correctly
            const claraJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'clara.json'), 'utf-8');
            const clara = loadCharacter(claraJson);

            // Test green slime loads correctly
            const greenSlimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'green_slime.json'), 'utf-8');
            const greenSlime = loadCharacter(greenSlimeJson);
            
        });
    });

    describe('status effect modifiers', () => {
        test('combines modifiers from multiple status effects', () => {
            const char = createCharacter();
            
            // Add some test statuses
            char.statuses = [
                createStatus(StatusName.GRAPPLED),
                createStatus(StatusName.EXHAUSTION, { stacks: 2 })
            ];

            // Test getCombinedModifiers
            const mods = getCombinedModifiers(char.statuses);
            expect(mods.skill_modifiers[Skills.BREAK_FREE_MIGHT]).toBe(-2); // From exhaustion
            expect(mods.skill_modifiers[Skills.SLIP_FREE_GRACE]).toBe(-2); // From exhaustion
            
            // Test getSkillBonus
            char.skills[Skills.BREAK_FREE_MIGHT] = 2; // Base skill of 2
            const totalBonus = getSkillBonus(char, Skills.BREAK_FREE_MIGHT);
            expect(totalBonus).toBe(0); // Base 2 + (-2) from exhaustion
        });
    });
});
