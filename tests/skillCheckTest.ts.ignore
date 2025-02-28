import { makeSkillCheck, makeOpposedCheck } from '../src/game_engine/utils/skillCheck.ts';
import { Skills } from '../src/types/skilltypes.js';
import { createCharacter } from '../src/types/actor.js';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Define difficulty levels matching the original code
enum Difficulty {
    Easy = 4,
    Normal = 0,
    Hard = -4,
    VeryHard = -8
}

describe('Skill Check Tests', () => {
    // Mock characters using createCharacter
    const cultist = createCharacter({
        might: 12,
        grace: 14,
        mind: 13,
        will: 11,
        description: "A mysterious cultist",
        skills: {
            [Skills.LIGHT_WEAPONS]: 4,  // Proficient (+4)
            [Skills.STEALTH]: 4,       // Proficient (+4)
            [Skills.GRAPPLE_GRACE]: 4 // Proficient (+4)
        }
    });

    const guard = createCharacter({
        might: 13,
        grace: 12,
        mind: 14,
        will: 12,
        description: "A vigilant guard",
        skills: {
            [Skills.PERCEPTION]: 0  // Not proficient
        }
    });

    const victim = createCharacter({
        might: 10,
        grace: 11,
        mind: 12,
        will: 10,
        description: "A local merchant",
        skills: {
            [Skills.DODGE_GRACE]: 0  // Not proficient
        }
    });

    const wrestler = createCharacter({
        might: 15,
        grace: 12,
        mind: 10,
        will: 11,
        description: "A strong wrestler",
        skills: {
            [Skills.GRAPPLE_MIGHT]: 4
        }
    });

    // Mock random roll to be consistent
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5); // Will result in consistent rolls
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('basic grapple check without proficiency', () => {
        const result = makeSkillCheck(cultist, Skills.GRAPPLE_MIGHT);
        expect(result.roll).toBeGreaterThan(0);
        expect(result.attribute).toBe(12); // Base might without proficiency
        expect(result.success).toBeDefined();
    });

    test('light weapons check with proficiency', () => {
        const result = makeSkillCheck(cultist, Skills.LIGHT_WEAPONS);
        expect(result.roll).toBeGreaterThan(0);
        expect(result.attribute).toBe(18); // Base grace (14) + proficiency (4)
    });

    test('hard stealth check with proficiency', () => {
        const result = makeSkillCheck(cultist, Skills.STEALTH, Difficulty.Hard);
        expect(result.roll).toBeGreaterThan(0);
        expect(result.attribute).toBe(14); // Base grace (14) + proficiency (4) + Hard (-4)
    });

    test('very hard grapple check without proficiency', () => {
        const result = makeSkillCheck(cultist, Skills.GRAPPLE_MIGHT, Difficulty.VeryHard);
        expect(result.roll).toBeGreaterThan(0);
        expect(result.attribute).toBe(4); // Base might (12) + VeryHard (-8)
    });

    test('easy grapple check with proficiency', () => {
        const result = makeSkillCheck(wrestler, Skills.GRAPPLE_MIGHT, Difficulty.Easy);
        expect(result.roll).toBeGreaterThan(0);
        expect(result.attribute).toBe(23); // Base might (15) + proficiency (4) + Easy (4)
    });

    describe('Opposed Checks', () => {
        test('stealth vs perception (explicit skills)', () => {
            const result = makeOpposedCheck(
                cultist,
                Skills.STEALTH,
                guard,
                Skills.PERCEPTION
            );
            expect(result.attacker).toBeDefined();
            expect(result.defender).toBeDefined();
            expect(result.attackerWins).toBeDefined();
        });

        test('grapple vs dodge (automatic skill lookup)', () => {
            const result = makeOpposedCheck(
                wrestler,
                Skills.GRAPPLE_MIGHT,
                victim,
                Skills.DODGE_GRACE
            );
            expect(result.attacker).toBeDefined();
            expect(result.defender).toBeDefined();
            expect(result.attackerWins).toBeDefined();
        });

        test('grapple vs grapple (same skill)', () => {
            const result = makeOpposedCheck(
                wrestler,
                Skills.GRAPPLE_MIGHT,
                cultist
            );
            expect(result.attacker).toBeDefined();
            expect(result.defender).toBeDefined();
            expect(result.attackerWins).toBeDefined();
        });
    });
});
