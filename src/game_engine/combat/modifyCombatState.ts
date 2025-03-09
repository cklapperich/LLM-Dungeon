import { Character } from '../../types/actor';
import { GameActionResult } from '../../types/gamestate';
import { GrappleType, BodyPartType, CombatEndReasonType } from '../../types/constants';
import { createStatus, hasStatus, getStatus } from '../statusEffects';
import { StatusEvent, CombatEvent } from '../../events/eventTypes';
import { logAndEmitCombatEvent } from './combatLogManager';
import { CombatState} from '../../types/combatState';
import { StatusName } from '../../types/status';
import { canBindLimb, trackBoundLimb, BindablePart } from './grapplingRules';

const message_default = 'MESSAGE STRING NOT SUPPORTED';

export function applyGrapple(
    state: CombatState,
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
        
        // Create and emit status event
        const statusEvent: StatusEvent = {
            type: 'STATUS',
            status: grappleStatus,
            target,
            action: 'ADDED'
        };
        logAndEmitCombatEvent(statusEvent, state);
    }

    // If penetrating, add penetrated status
    if (type === GrappleType.PENETRATE) {
        if (!hasStatus(target.statuses, StatusName.PENETRATED)) {
            const penetratedStatus = createStatus(StatusName.PENETRATED);
            target.statuses.push(penetratedStatus);
            
            // Create and emit status event for new penetrated status
            const statusEvent: StatusEvent = {
                type: 'STATUS',
                status: penetratedStatus,
                target,
                action: 'ADDED'
            };
            logAndEmitCombatEvent(statusEvent, state);
        }
    }

    // If a limb type was specified, try to bind it
    if (limbType) {
        if (!canBindLimb(target, limbType)) {
            return {
                success: false,
                message: message_default
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
            
            // Create and emit status event for stack increase
            const stackIncreaseEvent: StatusEvent = {
                type: 'STATUS',
                status: boundStatus,
                target,
                action: 'STACKS_INCREASED',
                stackChange: 1
            };
            logAndEmitCombatEvent(stackIncreaseEvent, state);
        } else {
            // Create and add new bound status
            const newBoundStatus = createStatus(statusName);
            target.statuses.push(newBoundStatus);
            
            // Create and emit status event for new bound status
            const newStatusEvent: StatusEvent = {
                type: 'STATUS',
                status: newBoundStatus,
                target,
                action: 'ADDED'
            };
            logAndEmitCombatEvent(newStatusEvent, state);
        }
    }

    return {
        success: true,
        message: message_default
    };
}

export function applyStatus(
    state: CombatState,
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
            message: message_default 
        };
    }

    // Check if status already exists
    const existingStatus = getStatus(target.statuses, params.type);
    if (existingStatus) {
        // Check if we can stack more
        if (existingStatus.stacks >= existingStatus.max_stacks) {
            return {
                success: false,
                message: message_default
            };
        }
        // Increment stacks
        existingStatus.stacks++;
        
        // Create and emit status event for stack increase
        const stackIncreaseEvent: StatusEvent = {
            type: 'STATUS',
            status: existingStatus,
            target,
            action: 'STACKS_INCREASED',
            stackChange: 1
        };
        logAndEmitCombatEvent(stackIncreaseEvent, state);
        
        return {
            success: true,
            message: message_default
        };
    }

    // Create and apply new status
    const status = createStatus(params.type, params);
    target.statuses.push(status);
    
    // Create and emit status event for new status
    const newStatusEvent: StatusEvent = {
        type: 'STATUS',
        status: status,
        target,
        action: 'ADDED'
    };
    logAndEmitCombatEvent(newStatusEvent, state);

    return {
        success: true,
        message: message_default
    };
}

