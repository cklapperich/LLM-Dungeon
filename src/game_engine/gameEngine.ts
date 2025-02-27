// core game engine

import { GameState, GameRoundLog, GameAction, AddMonsterToRoomAction, CombatGameAction } from '../types/gamestate';
import { Trait } from '../types/abilities';
import { createNewCombat, executeCombatRound } from './combat/combatEngine';
import { UIAction, UIActionResult, UIActionType } from '../react_ui/uiTypes';
import { GameEvent, CombatPhaseChangedEvent, CombatStartEndEvent, MonsterAddedEvent } from '../events/eventTypes';
import { CharacterType, CombatEndReason, CombatEndReasonType, MonsterSize } from '../types/constants';
import { Character } from '../types/actor';
import { Room } from '../types/dungeon';
/**
 * Populates the game log with event information
 * @param event The game event to log
 * @param gameState The current game state
 */
export async function populateGameLog(event: GameEvent, gameState: GameState): Promise<void> {
    // Initialize game log if it doesn't exist
    if (!gameState.gameLog) {
        gameState.gameLog = [];
    }
    
    // Get current day/turn log or create a new one
    let currentLog = gameState.gameLog.find(log => 
        log.day === gameState.dayCounter && log.turn === gameState.turnCounter
    );
    
    if (!currentLog) {
        currentLog = {
            events: [],
            debugLog: [],
            day: gameState.dayCounter,
            turn: gameState.turnCounter
        };
        gameState.gameLog.push(currentLog);
    }
    
    // Add the event
    currentLog.events.push(event);
    
    // Add a simple debug log entry
    const debugLog = `[${new Date().toISOString()}] ${event.type} event occurred`;
    currentLog.debugLog.push(debugLog);
}

/**
 * Moves a character to a specific room and checks if combat should start
 * @param gameState The current game state
 * @param characterId The ID of the character to move
 * @param roomId The ID of the destination room
 * @returns The updated game state
 */
export async function moveCharacterToRoom(
    gameState: GameState, 
    character: Character, 
    room: Room
): Promise<GameState> {
    // Get character and room
    // TODO: logic to end combat on a room end or throw an error if active combat in this room, if necessary.
    // could check combatstate's room to see if it matches the room we're trying to move to

    // Remove character from current room
    Object.values(gameState.dungeon.rooms).forEach(r => {
        r.characters = r.characters.filter(char => char.id !== character.id);
    });
    
    // Add character to new room
    room.characters.push(character);
    
    // Check if combat should start
    await checkAndInitializeCombat(gameState, room);
    
    return gameState;
}

/**
 * Checks if combat should be initialized in a room and starts it if needed
 * @param gameState The current game state
 * @param roomId The ID of the room to check
 */
export async function checkAndInitializeCombat(
    gameState: GameState, 
    room: Room
): Promise<void> {   
    const characters = room.characters;
    // If there are at least 2 characters in the room, start combat
    if (room.characters.length >= 2) {
        // Create combat state
        gameState.activeCombat = await createNewCombat(characters, room, gameState.settings);
        gameState.currentPhase = 'combat';
        
        // Log the combat start event to game log
        const combatStartEvent: CombatStartEndEvent = {
            type: 'COMBAT_STATE_CHANGE',
            subtype: 'START',
            room: room,
            characters: gameState.activeCombat.characters
        };
        
        await populateGameLog(combatStartEvent, gameState);
    }
}

/**
 * Ends combat and updates the game state
 * @param gameState The current game state
 * @param winner The character who won the combat (optional)
 * @param reason The reason combat ended (optional)
 */
export async function endCombat(
    gameState: GameState, 
    winner?: Character, 
    reason?: CombatEndReasonType
): Promise<void> {
    if (!gameState.activeCombat) {
        return;
    }
    
    // Create combat end event
    const endEvent: CombatStartEndEvent = {
        type: 'COMBAT_STATE_CHANGE',
        subtype: 'END',
        characters: gameState.activeCombat.characters,
        winner,
        reason,
        room: gameState.activeCombat.room
    };
    
    // Log to game log
    await populateGameLog(endEvent, gameState);
    
    // Update game state
    gameState.activeCombat = null;
    gameState.currentPhase = 'planning'; // Or whatever the default phase should be
    
    // Update available actions
    gameState.gameActions = generateAvailableActions(gameState);
}

/**
 * Executes an action from the UI
 * @param gameState The current game state
 * @param action The UI action to execute
 * @returns The result of the action
 */
/**
 * Generates a list of available game actions based on the current game state
 * @param gameState The current game state
 * @returns List of available game actions
 */
