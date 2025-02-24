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

import { EffectType, GrappleType} from '../types/constants.js';
import { Character } from '../types/actor.js';
import { applyWound, applyGrapple, applyStatus, modifyClothing } from './modifyGameState.ts';
import { applyBreakFreeSkillcheckSuccess } from './grapplingRules.js';
import { GameState } from '../types/gamestate.js';
import { formatStatusDescription, getVitalityDescription, getClothingDescription } from './narrativeFormatter';
import { StatusSource } from '../types/status';
import { handleCombatEnd } from './combatEngine.js';

export interface Effect {
    type: typeof EffectType[keyof typeof EffectType];
    params: Record<string, any>;
    target?: 'self' | 'other';  // Who this effect targets, defaults to 'other' if not specified
    applyOnSkillCheckFailure?: boolean;  // Whether to apply this effect even when the skill check fails
}

export type EffectHandler = (effect: Effect, source: Character, target: Character, gameState: GameState) => { success: boolean; message: string };

export const effectHandlers: Record<typeof EffectType[keyof typeof EffectType], EffectHandler> = {
    [EffectType.ADVANCE_TURN]: (effect, source, target, gameState) => {
        if (!gameState.activeCombat) {
            return {
                success: false,
                message: "No active combat"
            };
        }

        // Move to next character
        gameState.activeCombat.activeCharacterIndex = 
            (gameState.activeCombat.activeCharacterIndex + 1) % gameState.activeCombat.characterIds.length;

        return {
            success: true,
            message: `${source.name} passed their turn`
        };
    },
    [EffectType.END_COMBAT]: (effect, source, target, gameState) => {
        if (!gameState.activeCombat) {
            return {
                success: false,
                message: "No active combat"
            };
        }

        const winner = effect.params.winner;
        if (!winner) {
            return {
                success: false,
                message: "No winner specified for combat end"
            };
        }

        handleCombatEnd(
            gameState.activeCombat,
            gameState,
            winner,
            effect.params.reason || "Combat ended by effect"
        );

        return {
            success: true,
            message: `Combat ended. ${winner.name} is victorious!`
        };
    },
    [EffectType.BREAK_FREE]: (effect, source, target, gameState) => {
        const result = applyBreakFreeSkillcheckSuccess(gameState, source, target);
        return {
            success: result.success,
            message: result.message || `${target.name} attempted to break free`
        };
    },
    [EffectType.WOUND]: (effect, source, target, gameState) => {
        const result = applyWound(gameState, source, target, {
            amount: effect.params.value
        });

        // Get description of target's vitality state
        const vitalityDesc = getVitalityDescription(target.vitality);
        const message = result.message || `${source.name} wounded ${target.name} for ${effect.params.value}`;
        
        return {
            success: result.success,
            message: vitalityDesc ? `${message}\n[${target.name} ${vitalityDesc}]` : message
        };
    },
    [EffectType.STATUS]: (effect, source, target, gameState) => {
        const result = applyStatus(gameState, source, target, {
            type: effect.params.type,
            duration: effect.params.duration,
            stacks: effect.params.stacks,
            abilityName: effect.params.abilityName
        });

        // Get narrative description for this status
        const statusDesc = formatStatusDescription({
            id: crypto.randomUUID(),
            name: effect.params.type,
            source: StatusSource.OTHER,
            stacks: effect.params.stacks || 1,
            max_stacks: 1,
            is_negative: true,
            params: {}
        });

        let message = result.message || `Applied ${effect.params.type} status to ${target.name}`;
        
        // Check if this is a penetration that reaches 2 stacks
        if (result.success && effect.params.type === 'penetrated') {
            const penetratedStatus = target.statuses?.find(s => s.name === 'penetrated');
            if (penetratedStatus && penetratedStatus.stacks >= 2) {
                // Apply inseminated status
                const inseminateResult = applyStatus(gameState, source, target, {
                    type: 'inseminated',
                    stacks: 1,
                    abilityName: effect.params.abilityName
                });
                
                // End combat with monster victory
                const endResult = effectHandlers[EffectType.END_COMBAT]({
                    type: EffectType.END_COMBAT,
                    params: { winner: source }
                }, source, target, gameState);

                message = `${message}\n${source.name} has successfully bred ${target.name}!`;
                if (endResult.success) {
                    message = `${message}\n${endResult.message}`;
                }
            }
        }

        return {
            success: result.success,
            message: statusDesc ? `${message}\n[${statusDesc}]` : message
        };
    },
    [EffectType.HEAL]: (effect, source, target, gameState) => {
        return { success: false, message: 'HEAL effect not implemented' };
    },
    [EffectType.GRAPPLE]: (effect, source, target, gameState) => {
        const type = effect.params.type || GrappleType.GRAB;
        const result = applyGrapple(gameState, source, target, {
            type,
            limbType: effect.params.limbType
        });

        // Get narrative description for grapple status if successful
        const statusDesc = result.success ? formatStatusDescription({
            id: crypto.randomUUID(),
            name: 'grappled',
            source: StatusSource.OTHER,
            stacks: 1,
            max_stacks: 1,
            is_negative: true,
            params: {}
        }) : null;

        const message = result.message || `${source.name} attempted to ${type} ${target.name}`;
        return {
            success: result.success,
            message: statusDesc ? `${message}\n[${statusDesc}]` : message
        };
    },
    [EffectType.CORRUPT]: (effect, source, target, gameState) => {
        return { success: false, message: 'CORRUPT effect not implemented' };
    },
    [EffectType.MODIFY_CLOTHING]: (effect, source, target, gameState) => {
        const result = modifyClothing(gameState, source, target, {
            amount: effect.params.amount
        });

        // Get description of new clothing state
        const clothingDesc = getClothingDescription(target.clothing);
        const message = result.message || `${source.name} modified ${target.name}'s clothing by ${effect.params.amount}`;
        
        return {
            success: result.success,
            message: clothingDesc ? `${message}\n[${target.name} is now ${clothingDesc}]` : message
        };
    }
};

export function applyEffect(effect: Effect, source: Character, target: Character, gameState: GameState): { success: boolean; message: string } {
    const handler = effectHandlers[effect.type];
    if (!handler) {
        return { success: false, message: `No handler found for effect type: ${effect.type}` };
    }
    return handler(effect, source, target, gameState);
}