// Remove a status from a character
export function removeStatus(
    state: CombatState,
    target: Character,
    statusName: string
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: message_default
        };
    }
    
    const statusIndex = target.statuses.findIndex(s => s.name === statusName);
    if (statusIndex === -1) {
        return {
            success: false,
            message: message_default
        };
    }
    
    // Get the status before removing it
    const status = target.statuses[statusIndex];
    
    // Remove the status
    target.statuses.splice(statusIndex, 1);
    
    // Create and emit status event for removal
    const removedEvent: StatusEvent = {
        type: 'STATUS',
        status: status,
        target,
        action: 'REMOVED'
    };
    logAndEmitCombatEvent(removedEvent, state);
    
    return {
        success: true,
        message: message_default
    };
}

// Modify status stacks
export function modifyStatusStacks(
    state: CombatState,
    target: Character,
    statusName: string,
    stackChange: number
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: message_default
        };
    }
    
    const status = getStatus(target.statuses, statusName);
    if (!status) {
        return {
            success: false,
            message: message_default
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
        
        // Create and emit a single event indicating the status was removed due to 0 stacks
        const removedEvent: StatusEvent = {
            type: 'STATUS',
            status: status,
            target,
            action: 'REMOVED',
            stackChange: Math.abs(stackChange)
        };
        logAndEmitCombatEvent(removedEvent, state);
        
        return {
            success: true,
            message: message_default
        };
    }
    
    // Otherwise, emit a stack change event
    const action = stackChange > 0 ? 'STACKS_INCREASED' : 'STACKS_DECREASED';
    
    // Create and emit stack change event
    const stackChangeEvent: StatusEvent = {
        type: 'STATUS',
        status: status,
        target,
        action,
        stackChange: Math.abs(stackChange)
    };
    logAndEmitCombatEvent(stackChangeEvent, state);
    
    return {
        success: true,
        message: message_default
    };
}

// Remove statuses with zero stacks
export function removeStatusesWithZeroStacks(
    state: CombatState,
    target: Character
): GameActionResult {
    if (!target.statuses) {
        return {
            success: false,
            message: message_default
        };
    }
    
    const statusesToRemove = target.statuses.filter(s => s.stacks === 0);
    
    // Create and emit events for each removed status
    statusesToRemove.forEach(status => {
        const removedEvent: StatusEvent = {
            type: 'STATUS',
            status: status,
            target,
            action: 'REMOVED'
        };
        logAndEmitCombatEvent(removedEvent, state);
    });
    
    // Filter out statuses with zero stacks
    target.statuses = target.statuses.filter(s => s.stacks > 0);
    
    return {
        success: true,
        message: message_default
    };
}

export function updateStatusDurations(
    state: CombatState,
    character: Character
): GameActionResult {
    if (!character.statuses) {
        return {
            success: false,
            message: message_default
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
        message: message_default
    };
}

export function modifyClothing(
    state: CombatState,
    source: Character,
    target: Character,
    params: {
        amount: number;
    }
): GameActionResult {
    const { amount } = params;
    
    // Clothing can't go below 0 or above their max
    target.armor.current = Math.max(0, Math.min(target.armor.max, target.armor.current + amount));

    return {
        success: true,
        message: message_default
    };
}

export function applyWound(
    state: CombatState,
    source: Character,
    target: Character,
    params: {
        amount: number;
    }
): GameActionResult {
    const { amount } = params;

    target.vitality.current = Math.max(0, target.vitality.current - amount);

    return {
        success: true,
        message: message_default
    };
}

export async function applyEndCombat(
    state: CombatState,
    winner: Character,
    reason: CombatEndReasonType | string
): Promise<GameActionResult> {
    // Mark combat as complete
    state.isComplete = true;
    
    // Set winner and reason on the combat state
    state.winner = winner;
    state.endReason = reason as CombatEndReasonType;
    
    // Emit combat end event
    const combatEndEvent: CombatEvent = {
        type: 'PHASECHANGE',
        subtype: 'END' as const,
        round: state.round,
        winner,
        reason,
        room: state.room,
        characters: state.characters // Include all characters for proper logging
    };
    await logAndEmitCombatEvent(combatEndEvent, state);
    
    return {
        success: true,
        message: message_default
    };
}
