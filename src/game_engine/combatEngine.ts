/**
 * This file exists to handle the mechanics and flow of the combat system without
 * directly modifying game state.
 * 
 * The key architectural principle is that this file focuses on WHAT should happen
 * during combat (skill checks, action validation, combat flow, etc.) but delegates
 * HOW state changes to gameActions.ts. This creates a clean separation between
 * combat logic and state modification.
 * 
 * This separation allows the combat system to evolve independently of how state
 * changes are implemented, making it easier to:
 * 1. Modify combat rules without risking state corruption
 * 2. Add new combat mechanics without touching state modification code
 * 3. Test combat logic in isolation
 * 4. Maintain a clear boundary between game rules and state management
 */
import {combatEventBus} from './eventBus.ts';
import { Character } from '../types/actor.ts';
import { makeSkillCheck, makeOpposedCheck} from './utils/skillCheck.js';
import { SkillName, RollResult, Skills } from '../types/skilltypes.ts';
import { Trait } from '../types/abilities.ts';
import { CharacterType } from '../types/constants.ts';
import { GameState, getCharactersFromIdList } from '../types/gamestate.ts';
import { CombatState, createCombatState } from '../types/combatState.ts';
import { applyEffect } from './effect.js';
import { processBetweenActions, processBetweenRounds } from './stateBasedActions.ts';
import { getAvailableActions } from './getAvailableActions.ts';
import { getAIAction } from './ai.ts';
import { CombatUIAction, UIActionResult } from '../react_ui/types/uiTypes.ts';
import { processInitiative } from './utils/skillCheck';
import {
    SkillCheckEvent,
    AbilityEvent,
    EffectEvent,
    CombatEvent,
    InitiativeEvent
} from './events/eventTypes';

const eventContext='combat';

// Convert game actions to UI actions
export function convertToUIActions(actionData: { actions: Trait[], reasons: Record<string, string> }): CombatUIAction[] {
    return actionData.actions.map(action => {
        const isDisabled = action.name in actionData.reasons;
        const tooltip = actionData.reasons[action.name];
            
        return {
            type: action.name,
            label: action.name,
            description: action.description,
            disabled: isDisabled ? true : false,
            tooltip: tooltip,
            rarity: action.rarity,
            skill: action.skill,
            defenseOptions: action.defenseOptions,
            modifier: action.modifier,
            priority: action.priority,
            effects: action.effects
        };
    });
}

export function setupInitialTurnOrder(
    state: CombatState,
    characters: [Character, Character],
    gameState: GameState
): void {
    // Roll initial initiative
    const initiativeResult = processInitiative(characters[0], characters[1], gameState);
    const [init1, init2] = initiativeResult.initiatives;
    
    // Store actual initiative values
    const [char1, char2] = characters;
    char1.initiative = init1;
    char2.initiative = init2;
    
    // Lower initiative goes first
    const firstActor = init1 <= init2 ? char1 : char2;
    state.activeCharacterIndex = characters.indexOf(firstActor);
    
    // Get full roll results from initiative checks
    const check1 = makeSkillCheck(char1, Skills.INITIATIVE, 0, gameState);
    const check2 = makeSkillCheck(char2, Skills.INITIATIVE, 0, gameState);

    // Create and push initiative event
    const initiativeEvent: InitiativeEvent = {
        type: 'INITIATIVE',
        characters: [char1, char2],
        results: [check1, check2],
        first_actor: firstActor
    };
    combatEventBus.emit(`${eventContext}:${initiativeEvent.type}`, initiativeEvent);
}

export async function initializeCombat(gameState: GameState, roomId: string): Promise<CombatState> {
    const characterIds = Object.keys(gameState.characters);
    if (characterIds.length !== 2) {
        throw new Error('Combat must be initialized with exactly 2 characters');
    }

    const characters: [Character, Character] = [
        gameState.characters[characterIds[0]],
        gameState.characters[characterIds[1]]
    ];
    
    // Create basic state
    const state = createCombatState(characterIds, roomId);

    // Set up initial turn order
    setupInitialTurnOrder(state, characters, gameState);

    // Get monster's actions
    const monster = getCharactersFromIdList(state.characterIds, gameState)
        .find(c => c.type === CharacterType.MONSTER);
    if (!monster) {
        throw new Error('No monster character found in combat');
    }
    const actionData = getAvailableActions(monster, state, gameState);
    state.playerActions = convertToUIActions(actionData);

    // Emit combat start event
    const combatStartEvent: CombatEvent = {
        type: 'COMBAT',
        subtype: 'START' as const,
        characters,
        room_id: roomId
    };
    combatEventBus.emit(`${eventContext}:${combatStartEvent.type}`, combatStartEvent);
    return state;
}

