import { Character } from '../types/actor.ts';
import { GameState } from '../types/gamestate.ts';

// Base interface for all game actions
export interface GameActionResult {
    success: boolean;
    message?: string;  // Optional message for logging/debugging
}

// Wound action interface
export interface WoundActionParams {
    amount: number;
}

export function applyWound(
    gameState: GameState,
    source: Character,
    target: Character,
    params: WoundActionParams
): GameActionResult {
    // Validate parameters
    if (typeof params.amount !== 'number' || params.amount < 0) {
        return { success: false, message: 'Invalid wound amount' };
    }

    // Apply wound
    const newVitality = Math.max(0, target.vitality - params.amount);
    target.vitality = newVitality;
    
    return { 
        success: true,
        message: `Applied ${params.amount} wound damage to ${target.name}`
    };
}
