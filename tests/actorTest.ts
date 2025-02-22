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
            // Test clara loads correctly
            const claraJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'clara.json'), 'utf-8');
            const clara = loadCharacter(claraJson);
            
            // Basic stats load as provided in JSON
            expect(clara.might).toBe(8);
            expect(clara.grace).toBe(14);
            expect(clara.mind).toBe(12);
            expect(clara.will).toBe(6);
            expect(clara.skills['Stealth[Grace]']).toBe(2);
            expect(clara.traits[0].name).toBe('Stab');
            expect(clara.traits[0].effects[0].type).toBe('WOUND');

            // Test green slime loads correctly
            const greenSlimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'green_slime.json'), 'utf-8');
            const greenSlime = loadCharacter(greenSlimeJson);
            
            // Basic stats load as provided in JSON
            expect(greenSlime.might).toBe(6);
            expect(greenSlime.grace).toBe(6);
            expect(greenSlime.mind).toBe(4);
            expect(greenSlime.will).toBe(4);
            expect(greenSlime.skills['Stealth[Grace]']).toBe(2);
            expect(greenSlime.skills['Grapple[Might]']).toBe(2);
            expect(greenSlime.description).toBe('A small, gelatinous creature that can dissolve into water and slip through tight spaces');
            
            // Test traits
            expect(greenSlime.traits).toHaveLength(2);
            expect(greenSlime.traits[1].name).toBe('Bludgeon');
            expect(greenSlime.traits[1].effects[0].type).toBe('WOUND');
        });
    });
});