// Execute a trait
export async function executeTrait(
    trait: Trait, 
    actor: Character, 
    target: Character | undefined, 
    state: CombatState,
    gameState: GameState
): Promise<CombatState> {    
    // Emit ability event
    const abilityEvent: AbilityEvent = {
        type: 'ABILITY',
        actor,
        ability: trait,
        target
    };
    combatEventBus.emit(`${eventContext}:${abilityEvent.type}`, abilityEvent);
    
    let skillCheckResult = null;
    if (trait.skill!==Skills.NONE){
        // Perform skill check
        // Get modifier from trait
        const modifier = trait.modifier ?? 0;
        let skillCheck;
        if (target && target !== actor) {
            // Perform opposed skill check
            skillCheck = makeOpposedCheck(
                actor, 
                trait.skill,
                target,
                undefined, // Let the system determine the opposing skill
                modifier,
                gameState
            );
        } else {
            // Perform regular skill check
            skillCheck = makeSkillCheck(
                actor, 
                trait.skill,
                modifier,
                gameState
            );
        }

        // For opposed checks, we need to access the attacker's result
        skillCheckResult = target ? skillCheck.attacker : skillCheck;
        
        // Emit skill check event
        const skillCheckEvent: SkillCheckEvent = {
            type: 'SKILL_CHECK',
            actor,
            target,
            skill: trait.skill,
            result: skillCheckResult,
            is_opposed: !!target,
            opposed_result: target ? skillCheck.defender : undefined
        };
        combatEventBus.emit(`${eventContext}:${skillCheckEvent.type}`, skillCheckEvent);

    }
    // Apply effects that should happen regardless of success/failure
    trait.effects.forEach(effect => {
        // if apply on failure, or apply on success and the check was successful, or no skill check, apply effect
        if (effect.applyOnSkillCheckFailure || trait.skill!==Skills.NONE || skillCheckResult.success) {
            // Pass the full game state to apply effect
            const updatedGameState = {
                ...gameState,
                activeCombat: state
            };
            // Use effect's target to determine who to apply it to
            const effectTarget = effect.target === 'other' ? target : actor;
            const effectResult = applyEffect(effect, actor, effectTarget, updatedGameState);
            
            // Emit effect event
            const effectEvent: EffectEvent = {
                type: 'EFFECT',
                effect,
                source: actor,
                target: effectTarget,
                success: effectResult.success
            };
            combatEventBus.emit(`${eventContext}:${effectEvent.type}`, effectEvent);
        }
    });
    return state;
}

export function handleCombatEnd(
    state: CombatState,
    gameState: GameState,
    winner: Character,
    reason: string
): void {
    // Mark combat as complete
    state.isComplete = true;
    
    // Emit combat end event
    const combatEndEvent: CombatEvent = {
        type: 'COMBAT',
        subtype: 'END' as const,
        winner,
        reason
    };
    combatEventBus.emit(`${eventContext}:${combatEndEvent.type}`, combatEndEvent);
}

export async function executeCombatRound(state: CombatState, gameState: GameState, playerAction: Trait) {
    // Get characters for this round
    const characterArray = getCharactersFromIdList(state.characterIds, gameState);
    if (characterArray.length !== 2) {
        throw new Error('Combat round requires exactly 2 characters');
    }
    const characters: [Character, Character] = [characterArray[0], characterArray[1]];
    
    // Get actors in initiative order for the upcoming round
    const initiativeResult = processInitiative(characters[0], characters[1], gameState);
    const [init1, init2] = initiativeResult.initiatives;
    
    // Store actual initiative values
    const [char1, char2] = characters;
    char1.initiative = init1;
    char2.initiative = init2;
    
    // Lower initiative goes first
    const firstActor = init1 <= init2 ? char1 : char2;
    state.activeCharacterIndex = characters.indexOf(firstActor);
    const secondActor = characters[1 - state.activeCharacterIndex];
    
    // First actor's turn
    if (firstActor.type === CharacterType.MONSTER) {
        await executeTrait(playerAction, firstActor, secondActor, state, gameState);
    } else {
        const aiAction = getAIAction(firstActor, state, gameState);
        await executeTrait(aiAction, firstActor, secondActor, state, gameState);
    }

    // Process any state-based actions (status effects, etc)
    await processBetweenActions(state, gameState);
    
    // Second actor's turn
    if (secondActor.type === CharacterType.MONSTER) {
        await executeTrait(playerAction, secondActor, firstActor, state, gameState);
    } else {
        const aiAction = getAIAction(secondActor, state, gameState);
        await executeTrait(aiAction, secondActor, firstActor, state, gameState);
    }
    
    // Process any state-based actions (dead actors, etc)
    await processBetweenActions(state, gameState);
    
    // Process round-based effects (like cooldowns)
    processBetweenRounds(state, gameState);

    // Increment round counter
    state.round += 1;
    
    // Get full roll results from initiative checks
    const check1 = makeSkillCheck(char1, Skills.INITIATIVE, 0, gameState);
    const check2 = makeSkillCheck(char2, Skills.INITIATIVE, 0, gameState);

    // Emit initiative event for next round
    const initiativeEvent: InitiativeEvent = {
        type: 'INITIATIVE',
        characters: [char1, char2],
        results: [check1, check2],
        first_actor: firstActor
    };
    combatEventBus.emit(`${eventContext}:${initiativeEvent.type}`, initiativeEvent);
    
    return state;
}

export async function executeActionFromUI(gameState: GameState, action: CombatUIAction): Promise<UIActionResult> {
    try {
        // Get the current combat state
        const state = gameState.activeCombat;
        
        // Convert UI action back to trait format
        const trait: Trait = {
            name: action.type,
            description: action.description,
            rarity: action.rarity,
            skill: action.skill,
            defenseOptions: action.defenseOptions,
            modifier: action.modifier,
            priority: action.priority,
            effects: action.effects
        };

        // Execute the combat round with this trait
        const updatedState = await executeCombatRound(state, gameState, trait);
        
        // Update monster's actions before returning to UI
        const monster = getCharactersFromIdList(updatedState.characterIds, gameState)
            .find(c => c.type === CharacterType.MONSTER);
        if (monster) {
            const actionData = getAvailableActions(monster, updatedState, gameState);
            updatedState.playerActions = convertToUIActions(actionData);
        }
        
        // Return success result with updated state
        return {
            success: true,
            newState: {
                ...gameState,
                activeCombat: updatedState
            }
        };
    } catch (error) {
        // Return failure result with original state and error message
        return {
            success: false,
            newState: gameState,
            message: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}
