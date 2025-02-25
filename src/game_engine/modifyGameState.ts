import { Character } from '../types/actor';
import { GameState, GameActionResult } from '../types/gamestate';
import { CombatFlags, GrappleType, BodyPartType } from '../types/constants';
import { createStatus, hasStatus, getStatus } from './statusEffects';
import { combatEventBus } from './eventBus';
import { StatusEvent } from './events/eventTypes';

import { StatusName } from '../types/status';
import { canBindLimb, trackBoundLimb, BindablePart } from './grapplingRules';

// Helper function to emit status events
function emitStatusEvent(
    status: StatusName | string | any, // Using any to accommodate Status objects
    target: Character,
    action: 'ADDED' | 'REMOVED' | 'STACKS_INCREASED' | 'STACKS_DECREASED',
    stackChange?: number
): void {
    // If status is a string, get the status object
    const statusObj = typeof status === 'string' ? getStatus(target.statuses, status) : status;
    
    if (!statusObj) return;
    
    const statusEvent: StatusEvent = {
        type: 'STATUS',
        status: statusObj,
        target,
        action,
        stackChange
    };
    
    combatEventBus.emit('STATUS', statusEvent);
}

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
        
        // Emit status event for new grapple status
        emitStatusEvent(grappleStatus, target, 'ADDED');
    }

    // If penetrating, add penetrated status
    if (type === GrappleType.PENETRATE) {
        if (!hasStatus(target.statuses, StatusName.PENETRATED)) {
            const penetratedStatus = createStatus(StatusName.PENETRATED);
            target.statuses.push(penetratedStatus);
            target.flags[CombatFlags.PENETRATED] = 1;
            
            // Emit status event for new penetrated status
            emitStatusEvent(penetratedStatus, target, 'ADDED');
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
            // Increment stacks
            boundStatus.stacks++;
            
            // Emit status event for stack increase
            emitStatusEvent(boundStatus, target, 'STACKS_INCREASED', 1);
        } else {
            // Create and add new bound status
            const newBoundStatus = createStatus(statusName);
            target.statuses.push(newBoundStatus);
            
            // Emit status event for new bound status
            emitStatusEvent(newBoundStatus, target, 'ADDED');
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
        
        // Emit status event for stack increase
        emitStatusEvent(existingStatus, target, 'STACKS_INCREASED', 1);
        
        return {
            success: true,
            message: `Increased intensity of ${params.type} to ${existingStatus.stacks} on ${target.name}. `
        };
    }

    // Create and apply new status
    const status = createStatus(params.type, params);
    target.statuses.push(status);
    
    // Emit status event for new status
    emitStatusEvent(status, target, 'ADDED');

    return {
        success: true,
        message: `Applied ${params.type} status to ${target.name}.`
    };
}

// Remove a status from a character
export function removeStatus(
    gameState: GameState,
    target: Character,
    statusName: string
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: 'Character has no statuses array'
        };
    }
    
    const statusIndex = target.statuses.findIndex(s => s.name === statusName);
    if (statusIndex === -1) {
        return {
            success: false,
            message: `${target.name} does not have ${statusName} status`
        };
    }
    
    // Get the status before removing it
    const status = target.statuses[statusIndex];
    
    // Remove the status
    target.statuses.splice(statusIndex, 1);
    
    // Emit status event for removal
    emitStatusEvent(status, target, 'REMOVED');
    
    return {
        success: true,
        message: `Removed ${statusName} status from ${target.name}`
    };
}

// Modify status stacks
export function modifyStatusStacks(
    gameState: GameState,
    target: Character,
    statusName: string,
    stackChange: number
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: 'Character has no statuses array'
        };
    }
    
    const status = getStatus(target.statuses, statusName);
    if (!status) {
        return {
            success: false,
            message: `${target.name} does not have ${statusName} status`
        };
    }
    
    // Store old stacks for comparison
    const oldStacks = status.stacks;
    
    // Update stacks
    status.stacks = Math.max(0, Math.min(status.max_stacks, status.stacks + stackChange));
    
    // If stacks reduced to 0, remove the status and emit a single REMOVED event
    if (status.stacks === 0) {
        // Remove the status
        target.statuses = target.statuses.filter(s => s.name !== statusName);
        
        // Emit a single event indicating the status was removed due to 0 stacks
        emitStatusEvent(status, target, 'REMOVED', Math.abs(stackChange));
        
        return {
            success: true,
            message: `Removed ${statusName} from ${target.name} as stacks reached 0`
        };
    }
    
    // Otherwise, emit a stack change event
    const action = stackChange > 0 ? 'STACKS_INCREASED' : 'STACKS_DECREASED';
    
    emitStatusEvent(status, target, action, Math.abs(stackChange));
    
    return {
        success: true,
        message: `Modified ${statusName} stacks on ${target.name} from ${oldStacks} to ${status.stacks}`
    };
}

// Remove statuses with zero stacks
export function removeStatusesWithZeroStacks(
    gameState: GameState,
    target: Character
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: 'Character has no statuses array'
        };
    }
    
    const statusesToRemove = target.statuses.filter(s => s.stacks === 0);
    
    // Emit events for each removed status
    statusesToRemove.forEach(status => {
        emitStatusEvent(status, target, 'REMOVED');
    });
    
    // Filter out statuses with zero stacks
    target.statuses = target.statuses.filter(s => s.stacks > 0);
    
    return {
        success: true,
        message: `Removed ${statusesToRemove.length} zero-stack statuses from ${target.name}`
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
