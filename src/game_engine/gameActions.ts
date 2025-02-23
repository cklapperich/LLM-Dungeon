import { Character } from '../types/actor.ts';
import { GameState, getCharactersFromIdList } from '../types/gamestate.ts';
import { UIAction, TraitUIAction, BaseUIAction } from '../react_ui/types/uiTypes';
import { executeTrait, getLegalActions } from './combat';
import { Trait } from '../types/abilities';
import { CharacterType, CombatFlags, GrappleType, type GrappleTypes } from '../types/constants';
import { getAIAction } from './ai';

// Base interface for all game actions
export interface GameActionResult {
    success: boolean;
    message?: string;  // Optional message for logging/debugging
}

// Extended result that includes the new game state
export interface ExecuteActionResult extends GameActionResult {
    newState: GameState;
}

// Main action executor that handles all UI actions
export async function executeAction(
    gameState: GameState,
    action: UIAction
): Promise<ExecuteActionResult> {
    // Base validation
    if (!gameState.activeCombat) {
        return {
            success: false,
            message: 'No active combat',
            newState: gameState
        };
    }

    const combat = gameState.activeCombat;
    let updatedState = {...gameState};

    // Execute actions based on character type
    const characters = getCharactersFromIdList(combat.characterIds, gameState);
    const currentActor = characters[combat.activeCharacterIndex];
    const targetActor = characters.find(c => c !== currentActor)!;

    // First actor's turn
    if (currentActor.type === CharacterType.HERO) {
        // AI goes first
        const aiAction = getAIAction(combat, updatedState);
        if (aiAction.category === 'trait') {
            const aiTrait: Trait = {
                name: (aiAction as TraitUIAction).type,
                ...(aiAction as TraitUIAction).trait
            };
            updatedState.activeCombat = await executeTrait(
                aiTrait,
                currentActor,
                targetActor,
                combat,
                updatedState
            );
        }
    } else {
        // Player goes first
        const playerTrait: Trait = {
            name: (action as TraitUIAction).type,
            ...(action as TraitUIAction).trait
        };
        updatedState.activeCombat = await executeTrait(
                playerTrait,
                currentActor,
                targetActor,
                combat,
                updatedState
        );
    }

    // Next actor's turn
    const nextCharacters = getCharactersFromIdList(updatedState.activeCombat.characterIds, updatedState);
    const nextActor = nextCharacters[updatedState.activeCombat.activeCharacterIndex];
    const nextTarget = nextCharacters.find(c => c !== nextActor)!;

    if (nextActor.type === CharacterType.HERO) {
        // AI goes second
        const aiAction = getAIAction(updatedState.activeCombat, updatedState);
        if (aiAction.category === 'trait') {
            const aiTrait: Trait = {
                name: (aiAction as TraitUIAction).type,
                ...(aiAction as TraitUIAction).trait
            };
            updatedState.activeCombat = await executeTrait(
                aiTrait,
                nextActor,
                nextTarget,
                updatedState.activeCombat,
                updatedState
            );
        }
    } else {
        // Player goes second
        const playerTrait: Trait = {
            name: (action as TraitUIAction).type,
            ...(action as TraitUIAction).trait
        };
        updatedState.activeCombat = await executeTrait(
            playerTrait,
                nextActor,
                nextTarget,
            updatedState.activeCombat,
            updatedState
        );
    }

    return {
        success: true,
        newState: updatedState
    };
}

// Wound action interface
export interface WoundActionParams {
    amount: number;
}

// Grapple action interface
export interface GrappleActionParams {
    type: GrappleTypes;  // The type of grapple (grab or penetrate)
}

export function applyGrapple(
    gameState: GameState,
    source: Character,
    target: Character,
    params: GrappleActionParams
): GameActionResult {
    // Validate parameters
    if (!Object.values(GrappleType).includes(params.type)) {
        return { success: false, message: 'Invalid grapple type' };
    }

    // Set appropriate flags based on type
    if (params.type === GrappleType.GRAB) {
        target.flags[CombatFlags.GRAPPLED] = 1;
    } else if (params.type === GrappleType.PENETRATE) {
        target.flags[CombatFlags.PENETRATED] = 1;
    }
    
    return { 
        success: true,
        message: `${source.name} has ${params.type}d ${target.name}`
    };
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
