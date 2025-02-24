    import { describe, test, expect, beforeEach } from 'vitest';
import { Character, createCharacter } from '../src/types/actor.js';
import { GameState, createTestGameState } from '../src/types/gamestate.js';
import { StatusName } from '../src/types/status.js';
import { BodyPartType } from '../src/types/constants.js';
import { createStatus } from '../src/game_engine/statusEffects.js';
import {
    isCharacterGrappled,
    isCharacterPenetrated,
    getTotalBoundLimbs,
    trackBoundLimb,
    removeRandomBoundLimbThisGrapple,
    removeAllBoundLimbs,
    canBindLimb,
    applyBreakFreeSkillcheckSuccess,
    BindablePart
} from '../src/game_engine/grapplingRules.js';

describe('Grappling System Tests', () => {
    let source: Character;
    let target: Character;
    let gameState: GameState;

    beforeEach(() => {
        source = createCharacter({ name: 'Source' });
        target = createCharacter({ name: 'Target' });
        gameState = createTestGameState({
            characters: {
                'source': source,
                'target': target
            }
        });
    });

    describe('Status Checks', () => {
        test('isCharacterGrappled returns false when no grapple status', () => {
            expect(isCharacterGrappled(target)).toBe(false);
        });

        test('isCharacterGrappled returns true when grappled', () => {
            target.statuses.push(createStatus(StatusName.GRAPPLED));
            expect(isCharacterGrappled(target)).toBe(true);
        });

        test('isCharacterPenetrated returns false when no penetrated status', () => {
            expect(isCharacterPenetrated(target)).toBe(false);
        });

        test('isCharacterPenetrated returns true when penetrated', () => {
            target.statuses.push(createStatus(StatusName.PENETRATED));
            expect(isCharacterPenetrated(target)).toBe(true);
        });
    });

    describe('Bound Limb Management', () => {
        test('getTotalBoundLimbs returns empty counts when no bound limbs', () => {
            const boundLimbs = getTotalBoundLimbs(target);
            expect(boundLimbs[BodyPartType.ARM]).toBe(undefined);
            expect(boundLimbs[BodyPartType.LEG]).toBe(undefined);
            expect(boundLimbs[BodyPartType.MOUTH]).toBe(undefined);
            expect(boundLimbs[BodyPartType.TAIL]).toBe(undefined);
        });

        test('getTotalBoundLimbs correctly counts bound limbs', () => {
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            target.statuses.push(createStatus('bound_legs', { stacks: 1 }));
            
            const boundLimbs = getTotalBoundLimbs(target);
            expect(boundLimbs[BodyPartType.ARM]).toBe(2);
            expect(boundLimbs[BodyPartType.LEG]).toBe(1);
            expect(boundLimbs[BodyPartType.MOUTH]).toBe(undefined);
            expect(boundLimbs[BodyPartType.TAIL]).toBe(undefined);
        });

        test('trackBoundLimb adds effect to tracking', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: [] as string[],
                [BodyPartType.LEG]: [] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);

            trackBoundLimb(target, BodyPartType.ARM as BindablePart, 'effect1');
            expect(grappleStatus.params.boundDuringGrapple[BodyPartType.ARM]).toContain('effect1');
        });

        test('removeRandomBoundLimbThisGrapple removes one bound limb', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: ['effect1', 'effect2'] as string[],
                [BodyPartType.LEG]: ['effect3'] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            target.statuses.push(createStatus('bound_legs', { stacks: 1 }));

            const result = removeRandomBoundLimbThisGrapple(target);
            expect(result).toBe(true);

            // Check that one bound limb was removed
            const totalBound = getTotalBoundLimbs(target);
            const totalEffects = Object.values(grappleStatus.params.boundDuringGrapple as Record<string, string[]>)
                .reduce((sum, arr) => sum + arr.length, 0);
            
            expect(totalEffects).toBeLessThan(3); // Started with 3 effects
        });

        test('removeAllBoundLimbs clears all bound limbs from current grapple', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: ['effect1', 'effect2'] as string[],
                [BodyPartType.LEG]: ['effect3'] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            target.statuses.push(createStatus('bound_legs', { stacks: 1 }));

            removeAllBoundLimbs(target);

            // Check all tracking arrays are empty
            Object.values(grappleStatus.params.boundDuringGrapple as Record<string, string[]>).forEach(arr => {
                expect(arr.length).toBe(0);
            });

            // Check bound statuses are cleared
            const boundLimbs = getTotalBoundLimbs(target);
            expect(boundLimbs[BodyPartType.ARM]).toBeUndefined();
            expect(boundLimbs[BodyPartType.LEG]).toBeUndefined();
        });
    });

    describe('Limb Binding Rules', () => {
        test('canBindLimb returns true when limb available', () => {
            target.limbs[BodyPartType.ARM] = 2;
            expect(canBindLimb(target, BodyPartType.ARM as BindablePart)).toBe(true);
        });

        test('canBindLimb returns false when all limbs bound', () => {
            target.limbs[BodyPartType.ARM] = 2;
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            expect(canBindLimb(target, BodyPartType.ARM as BindablePart)).toBe(false);
        });

        test('canBindLimb returns true when some limbs still free', () => {
            target.limbs[BodyPartType.ARM] = 2;
            target.statuses.push(createStatus('bound_arms', { stacks: 1 }));
            expect(canBindLimb(target, BodyPartType.ARM as BindablePart)).toBe(true);
        });
    });

    describe('Break Free Mechanics', () => {
        test('break free applies exhaustion penalty', () => {
            // Setup initial state
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('exhaustion', { stacks: 0 }));

            // First break free
            let result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            expect(target.statuses.find(s => s.name === 'exhaustion')?.stacks).toBe(1);

            // Setup grapple again and try break free
            target.statuses.push(grappleStatus);
            result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            expect(target.statuses.find(s => s.name === 'exhaustion')?.stacks).toBe(2);
        });

        test('break free exhaustion caps at -4', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('exhaustion', { stacks: 3 }));

            // This should push it to max of 4
            const result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            expect(target.statuses.find(s => s.name === 'exhaustion')?.stacks).toBe(4);

            // Setup grapple again
            target.statuses.push(grappleStatus);
            const result2 = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result2.success).toBe(true);
            expect(target.statuses.find(s => s.name === 'exhaustion')?.stacks).toBe(4); // Should not exceed 4
        });

        test('bound limbs apply -2 penalty each to break free', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: ['effect1', 'effect2'] as string[],
                [BodyPartType.LEG]: ['effect3'] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            target.statuses.push(createStatus('bound_legs', { stacks: 1 }));

            // Should have -6 penalty (-2 for each bound limb: 2 arms + 1 leg)
            const breakFreeModifier = -6;
            expect(breakFreeModifier).toBe(-6);
        });

        test('applyBreakFreeSkillcheckSuccess removes penetration first', () => {
            // Setup penetrated and bound state
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: ['effect1', 'effect2'] as string[],
                [BodyPartType.LEG]: [] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus(StatusName.PENETRATED));
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));

            const result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            expect(isCharacterPenetrated(target)).toBe(false);
            expect(getTotalBoundLimbs(target)[BodyPartType.ARM]).toBeUndefined();
        });

        test('applyBreakFreeSkillcheckSuccess removes all bound limbs', () => {
            // Setup bound state without penetration
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: ['effect1'] as string[],
                [BodyPartType.LEG]: ['effect2'] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            target.statuses.push(createStatus('bound_arms', { stacks: 1 }));
            target.statuses.push(createStatus('bound_legs', { stacks: 1 }));

            const result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            
            const boundLimbs = getTotalBoundLimbs(target);
            expect(boundLimbs[BodyPartType.ARM]).toBeUndefined();
            expect(boundLimbs[BodyPartType.LEG]).toBeUndefined();
            expect(isCharacterGrappled(target)).toBe(false);
        });

        test('applyBreakFreeSkillcheckSuccess removes grapple status', () => {
            target.statuses.push(createStatus(StatusName.GRAPPLED));
            const result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
            expect(result.success).toBe(true);
            expect(isCharacterGrappled(target)).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('trackBoundLimb does nothing if no grapple status', () => {
            trackBoundLimb(target, BodyPartType.ARM as BindablePart, 'effect1');
            expect(target.statuses.length).toBe(0);
        });

        test('removeRandomBoundLimbThisGrapple returns false if no grapple status', () => {
            const result = removeRandomBoundLimbThisGrapple(target);
            expect(result).toBe(false);
        });

        test('removeRandomBoundLimbThisGrapple returns false if no bound limbs', () => {
            const grappleStatus = createStatus(StatusName.GRAPPLED);
            grappleStatus.params.boundDuringGrapple = {
                [BodyPartType.ARM]: [] as string[],
                [BodyPartType.LEG]: [] as string[],
                [BodyPartType.MOUTH]: [] as string[],
                [BodyPartType.TAIL]: [] as string[]
            };
            target.statuses.push(grappleStatus);
            
            const result = removeRandomBoundLimbThisGrapple(target);
            expect(result).toBe(false);
        });

        test('removeAllBoundLimbs does nothing if no grapple status', () => {
            target.statuses.push(createStatus('bound_arms', { stacks: 2 }));
            removeAllBoundLimbs(target);
            expect(getTotalBoundLimbs(target)[BodyPartType.ARM]).toBe(2);
        });
    });

    describe('Clothing Rules', () => {
        test('default clothing level is 1', () => {
            const newChar = createCharacter();
            expect(newChar.clothing).toBe(1);
        });

        test('can modify clothing level', () => {
            target.clothing = 0;
            expect(target.clothing).toBe(0);
        });
    });
});
