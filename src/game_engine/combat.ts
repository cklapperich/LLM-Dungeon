import { Character } from '../types/actor.ts';
import { makeSkillCheck, makeOpposedCheck} from './utils/skillCheck.js';
import { SkillName } from '../types/skilltypes.ts';
import { Trait } from '../types/abilities';
import { TargetType, CharacterType } from '../types/constants';
import { UIAction, TraitUIAction, BaseUIAction } from '../react_ui/types/uiTypes';
import { GameState, getCharactersFromIdList } from '../types/gamestate';
import { CombatState, initializeCombatState, startNewRound } from './combatState';
import { applyEffect } from '../types/effect.js';
import { generateInitialNarration, generateRoundNarration } from './combatNarration.js';
import { processStateBasedActions } from './stateBasedActions';

// Initialize combat state with given game state
export async function initializeCombat(gameState: GameState, room_id: string, narrate: boolean = true): Promise<CombatState> {
    const characterIds = Object.keys(gameState.characters);
    if (characterIds.length !== 2) {
        throw new Error('Combat must be initialized with exactly 2 characters');
    }

    // Get the characters and initialize combat state
    const characters = characterIds.map(id => gameState.characters[id]) as [Character, Character];
    console.log('Characters in combat:', characters.map(c => ({ name: c.name, type: c.type })));
    
    const state = initializeCombatState(characterIds, characters, room_id);

    // Find the monster and set its actions
    const monster = getCharactersFromIdList(state.characterIds, gameState).find(c => c.type === CharacterType.MONSTER);
    console.log('Found monster for player:', monster?.name);
    if (!monster) {
        throw new Error('No monster character found in combat');
    }
    
    const actions = getLegalActions(monster, state, gameState);
    console.log('Initial legal actions:', actions.map(a => a.type));
    state.playerActions = actions;

    // Generate initial narration after state is set up
    if (narrate) {
        state.combatLog[0].narrations.push(await generateInitialNarration(state, gameState));
    }

    return state;
}

// Check if a trait is legal for the current actor
export function isLegalAction(trait: Trait, state: CombatState, gameState: GameState): boolean {
    // For now, all traits are legal unless explicitly disabled
    return true;
}

// Special system actions that are always available
const systemActions: BaseUIAction[] = [
    {
        type: 'PASS',
        label: 'Pass',
        category: 'system',
        tooltip: 'End your turn without taking any action'
    },
    {
        type: 'RETREAT',
        label: 'Retreat',
        category: 'system',
        disabled: true,
        tooltip: 'Cannot retreat during combat'
    }
];

// Get all legal actions for a given actor
export function getLegalActions(actor: Character, state: CombatState, gameState: GameState): UIAction[] {
    console.log('Getting legal actions for:', actor.name);
    console.log('Actor traits:', actor.traits);
    
    const actions: UIAction[] = [];

    // Add system actions first
    actions.push(...systemActions);
    console.log('Added system actions:', systemActions.map(a => a.type));

    // Add all traits from the actor
    actor.traits.forEach(trait => {
        console.log('Processing trait:', trait.name);
        
        // Skip if ability is on cooldown
        if (trait.cooldown?.current > 0) {
            console.log('Trait on cooldown:', trait.name);
            return;
        }

        const action: TraitUIAction = {
            type: trait.name,
            label: trait.name,
            category: 'trait',
            trait
        };

        // Add target for abilities that need one
        if (trait.target === TargetType.OPPONENT) {
            // Find the target character (the one that's not the actor)
            const actorId = state.characterIds.find(id => gameState.characters[id] === actor);
            const targetId = state.characterIds.find(id => id !== actorId);
            console.log('Target check:', { actorId, targetId });
            if (targetId && gameState.characters[targetId]) {
                actions.push(action);
                console.log('Added opponent-targeted action:', action.type);
            }
        } else {
            actions.push(action);
            console.log('Added non-targeted action:', action.type);
        }
    });

    console.log('Final legal actions:', actions.map(a => a.type));
    return actions;
}

