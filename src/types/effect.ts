import { EffectType } from './constants.js';
import { Character } from './actor.js';
import { applyWound } from '../game_engine/gameActions.ts';
import { GameState } from './gamestate.js';

export interface Effect {
    type: typeof EffectType[keyof typeof EffectType];
    params: Record<string, any>;
}

export type EffectHandler = (effect: Effect, source: Character, target: Character, gameState: GameState) => void;

export const effectHandlers: Record<typeof EffectType[keyof typeof EffectType], EffectHandler> = {
    [EffectType.WOUND]: (effect, source, target, gameState) => {
        // Ensure value exists and is a number
        if (typeof effect.params.value !== 'number') {
            throw new Error('Wound effect requires a numeric value parameter');
        }
        
        const result = applyWound(gameState, source, target, {
            amount: effect.params.value
        });
        
        if (!result.success) {
            throw new Error(`Failed to apply wound: ${result.message}`);
        }
    },
    [EffectType.STATUS]: (effect, source, target, gameState) => {
        throw new Error('STATUS effect not implemented');
    },
    [EffectType.HEAL]: (effect, source, target, gameState) => {
        throw new Error('HEAL effect not implemented');
    },
    [EffectType.GRAPPLE]: (effect, source, target, gameState) => {
        throw new Error('GRAPPLE effect not implemented');
    },
    [EffectType.CORRUPT]: (effect, source, target, gameState) => {
        throw new Error('CORRUPT effect not implemented');
    }
};

export function applyEffect(effect: Effect, source: Character, target: Character, gameState: GameState): void {
    const handler = effectHandlers[effect.type];
    if (!handler) {
        throw new Error(`No handler found for effect type: ${effect.type}`);
    }
    handler(effect, source, target, gameState);
}

// Helper to create a wound effect
export function createWoundEffect(value: number): Effect {
    return {
        type: EffectType.WOUND,
        params: { value }
    };
}
