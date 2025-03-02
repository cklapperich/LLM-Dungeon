/*
An effect is something that runs instantly
an ability and a trait are the same thing
a status is similar to an effect but it sticks around

TODO: Refactor combat log system to use structured objects instead of strings.
This would allow better separation of concerns between effect logic and narrative descriptions.
Current approach mixes these concerns in the effect handlers for pragmatic reasons.
Future refactor should:
1. Convert combat logs to objects with type, message, description fields
2. Move narrative descriptions to a separate processor
3. Keep effect handlers focused on game logic
*/

const message_default = 'MESSAGE STRING NOT SUPPORTED';
import { safeScriptHandler } from './jsonScriptManager.ts';
import { EffectType, GrappleType, CombatEndReason } from '../../types/constants.js';
import { Character } from '../../types/actor.js';
import { applyWound, applyGrapple, applyStatus, modifyClothing, applyEndCombat } from './modifyCombatState.ts';
import { applyBreakFreeSkillcheckSuccess } from './grapplingRules.js';
import { CombatState } from '../../types/combatState.ts';

import { StatusName } from '../../types/status';
import { getStatus } from '../statusEffects';

export interface Effect {
    type: typeof EffectType[keyof typeof EffectType];
    params: Record<string, any>;
    target?: 'self' | 'other';  // Who this effect targets, defaults to 'other' if not specified
    applyOnSkillCheckFailure?: boolean;  // Whether to apply this effect even when the skill check fails
}

export type EffectHandler = (effect: Effect, source: Character, target: Character, state: CombatState) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };

export const effectHandlers: Record<typeof EffectType[keyof typeof EffectType], EffectHandler> = {
    [EffectType.SCRIPT]: safeScriptHandler,
    
    [EffectType.ADVANCE_TURN]: (effect, source, target, state) => {

        // Move to next character
        state.activeCharacterIndex = 
            (state.activeCharacterIndex + 1) % state.characters.length;

        return {
            success: true,
            message: message_default
        };
    },
    [EffectType.END_COMBAT]: async (effect, source, target, state) => {
        const winner = effect.params.winner;
        const loser = state.characters.find(c => c !== winner);
        if (!winner) {
            return {
                success: false,
                message: message_default
            };
        }

        const result = await applyEndCombat(
            state,
            winner,
            loser,
            effect.params.reason
        );

        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.BREAK_FREE]: (effect, source, target, state) => {
        const result = applyBreakFreeSkillcheckSuccess(state, source, target);
        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.WOUND]: (effect, source, target, state) => {
        const result = applyWound(state, source, target, {
            amount: effect.params.value
        });
        
        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.STATUS]: async (effect, source, target, state) => {
        const result = applyStatus(state, source, target, {
            type: effect.params.type,
            duration: effect.params.duration,
            stacks: effect.params.stacks,
            abilityName: effect.params.abilityName
        });
        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.HEAL]: (effect, source, target, state) => {
        return { success: false, message: message_default };
    },
    [EffectType.GRAPPLE]: (effect, source, target, state) => {
        const type = effect.params.type || GrappleType.GRAB;
        const result = applyGrapple(state, source, target, {
            type,
            limbType: effect.params.limbType
        });

        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.CORRUPT]: (effect, source, target, state) => {
        return { success: false, message: message_default };
    },
    [EffectType.MODIFY_CLOTHING]: (effect, source, target, state) => {
        const result = modifyClothing(state, source, target, {
            amount: effect.params.amount
        });

        return {
            success: result.success,
            message: message_default
        };
    },
    [EffectType.PENETRATE]: async (effect, source, target, state) => {
        // Apply penetrated status
        const penetrateResult = await applyStatus(state, source, target, {
            type: StatusName.PENETRATED
        });

        if (!penetrateResult.success) {
            return {
                success: false,
                message: penetrateResult.message
            };
        }

        // Check if we should apply inseminate status   
        if (effect.params.inseminate_if_x_stacks) {
            const penetratedStatus = getStatus(target.statuses, StatusName.PENETRATED);
            if (penetratedStatus && penetratedStatus.stacks >= effect.params.inseminate_if_x_stacks) {
                const inseminateResult = await applyStatus(state, source, target, {
                    type: StatusName.INSEMINATED
                });

                if (!inseminateResult.success) {
                    return {
                        success: false,
                        message: inseminateResult.message
                    };
                }
            }
        }

        return {
            success: true,
            message: message_default
        };
    }
};

export async function applyEffect(effect: Effect, source: Character, target: Character, state: CombatState): Promise<{ success: boolean; message: string }> {
    const handler = effectHandlers[effect.type];
    if (!handler) {
        return { success: false, message: message_default };
    }
    return await handler(effect, source, target, state);
}
