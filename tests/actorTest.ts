import { createCharacter, calculateMaxVitality, calculateMaxConviction, saveCharacter, loadCharacter, getSkillBonus } from '../src/types/actor.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Actor Tests', () => {
    test('default character creation', () => {
        const defaultChar = createCharacter();
        expect(defaultChar.might).toBe(10);
        expect(defaultChar.grace).toBe(10);
        expect(defaultChar.mind).toBe(10);
        expect(defaultChar.will).toBe(10);
        expect(defaultChar.maxVitality).toBe(3);
        expect(defaultChar.vitality).toBe(3);
        expect(defaultChar.maxConviction).toBe(3);
        expect(defaultChar.conviction).toBe(3);
        expect(defaultChar.grappleState).toBe(0);
    });

    test('custom character creation', () => {
        const customChar = createCharacter({
            might: 15,
            will: 6,
            grace: 12,
            mind: 14
        });
        expect(customChar.might).toBe(15);
        expect(customChar.grace).toBe(12);
        expect(customChar.mind).toBe(14);
        expect(customChar.will).toBe(6);
        expect(customChar.maxVitality).toBe(4);
        expect(customChar.vitality).toBe(4);
        expect(customChar.maxConviction).toBe(1);
        expect(customChar.conviction).toBe(1);
    });

    describe('vitality calculation', () => {
        test('calculates correctly across all ranges', () => {
            expect(calculateMaxVitality(5)).toBe(1);
            expect(calculateMaxVitality(8)).toBe(2);
            expect(calculateMaxVitality(12)).toBe(3);
            expect(calculateMaxVitality(15)).toBe(4);
            expect(calculateMaxVitality(18)).toBe(5);
        });
    });

    describe('conviction calculation', () => {
        test('calculates correctly across all ranges', () => {
            expect(calculateMaxConviction(6)).toBe(1);
            expect(calculateMaxConviction(9)).toBe(2);
            expect(calculateMaxConviction(13)).toBe(3);
            expect(calculateMaxConviction(16)).toBe(4);
            expect(calculateMaxConviction(20)).toBe(5);
        });
    });

    describe('character loading', () => {
        test('loads character from file correctly', () => {
            const slimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'slime.json'), 'utf-8');
            const slime = loadCharacter(slimeJson);

            expect(slime.might).toBe(8);
            expect(slime.grace).toBe(6);
            expect(slime.mind).toBe(4);
            expect(slime.will).toBe(4);
            expect(getSkillBonus(slime, 'Might')).toBe(0);
            expect(getSkillBonus(slime, 'Intimidation')).toBe(1);
            expect(slime.maxVitality).toBe(2);
            expect(slime.maxConviction).toBe(1);
            expect(slime.vitality).toBe(2);
            expect(slime.conviction).toBe(1);
        });

        test('round-trip serialization matches', () => {
            const slimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'slime.json'), 'utf-8');
            const slime = loadCharacter(slimeJson);
            const savedJson = saveCharacter(slime);
            const reloadedSlime = loadCharacter(savedJson);
            expect(JSON.stringify(slime)).toBe(JSON.stringify(reloadedSlime));
        });
    });
});
