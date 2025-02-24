import { Character } from '../types/actor';
import { GameState } from '../types/gamestate';
import { BodyPartType, CombatFlags } from '../types/constants';
import { createStatus, hasStatus, getStatus } from './statusEffects';
import { StatusName } from '../types/status';
import { Status } from '../types/status';

const BINDABLE_PARTS = [
    BodyPartType.ARM,
    BodyPartType.LEG, 
    BodyPartType.MOUTH,
    BodyPartType.TAIL
] as const;

export type BindablePart = typeof BINDABLE_PARTS[number];

// Base interface for all game actions
export interface GameActionResult {
    success: boolean;
    message?: string;  // Optional message for logging/debugging
}

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

// Track binding during grapple
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
export function removeRandomBoundLimbThisGrapple(character: Character): boolean {
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
        const effectId = effects[Math.floor(Math.random() * effects.length)];
        effects.splice(effects.indexOf(effectId), 1);
        
        // Reduce bound status stack
        const statusName = `bound_${randomType.toLowerCase()}${randomType === BodyPartType.ARM || randomType === BodyPartType.LEG ? 's' : ''}`;
        const boundStatus = getStatus(character.statuses, statusName);
        if (boundStatus && boundStatus.stacks > 0) {
            boundStatus.stacks--;
        }
        
        return true;
    }

    return false;
}

// Remove all limbs bound during current grapple
export function removeAllBoundLimbs(character: Character): void {
    const grappleStatus = getStatus(character.statuses, StatusName.GRAPPLED);
    if (!grappleStatus) return;

    // For each limb type
    BINDABLE_PARTS.forEach(part => {
        const effects = grappleStatus.params.boundDuringGrapple[part];
        const statusName = `bound_${part.toLowerCase()}${part === BodyPartType.ARM || part === BodyPartType.LEG ? 's' : ''}`;
        const boundStatus = getStatus(character.statuses, statusName);
        
        // Remove stacks equal to number of effects
        if (boundStatus) {
            boundStatus.stacks = Math.max(0, boundStatus.stacks - effects.length);
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
    // Apply exhaustion
    let exhaustionStatus = getStatus(target.statuses, StatusName.EXHAUSTION);
    if (!exhaustionStatus) {
        exhaustionStatus = createStatus(StatusName.EXHAUSTION);
        target.statuses.push(exhaustionStatus);
    } else {
        exhaustionStatus.stacks = Math.min(4, exhaustionStatus.stacks + 1);
    }

    // If penetrated, handle penetration first
    if (isCharacterPenetrated(target)) {
        // First remove a random limb bound during this grapple
        removeRandomBoundLimbThisGrapple(target);
        
        // Remove penetrated status
        target.statuses = target.statuses.filter(s => s.name !== StatusName.PENETRATED);
    }

    // Free all limbs bound during this grapple instance
    removeAllBoundLimbs(target);
    
    // Remove grapple status
    target.statuses = target.statuses.filter(s => s.name !== StatusName.GRAPPLED);

    // Remove any bound statuses with 0 stacks
    target.statuses = target.statuses.filter(s => {
        if (s.name.startsWith('bound_')) {
            return s.stacks > 0;
        }
        return true;
    });

    return {
        success: true,
        message: `${target.name} broke free`
    };
}
