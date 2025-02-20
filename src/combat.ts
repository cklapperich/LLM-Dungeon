import { Character } from './types/actor.js';
import { abilities } from './abilities.js';
import { makeSkillCheck, makeOpposedCheck, rollInitiative} from './utils/skillCheck.js';
import { RollResult, SkillName } from './types/skilltypes.js';

// Types for combat state management
export type CombatAction = {
    type: 'ability';
    actor: Character;
    target?: Character;
    abilityName: string;
    result?: RollResult;
};

export type CombatState = {
    round: number;
    characters: Character[];
    initiatives: Map<Character, number>;
    activeCharacterIndex: number;
    actions: CombatAction[];
    isComplete: boolean;
};


// Initialize combat state with given characters
export function initializeCombat(characters: Character[]): CombatState {
    const initiatives = new Map<Character, number>();
    characters.forEach(char => {
        initiatives.set(char, rollInitiative(char));
    });

    // Sort characters by initiative (lower goes first)
    const sortedCharacters = [...characters].sort(
        (a, b) => (initiatives.get(a) ?? 0) - (initiatives.get(b) ?? 0)
    );

    return {
        round: 1,
        characters: sortedCharacters,
        initiatives,
        activeCharacterIndex: 0,
        actions: [],
        isComplete: false
    };
}

// Check if an action is legal for the current actor
export function isLegalAction(action: CombatAction, state: CombatState): boolean {
    // All actions are abilities
    if (action.type !== 'ability' || !action.abilityName) {
        return false;
    }

    const ability = abilities[action.abilityName];
    if (!ability) {
        return false;
    }

    // Special case: Break Free requires being grappled
    if (ability.name === "Break Free") {
        return action.actor.grappleState > 0;
    }

    // Special case: Grapple requires target and target not being grappled
    if (ability.name === "Grapple") {
        return action.target !== undefined && 
               action.target.grappleState === 0;
    }

    return true;
}

// Get all legal actions for the current actor
export function getLegalActions(actor: Character, state: CombatState): CombatAction[] {
    const actions: CombatAction[] = [];

    // Add all abilities and filter based on conditions
    Object.entries(abilities).forEach(([abilityName, ability]) => {
        const action = {
            type: 'ability' as const,
            actor,
            abilityName
        };

        // Add target for abilities that need one
        if (ability.name === "Grapple") {
            state.characters.forEach(target => {
                if (target !== actor) {
                    actions.push({
                        ...action,
                        target
                    });
                }
            });
        } else {
            actions.push(action);
        }
    });

    // Filter to only legal actions
    return actions.filter(action => isLegalAction(action, state));
}

// Advance to the next round
export function advanceRound(state: CombatState): CombatState {
    // Roll new initiative for all characters
    state.characters.forEach(char => {
        state.initiatives.set(char, rollInitiative(char));
    });

    // Sort characters by new initiative values
    state.characters.sort(
        (a, b) => (state.initiatives.get(a) ?? 0) - (state.initiatives.get(b) ?? 0)
    );

    return {
        ...state,
        round: state.round + 1,
        activeCharacterIndex: 0,
        actions: []
    };
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

// Execute a combat action
export function executeCombatAction(action: CombatAction, state: CombatState): CombatState {
    if (!isLegalAction(action, state)) {
        throw new Error('Illegal combat action attempted');
    }

    // Get the ability definition
    const ability = abilities[action.abilityName];
    
    let skillCheck;
    if (action.target && action.target !== action.actor) {
        // Perform opposed skill check
        skillCheck = makeOpposedCheck(
            action.actor, 
            ability.skill as SkillName,
            action.target,
            undefined, // Let the system determine the opposing skill
            ability.modifier ?? 0
        );
    } else {
        // Perform regular skill check
        skillCheck = makeSkillCheck(
            action.actor, 
            ability.skill as SkillName,
            ability.modifier ?? 0
        );
    }
    
    // Store the skill check result
    action.result = skillCheck;
    
    // Record the action
    state.actions.push(action);
    
    // Apply the ability's effect with the skill check margin
    ability.effect(state, action.actor, action.target, skillCheck.margin);

    // Move to next character
    state.activeCharacterIndex = (state.activeCharacterIndex + 1) % state.characters.length;

    // If we've wrapped around to the start, advance to next round
    if (state.activeCharacterIndex === 0) {
        state = advanceRound(state);
    }

    // Check state-based actions after the action resolves
    return processStateBasedActions(state);
}
