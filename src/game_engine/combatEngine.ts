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

import { Character } from '../types/actor.ts';
import { makeSkillCheck, makeOpposedCheck} from './utils/skillCheck.js';
import { SkillName } from '../types/skilltypes.ts';
import { Trait } from '../types/abilities.ts';
import { CharacterType } from '../types/constants.ts';
import { GameState, getCharactersFromIdList } from '../types/gamestate.ts';
import { CombatState, createCombatState } from '../types/combatState.ts';
import { applyEffect } from './effect.js';
import { generateInitialNarration, generateRoundNarration, generateAfterMathNarration } from './combatNarration.js';
import { processBetweenActions, processBetweenRounds } from './stateBasedActions.ts';
import { getAvailableActions } from './getAvailableActions.ts';
import { getAIAction } from './ai.ts';
import { CombatUIAction, UIActionResult } from '../react_ui/types/uiTypes.ts';
import { processInitiative } from './utils/skillCheck';

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
    
    // Log initiative with actual values
    state.combatLog[0].combatLogs.push(
        `${firstActor.name} moves first! (${char1.name}: ${init1}, ${char2.name}: ${init2}) ${initiativeResult.description}`
    );
}

export async function initializeCombat(gameState: GameState, roomId: string): Promise<CombatState> {
    const characterIds = Object.keys(gameState.characters);
    if (characterIds.length !== 2) {
        throw new Error('Combat must be initialized with exactly 2 characters');
    }

    const characters = characterIds.map(id => gameState.characters[id]) as [Character, Character];
    
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

    // Add initial narration
    state.combatLog[0].narrations.push(
        gameState.narrationEnabled 
            ? await generateInitialNarration(state, gameState)
            : `Combat begins between ${characters[0].name} and ${characters[1].name}.`
    );

    return state;
}
/*
* Note: Roll information must match pattern "{word} rolled {number} vs target {number}"
* for LLM filtering in llm.ts
*/
// Execute a trait
export async function executeTrait(
    trait: Trait, 
    actor: Character, 
    target: Character | undefined, 
    state: CombatState,
    gameState: GameState
): Promise<CombatState> {    
    // Get or create the current round's log
    let currentRoundLog = state.combatLog.find(log => log.round === state.round);
    if (!currentRoundLog) {
        currentRoundLog = {
            combatLogs: [],
            round: state.round,
            narrations: []
        };
        state.combatLog.push(currentRoundLog);
    }

    // Log the action and its description
    currentRoundLog.combatLogs.push(`${actor.name} used ${trait.name}!`);
    currentRoundLog.combatLogs.push(`[${trait.description}]`);

    // Skip skill check for "None" skill traits (system actions)
    if (trait.skill === "None") {
        // Apply effects directly for system actions
        trait.effects.forEach(effect => {
            const updatedGameState = {
                ...gameState,
                activeCombat: state
            };
            // Use effect's target to determine who to apply it to
            const effectTarget = effect.target === 'other' ? target : actor;
            const effectResult = applyEffect(effect, actor, effectTarget, updatedGameState);
            currentRoundLog.combatLogs.push(effectResult.message);
        });
        return state;
    }

    // Get modifier from trait
    const modifier = trait.modifier ?? 0;
    let skillCheck;
    if (target && target !== actor) {
        // Perform opposed skill check
        skillCheck = makeOpposedCheck(
            actor, 
            trait.skill as SkillName,
            target,
            undefined, // Let the system determine the opposing skill
            modifier,
            gameState
        );
    } else {
        // Perform regular skill check
        skillCheck = makeSkillCheck(
            actor, 
            trait.skill as SkillName,
            modifier,
            gameState
        );
    }

    // For opposed checks, we need to access the attacker's result
    const result = target ? skillCheck.attacker : skillCheck;
    
    // Log skill check result with description
    currentRoundLog.combatLogs.push(
        `${actor.name} rolled ${result.roll} vs target ${result.attribute} (${result.success ? 'Success' : 'Failure'} by ${Math.abs(result.margin)})`
    );
    currentRoundLog.combatLogs.push(result.description);

    // Apply effects that should happen regardless of success/failure
    trait.effects.forEach(effect => {
        if (effect.applyOnSkillCheckFailure || result.success) {
            // Pass the full game state to apply effect
            const updatedGameState = {
                ...gameState,
                activeCombat: state
            };
            // Use effect's target to determine who to apply it to
            const effectTarget = effect.target === 'other' ? target : actor;
            const effectResult = applyEffect(effect, actor, effectTarget, updatedGameState);
            
            // Log the result message to combat log
            currentRoundLog.combatLogs.push(effectResult.message);
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
    const currentRoundLog = state.combatLog[state.round - 1];
    
    // Mark combat as complete
    state.isComplete = true;
    
    // Log the victory
    currentRoundLog.combatLogs.push(
        `Combat ended - ${winner.name} wins (${reason})`
    );
}

export async function executeCombatRound(state: CombatState, gameState: GameState, playerAction: Trait) {
    // Get characters for this round
    const characters = getCharactersFromIdList(state.characterIds, gameState) as [Character, Character];
    
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
    
    // Generate narration for the current round if enabled
    if (gameState.narrationEnabled) {
        const narration = await generateRoundNarration(state, gameState);
        state.combatLog[state.round].narrations.push(narration);
    }
    
    // Increment round counter and create new round log
    state.round += 1;
    state.combatLog.push({
        combatLogs: [],
        round: state.round,
        narrations: []
    });
    
    // Log initiative for next round
    state.combatLog[state.round].combatLogs.push(
        `${firstActor.name} moves first! ${initiativeResult.description}`
    );
    
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
