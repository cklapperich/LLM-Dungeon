import { Character } from '../types/actor';
import { GameState} from '../types/gamestate';
import { CombatFlags, GrappleType, BodyPartType } from '../types/constants';
import { createStatus, hasStatus, getStatus } from './statusEffects';

import { StatusName } from '../types/status';
import { canBindLimb, trackBoundLimb, BindablePart } from './grapplingRules';

// Base interface for all game actions
export interface GameActionResult {
    success: boolean;
    message?: string;  // Optional message for logging/debugging
}

// TODO - FINISH
export function applyGrapple(
    gameState: GameState,
    source: Character,
    target: Character,
    params: {
        type: typeof GrappleType[keyof typeof GrappleType];
        limbType?: BindablePart;
    }
): GameActionResult {
    const { type, limbType } = params;

    // If this is a new grapple, reset boundDuringGrapple
    if (!hasStatus(target.statuses, StatusName.GRAPPLED)) {
        const grappleStatus = createStatus(StatusName.GRAPPLED);
        target.statuses.push(grappleStatus);
        target.flags[CombatFlags.GRAPPLED] = 1;
    }

    // If penetrating, add penetrated status
    if (type === GrappleType.PENETRATE) {
        if (!hasStatus(target.statuses, StatusName.PENETRATED)) {
            const penetratedStatus = createStatus(StatusName.PENETRATED);
            target.statuses.push(penetratedStatus);
            target.flags[CombatFlags.PENETRATED] = 1;
        }
    }

    // If a limb type was specified, try to bind it
    if (limbType) {
        if (!canBindLimb(target, limbType)) {
            return {
                success: false,
                message: `Cannot bind ${target.name}'s ${limbType}, already bound. `
            };
        }

        // Generate effect ID and track the binding
        const effectId = crypto.randomUUID();
        trackBoundLimb(target, limbType, effectId);

        // Add or increment bound status for this limb type
        const statusName = `bound_${limbType.toLowerCase()}${limbType === BodyPartType.ARM || limbType === BodyPartType.LEG ? 's' : ''}`;
        const boundStatus = getStatus(target.statuses, statusName);
        if (boundStatus) {
            boundStatus.stacks++;
        } else {
            target.statuses.push(createStatus(statusName));
        }
    }

    return {
        success: true,
        message: `${source.name} ${type === GrappleType.PENETRATE ? 'penetrated' : 'grappled'} ${target.name}. `
    };
}

export function applyStatus(
    gameState: GameState,
    source: Character,
    target: Character,
    params: {
        type: string;
        duration?: number;
        stacks?: number;
        abilityName?: string;
    }
): GameActionResult {
    if (!target.statuses) {
        return { 
            success: false, 
            message: 'Target has no statuses array' 
        };
    }

    // Check if status already exists
    const existingStatus = getStatus(target.statuses, params.type);
    if (existingStatus) {
        // Check if we can stack more
        if (existingStatus.stacks >= existingStatus.max_stacks) {
            return {
                success: false,
                message: `${target.name} already has maximum amount (${existingStatus.max_stacks}) of ${params.type}. `
            };
        }
        // Increment stacks
        existingStatus.stacks++;
        return {
            success: true,
            message: `Increased intensity of ${params.type} to ${existingStatus.stacks} on ${target.name}. `
        };
    }

    // Create and apply new status
    const status = createStatus(params.type, params);
    target.statuses.push(status);

    return {
        success: true,
        message: `Applied ${params.type} status to ${target.name}.`
    };
}

export function updateStatusDurations(
    gameState: GameState,
    character: Character
): GameActionResult {
    if (!character.statuses) {
        return {
            success: false,
            message: 'Character has no statuses array'
        };
    }

    // Filter out expired statuses and decrement durations
    character.statuses = character.statuses.filter(status => {
        if (status.duration === undefined) return true;
        status.duration--;
        return status.duration > 0;
    });

    return {
        success: true,
        message: `Updated status durations for ${character.name}. `
    };
}

export function modifyClothing(
    gameState: GameState,
    source: Character,
    target: Character,
    params: {
        amount: number;
    }
): GameActionResult {
    const { amount } = params;
    
    // Clothing can't go below 0 or above 5
    target.clothing = Math.max(0, Math.min(5, target.clothing + amount));

    return {
        success: true,
        message: `${source.name} modified ${target.name}'s clothing by ${amount}. `
    };
}

export function applyWound(
    gameState: GameState,
    source: Character,
    target: Character,
    params: {
        amount: number;
    }
): GameActionResult {
    const { amount } = params;

    target.vitality = Math.max(0, target.vitality - amount);

    return {
        success: true,
        message: `${source.name} wounded ${target.name} for ${amount} damage. `
    };
}