// Get actions for current actor (used by combat/AI logic)
export function getCurrentActorActions(state: CombatState, gameState: GameState): UIAction[] {
    const actor = getCharactersFromIdList(state.characterIds, gameState)[state.activeCharacterIndex];
    return getLegalActions(actor, state, gameState);
}

// Get monster's actions (used to update playerActions)
export function getMonsterActions(state: CombatState, gameState: GameState): UIAction[] {
    const monster = getCharactersFromIdList(state.characterIds, gameState).find(c => c.type === CharacterType.MONSTER);
    console.log('Getting monster actions for:', monster?.name);
    const actions = monster ? getLegalActions(monster, state, gameState) : [];
    console.log('Monster actions:', actions.map(a => a.type));
    return actions;
}


// Execute a trait
export async function executeTrait(
    trait: Trait, 
    actor: Character, 
    target: Character | undefined, 
    state: CombatState,
    gameState: GameState
): Promise<CombatState> {
    if (!isLegalAction(trait, state, gameState)) {
        throw new Error('Illegal trait attempted');
    }
    
    let skillCheck;
    if (target && target !== actor) {
        // Perform opposed skill check
        skillCheck = makeOpposedCheck(
            actor, 
            trait.skill as SkillName,
            target,
            undefined, // Let the system determine the opposing skill
            trait.modifier ?? 0
        );
    } else {
        // Perform regular skill check
        skillCheck = makeSkillCheck(
            actor, 
            trait.skill as SkillName,
            trait.modifier ?? 0
        );
    }
    
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

    // Log the initial action
    currentRoundLog.combatLogs.push(
        `${actor.name} used ${trait.name}${target ? ` on ${target.name}` : ''}`
    );

    // For opposed checks, we need to access the attacker's result
    const result = target ? skillCheck.attacker : skillCheck;
    
    // Log skill check result with description
    currentRoundLog.combatLogs.push(
        `${actor.name} rolled ${result.roll} vs target ${result.attribute} (${result.success ? 'Success' : 'Failure'} by ${Math.abs(result.margin)})`
    );
    currentRoundLog.combatLogs.push(result.description);

    
    // Only apply effects if the skill check succeeded
    if (result.success) {
        // Apply each effect in the trait
        trait.effects.forEach(effect => {
            try {
                // Pass the full game state to apply effect
                const updatedGameState = {
                    ...gameState,
                    activeCombat: state
                };
                applyEffect(effect, actor, target ?? actor, updatedGameState);
                // Only log successful effects to combat log
                currentRoundLog.combatLogs.push(
                    `Applied ${effect.type} effect${effect.params.value ? ` with value ${effect.params.value}` : ''}`
                );
            } catch (error) {
                // Log technical errors to console only
                console.error(`Error applying ${effect.type} effect:`, error);
                // Add a generic failure message to combat log
                currentRoundLog.combatLogs.push(
                    `${actor.name}'s ${effect.type} effect failed`
                );
            }
        });
    }

    // Move to next character
    state.activeCharacterIndex = (state.activeCharacterIndex + 1) % state.characterIds.length;

    // If we've wrapped around to the start, narrate and start new round
    if (state.activeCharacterIndex === 0) {
        state.combatLog[state.round - 1].narrations.push(await generateRoundNarration(state, gameState));
        const characters = state.characterIds.map(id => gameState.characters[id]) as [Character, Character];
        await startNewRound(state, characters);
    }

    // Update player actions
    const monster = getCharactersFromIdList(state.characterIds, gameState).find(c => c.type === CharacterType.MONSTER);
    console.log('Updating player actions for monster:', monster?.name);
    if (monster) {
        const actions = getLegalActions(monster, state, gameState);
        console.log('Updated player actions:', actions.map(a => a.type));
        state.playerActions = actions;
    }

    // Check state-based actions after the action resolves
    return processStateBasedActions(state, gameState);
}
