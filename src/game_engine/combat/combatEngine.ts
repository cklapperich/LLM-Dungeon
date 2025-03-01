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
import { makeSkillCheck, makeOpposedCheck } from '../utils/skillCheck.ts';
import { logAndEmitCombatEvent as logAndEmitCombatEvent } from './combatLogManager.ts';
import { Character } from '../../types/actor.ts';
import { Skills } from '../../types/skilltypes.ts';
import { Trait } from '../../types/abilities.ts';
import { CharacterType, CombatEndReasonType } from '../../types/constants.ts';
import { CombatState, createCombatState } from '../../types/combatState.ts';
import { applyEffect } from './effect.ts';
import { processBetweenActions, processBetweenRounds } from './stateBasedActions.ts';
import { getAvailableActions as getAvailableCombatActions, checkRequirements } from './getAvailableActions.ts';
import { getAIAction } from './combatAI.ts';
import { CombatGameAction } from '../../types/gamestate.ts';
import { processInitiative } from '../utils/skillCheck.ts';
import {Room} from '../../types/dungeon.ts';

import {
    SkillCheckEvent,
    AbilityEvent,
    EffectEvent,
    CombatEvent,
    InitiativeEvent,
    CombatPhaseChangedEvent
} from '../../events/eventTypes.ts';
import { GameSettings } from '../../types/gamestate.ts';

export async function setupInitialTurnOrder(
    state: CombatState,
): Promise<void> {
    const characters = state.characters;
    // Roll initial initiative
    const initiativeResult = processInitiative(characters[0], characters[1], state);
    const [init1, init2] = initiativeResult.initiatives;
    
    // Store actual initiative values
    const [char1, char2] = characters;
    char1.initiative = init1;
    char2.initiative = init2;
    
    // Lower initiative goes first
    const firstActor = init1 <= init2 ? char1 : char2;
    state.activeCharacterIndex = characters.indexOf(firstActor);

    // Create and push initiative event
    const initiativeEvent: InitiativeEvent = {
        type: 'INITIATIVE',
        characters: [char1, char2],
        results: initiativeResult.rollResults,
        first_actor: firstActor
    };
    await logAndEmitCombatEvent(initiativeEvent, state);
}

export async function createNewCombat(characters:Character[], room: Room, gameSettings:GameSettings): Promise<CombatState> {
    // Get characters in the room - for testing, we'll just use the first two characters
    // In a real implementation, you'd need to determine which characters are in the room

    if (characters.length !== 2) {
        throw new Error('Combat must be initialized with exactly 2 characters');
    }

    // Create basic state with settings from gameState
    const state = createCombatState(characters, room, gameSettings);

    // Get monster's actions
    const monster = state.characters
        .find(c => c.type === CharacterType.MONSTER);
    if (!monster) {
        throw new Error('No monster character found in combat');
    }
    const actionData = getAvailableCombatActions(monster, state);
    const uiActions = convertToCombatUIActions(actionData);
    state.playerActions = uiActions;

    // Emit combat start event
    const combatStartEvent: CombatPhaseChangedEvent = {
        type: 'PHASECHANGE',
        subtype: 'START',
        characters: state.characters,
        room: room
    };

    await logAndEmitCombatEvent(combatStartEvent, state);
    
    return state;
}