export function generateAvailableActions(gameState: GameState): GameAction[] {
    const actions: GameAction[] = [];
    
    // Check if we're in planning phase
    if (gameState.currentPhase !== 'planning') {
        return actions;
    }
    
    // Get all monsters that can be placed
    const availableMonsters = gameState.characters ? 
        Object.values(gameState.characters).filter(char => char.type === CharacterType.MONSTER) : 
        [];
    
    // Get all empty rooms
    const emptyRooms = Object.values(gameState.dungeon.rooms)
        .filter(room => room.characters.length === 0);
    
    // Generate add monster actions for each valid monster-room combination
    for (const monster of availableMonsters) {
        for (const room of emptyRooms) {
            // Create the action for the game state
            const gameAction: AddMonsterToRoomAction = {
                type: 'ADD_MONSTER_TO_ROOM',
                name: `Add ${monster.name} to ${room.name}`,
                description: `Place ${monster.name} in ${room.name}`,
                monsterId: monster.id,
                roomId: room.id
            };
            
            // Check if monster size fits room capacity
            if (monster.size && monster.size > room.capacity) {
                gameAction.disabled = true;
                gameAction.disabledReason = `${monster.name} (size ${monster.size}) is too large for ${room.name} (capacity ${room.capacity})`;
            }
            
            // Add the action to the list
            actions.push(gameAction);
        }
    }
    
    return actions;
}

/**
 * Converts a GameAction to a UIAction
 * @param gameAction The game action to convert
 * @returns The corresponding UI action
 */
export function convertGameActionToUIAction(gameAction: GameAction): UIAction {
    if (gameAction.type === 'ADD_MONSTER_TO_ROOM') {
        const monsterAction = gameAction as AddMonsterToRoomAction;
        
        // Create a UIAction for dungeon context
        return {
            name: monsterAction.name,
            context: UIActionType.DUNGEON,
            disabled: monsterAction.disabled || false,
            tooltips: [monsterAction.description],
            disabledReason: monsterAction.disabledReason,
            gameAction: gameAction // Include the original game action
        };
    } else if (gameAction.type === 'combat') {
        const combatAction = gameAction as CombatGameAction;
        
        // Create a UIAction for combat context
        return {
            name: combatAction.name,
            context: UIActionType.COMBAT,
            disabled: combatAction.disabled || false,
            tooltips: [combatAction.description],
            disabledReason: combatAction.disabledReason,
            gameAction: combatAction
        };
    }
    
    // Default case (should not happen)
    throw new Error(`Unknown action type: ${gameAction.type}`);
}

/**
 * Converts all game actions to UI actions
 * @param gameState The game state containing game actions
 * @returns The corresponding UI actions
 */
export function getUIActionsFromGameState(gameState: GameState): UIAction[] {
    if (!gameState.gameActions) {
        // Generate actions if they don't exist
        gameState.gameActions = generateAvailableActions(gameState);
    }
    
    // Convert each game action to a UI action
    return gameState.gameActions.map(action => convertGameActionToUIAction(action));
}

export async function executeActionFromUI(gameState: GameState, action: UIAction): Promise<UIActionResult> {
    let success = false;
    let message = '';
    
    try {
        if (gameState.activeCombat) {
            if (action.context === UIActionType.COMBAT) {
                // Handle combat actions
                if (action.name === 'Exit Combat') {
                    // Handle explicit exit combat action
                    if (gameState.activeCombat?.isComplete) {
                        await endCombat(gameState, gameState.activeCombat.winner, gameState.activeCombat.endReason);
                    } else {
                        throw new Error('Cannot exit combat that is not complete');
                    }
                } else {
                    // Handle normal combat actions
                    const combatAction = action.gameAction as CombatGameAction;
                    const trait = combatAction.trait;
                    const newCombatState = await executeCombatRound(gameState.activeCombat, trait);
                    gameState.activeCombat = newCombatState;
                }
                
                success = true;
                
                // Update available actions if combat is still active
                if (gameState.activeCombat) {
                    gameState.gameActions = generateAvailableActions(gameState);
                }
            } else {
                throw new Error(`Invalid action context during combat: ${action.context}`);
            }
        } else {
            // Handle non-combat actions
            if (action.gameAction.type === 'ADD_MONSTER_TO_ROOM') {
                // Use the gameAction property for game-specific logic
                const gameAction = action.gameAction as AddMonsterToRoomAction;
                const { monsterId, roomId } = gameAction;
                
                // Get monster and room
                const monster = gameState.characters[monsterId];
                const room = gameState.dungeon.rooms[roomId];
                
                if (!monster || !room) {
                    throw new Error('Invalid monster or room ID');
                }
                
                // Check if room is empty
                if (room.characters.length > 0) {
                    throw new Error('Room is not empty');
                }
                
                // Check monster size vs room capacity
                if (monster.size && monster.size > room.capacity) {
                    throw new Error(`Monster size (${monster.size}) exceeds room capacity (${room.capacity})`);
                }
                
                // Add monster to room
                room.characters.push(monster);
                
                // Create event for game log
                const monsterAddedEvent: MonsterAddedEvent = {
                    type: 'MONSTER_ADDED',
                    monster,
                    room
                };
                
                await populateGameLog(monsterAddedEvent, gameState);
                
                // Update available actions
                gameState.gameActions = generateAvailableActions(gameState);
                
                success = true;
                message = `${monster.name} added to ${room.name}`;
            } else {
                throw new Error(`Unknown action type: ${action.gameAction.type}`);
            }
        }
    } catch (error) {
        success = false;
        message = error instanceof Error ? error.message : 'An unknown error occurred';
    }

    // Prepare the result
    const result = {
        success: success,
        newState: gameState,
        message
    };
    return result;
}
