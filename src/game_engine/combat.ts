import { Character } from '../types/actor.ts';
import { makeSkillCheck, makeOpposedCheck, rollInitiative} from './utils/skillCheck.js';
import { RollResult, SkillName } from '../types/skilltypes.ts';
import { Trait } from '../types/abilities';
import { TargetType } from '../types/constants';
import { UIAction, TraitUIAction, BaseUIAction } from '../react_ui/types/uiTypes';
import { CombatState, ActionResult } from '../types/gamestate';

// Initialize combat state with given characters
export function initializeCombat(characters: Character[]): CombatState {
    // Set initial initiative for each character
    characters.forEach(char => {
        char.initiative = rollInitiative(char);
    });

    // Sort characters by initiative (lower goes first)
    const sortedCharacters = [...characters].sort(
        (a, b) => (a.initiative ?? 0) - (b.initiative ?? 0)
    );

    return {
        roomId: 'combat-room',
        characters: sortedCharacters,
        round: 1,
        isComplete: false,
        activeCharacterIndex: 0,
        current_turn: 'player',
        legalActions: [],
        actionResults: []
    };
}

// Check if a trait is legal for the current actor
export function isLegalAction(trait: Trait, state: CombatState): boolean {
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

// Get all legal actions for the current actor and store them in combat state
export function getLegalActions(actor: Character, state: CombatState): UIAction[] {
    const actions: UIAction[] = [];

    // Add system actions first
    actions.push(...systemActions);

    // Add all traits from the actor
    actor.traits.forEach(trait => {
        const action: TraitUIAction = {
            type: trait.name,
            label: trait.name,
            category: 'trait',
            trait
        };

        // Add target for abilities that need one
        if (trait.target === TargetType.OPPONENT) {
            // Find the target character (the one that's not the actor)
            const target = state.characters.find(char => char !== actor);
            if (target) {
                actions.push(action);
            }
        } else {
            actions.push(action);
        }
    });

    // Store filtered actions in combat state
    return actions;
}

// Process state-based actions (like ongoing effects, vitality loss, etc)
export function processStateBasedActions(state: CombatState): CombatState {
    // Check each character for state-based effects
    state.characters.forEach(char => {
        // Check for defeat conditions
        if (char.vitality <= 0 || char.conviction <= 0) {
            state.isComplete = true;
        }
    });

    return state;
}

// Execute a trait
export function executeTrait(trait: Trait, actor: Character, target: Character | undefined, state: CombatState): CombatState {
    if (!isLegalAction(trait, state)) {
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
    
    // Create action result
    const result: ActionResult = {
        trait,
        actor,
        target,
        success: skillCheck.success,
        message: `${actor.name} used ${trait.name}`,
        margin: skillCheck.margin
    };
    
    // Record the result
    state.actionResults.push(result);
    
    // Apply each effect in the trait
    trait.effects.forEach(effect => {
        // TODO: Apply effect based on type
        // For now, just log it
        console.log(`Applying effect: ${effect.type} with value ${effect.value}`);
    });

    // Move to next character
    state.activeCharacterIndex = (state.activeCharacterIndex + 1) % state.characters.length;

    // If we've wrapped around to the start, advance to next round
    if (state.activeCharacterIndex === 0) {
        state.round += 1;
        // Roll new initiative for each character
        state.characters.forEach(char => {
            char.initiative = rollInitiative(char);
        });
        // Sort characters by new initiative values
        state.characters.sort(
            (a, b) => (a.initiative ?? 0) - (b.initiative ?? 0)
        );
    }

    // Check state-based actions after the action resolves
    return processStateBasedActions(state);
}