// Execute a trait
export async function executeTrait(
    trait: Trait, 
    actor: Character, 
    target: Character | undefined, 
    state: CombatState
): Promise<CombatState> {    
    // Check requirements before proceeding
    const requirementsCheck = checkRequirements(actor, trait, state);
    
    // Emit ability event with success/failure info
    const abilityEvent: AbilityEvent = {
        type: 'ABILITY',
        actor,
        ability: trait,
        target,
        success: requirementsCheck.success,
        failureReason: !requirementsCheck.success ? requirementsCheck.reason : undefined
    };
    await logAndEmitCombatEvent(abilityEvent, state);
    
    // If requirements aren't met, exit early without applying effects
    if (!requirementsCheck.success) {
        return state;
    }
    
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
                modifier
            );
        } else {
            // Perform regular skill check
            skillCheck = makeSkillCheck(
                actor, 
                trait.skill,
                modifier
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
        await logAndEmitCombatEvent(skillCheckEvent, state);

    }
    // Apply effects that should happen regardless of success/failure
    for (const effect of trait.effects) {
        // if apply on failure, or apply on success and the check was successful, or no skill check, apply effect
        if (effect.applyOnSkillCheckFailure || trait.skill==Skills.NONE || skillCheckResult.success) {
            // Use effect's target to determine who to apply it to
            const effectTarget = effect.target === 'other' ? target : actor;
            const effectResult = await applyEffect(effect, actor, effectTarget, state);
            
            // Emit effect event
            const effectEvent: EffectEvent = {
                type: 'EFFECT',
                effect,
                source: actor,
                target: effectTarget,
                success: effectResult.success
            };
            await logAndEmitCombatEvent(effectEvent, state);
        }
    }
    return state;
}


export async function executeCombatRound(state: CombatState, playerAction:Trait) {

    // Increment round counter
    state.round += 1;
    
    // Get characters for this round
    const characterArray = state.characters;
    if (characterArray.length !== 2) {
        throw new Error('Combat round requires exactly 2 characters');
    }
    const characters: [Character, Character] = [characterArray[0], characterArray[1]];
    
    // Set up turn order - this is an async function so we need to await it
    await setupInitialTurnOrder(state);
    let firstActor = characters[state.activeCharacterIndex];
    let secondActor = characters[1 - state.activeCharacterIndex];
    
    // Get both actors' actions first
    let firstAction = firstActor.type === CharacterType.MONSTER ? 
        playerAction : getAIAction(firstActor, state);
    let secondAction = secondActor.type === CharacterType.MONSTER ?
        playerAction : getAIAction(secondActor, state);

    // priority check
    const priorities = [firstAction.priority, secondAction.priority]
    if (priorities[0] && !priorities[1]) {
        firstActor = characters[0]; secondActor = characters[1];
        firstAction = firstAction; secondAction = secondAction;
        }
    else if (priorities[0] && !priorities[1]) {
        firstActor = characters[1]; secondActor = characters[0];
        firstAction = secondAction; secondAction = firstAction;
    }
    
    // Execute first actor's turn
    await executeTrait(firstAction, firstActor, secondActor, state);

    // Process any state-based actions (status effects, etc)
    await processBetweenActions(state);
    
    if (!state.isComplete){ // cant act if ur dead/incapacitated/pumped full of semen
        // Execute second actor's turn
        await executeTrait(secondAction, secondActor, firstActor, state)
    }

    // Process any state-based actions (dead actors, etc)
    await processBetweenActions(state);
    
    // Process round-based effects (like cooldowns)
    processBetweenRounds(state);

    // Emit round end event
    const roundEndEvent: CombatEvent = {
        type: 'PHASECHANGE',
        subtype: 'ROUND_END',
        characters: characters,
        room: state.room,
    };

    await logAndEmitCombatEvent(roundEndEvent, state);
    
    // Update monster's actions before returning to UI
    state.playerActions = []
    const monster = state.characters
        .find(c => c.type === CharacterType.MONSTER);
    if (monster) {
        const actionData = getAvailableCombatActions(monster, state);
        state.playerActions = convertToCombatUIActions(actionData);
    }

    return state;
}

// Convert game actions to Combat Game Actions
export function convertToCombatUIActions(actionData: { actions: Trait[], reasons: Record<string, string> }): CombatGameAction[] {
    return actionData.actions.map(action => {
        const isDisabled = action.name in actionData.reasons;
        const tooltip = actionData.reasons[action.name];
            
        return {
            type: 'combat',
            name: action.name,
            description: tooltip || '',
            disabled: isDisabled,
            disabledReason: tooltip,
            trait: action,
            characterId: '' // This will be set when the action is used
        };
    });
}
