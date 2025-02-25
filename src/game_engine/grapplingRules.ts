import { Character } from '../types/actor';
import { GameState, GameActionResult } from '../types/gamestate';
import { BodyPartType, CombatFlags } from '../types/constants';
import { createStatus, hasStatus, getStatus } from './statusEffects';
import { StatusName } from '../types/status';
import { Status } from '../types/status';
import { modifyStatusStacks, removeStatus, removeStatusesWithZeroStacks, applyStatus } from './modifyGameState';

const BINDABLE_PARTS = [
    BodyPartType.ARM,
    BodyPartType.LEG, 
    BodyPartType.MOUTH,
    BodyPartType.TAIL
] as const;

export type BindablePart = typeof BINDABLE_PARTS[number];

export function isCharacterGrappled(character: Character): boolean {
    return hasStatus(character.statuses, StatusName.GRAPPLED);
}

export function isCharacterPenetrated(character: Character): boolean {
    return hasStatus(character.statuses, StatusName.PENETRATED);
}

// Get total bound limbs from statuses
export function getTotalBoundLimbs(character: Character): Partial<Record<BindablePart, number>> {
    const result: Partial<Record<BindablePart, number>> = {};
    
    // Check bound status for each limb type
    BINDABLE_PARTS.forEach(part => {
        const statusName = `bound_${String(part).toLowerCase()}${part === BodyPartType.ARM || part === BodyPartType.LEG ? 's' : ''}`;
        const boundStatus = getStatus(character.statuses, statusName);
        if (boundStatus && boundStatus.stacks > 0) {
            result[part] = boundStatus.stacks;
        }
    });
    
    return result;
}

// Track binding during grapple. NO NEED TO EMIT events,.
export function trackBoundLimb(character: Character, limbType: BindablePart, effectId: string): void {
    const grappleStatus = getStatus(character.statuses, StatusName.GRAPPLED);
    if (!grappleStatus) return;
    
    // Add to bound during grapple tracking
    const boundArray = grappleStatus.params.boundDuringGrapple[limbType];
    if (boundArray) {
        boundArray.push(effectId);
    }
}

// Remove random bound limb that was bound during the current grapple instance
export function removeRandomBoundLimbThisGrapple(
    gameState: GameState,
    character: Character
): boolean {
    const grappleStatus = getStatus(character.statuses, StatusName.GRAPPLED);
    if (!grappleStatus) return false;

    // Get all limb types with bindings during this grapple
    const boundTypes = BINDABLE_PARTS.filter(part => 
        grappleStatus.params.boundDuringGrapple[part].length > 0
    );

    if (boundTypes.length === 0) return false;

    // Pick random bound type
    const randomType = boundTypes[Math.floor(Math.random() * boundTypes.length)];
    const effects = grappleStatus.params.boundDuringGrapple[randomType];
    
    if (effects.length > 0) {
        // Remove random effect
        // this is fine cause we're not modifying the status
        const effectId = effects[Math.floor(Math.random() * effects.length)];
        effects.splice(effects.indexOf(effectId), 1);
        
        // Reduce bound status stack using modifyStatusStacks
        const statusName = `bound_${randomType.toLowerCase()}${randomType === BodyPartType.ARM || randomType === BodyPartType.LEG ? 's' : ''}`;
        modifyStatusStacks(gameState, character, statusName, -1);
        
        return true;
    }

    return false;
}

// Remove all limbs bound during current grapple
export function removeAllBoundLimbs(
    gameState: GameState,
    character: Character
): void {
    const grappleStatus = getStatus(character.statuses, StatusName.GRAPPLED);
    if (!grappleStatus) return;

    // For each limb type
    BINDABLE_PARTS.forEach(part => {
        const effects = grappleStatus.params.boundDuringGrapple[part];
        const statusName = `bound_${part.toLowerCase()}${part === BodyPartType.ARM || part === BodyPartType.LEG ? 's' : ''}`;
        
        // Remove stacks equal to number of effects using modifyStatusStacks
        if (effects.length > 0) {
            modifyStatusStacks(gameState, character, statusName, -effects.length);
        }
        
        // Clear effects array
        effects.length = 0;
    });
}

// Check if a limb can be bound
export function canBindLimb(character: Character, limbType: BindablePart): boolean {
    // Get current bound count
    const statusName = `bound_${limbType.toLowerCase()}${limbType === BodyPartType.ARM || limbType === BodyPartType.LEG ? 's' : ''}`;
    const boundStatus = getStatus(character.statuses, statusName);
    const currentBound = boundStatus?.stacks || 0;
    
    // Get total limbs of this type (now using primitive number)
    const totalLimbs = character.limbs[limbType] || 0;
    
    return currentBound < totalLimbs;
}

/**
 * Handle successful break free skill check for a grappled or penetrated character
 * First removes penetration if penetrated, then removes all bindings from current grapple
 */
export function applyBreakFreeSkillcheckSuccess(
    gameState: GameState,
    source: Character,
    target: Character
): GameActionResult {
    // Apply exhaustion using applyStatus
    let exhaustionStatus = getStatus(target.statuses, StatusName.EXHAUSTION);
    if (!exhaustionStatus) {
        applyStatus(gameState, source, target, { type: StatusName.EXHAUSTION });
    } else {
        modifyStatusStacks(gameState, target, StatusName.EXHAUSTION, 1);
    }

    // If penetrated, handle penetration first
    if (isCharacterPenetrated(target)) {
        // First remove a random limb bound during this grapple
        removeRandomBoundLimbThisGrapple(gameState, target);
        
        // Remove penetrated status using removeStatus
        removeStatus(gameState, target, StatusName.PENETRATED);
    }

    // Free all limbs bound during this grapple instance
    removeAllBoundLimbs(gameState, target);

    // Remove grapple status using removeStatus
    removeStatus(gameState, target, StatusName.GRAPPLED);

    // Remove any bound statuses with 0 stacks
    removeStatusesWithZeroStacks(gameState, target);

    return {
        success: true,
        message: `${target.name} broke free`
    };
}
