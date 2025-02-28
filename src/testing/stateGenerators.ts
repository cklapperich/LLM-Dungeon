import { GameState } from '../types/gamestate.js';
import { Character } from '../types/actor.js';
import claraJson from '../../public/data/monsters/clara.json';
import greenSlimeJson from '../../public/data/monsters/green_slime.json';
import profanedTempleJson from '../../public/data/dungeons/profaned_temple.json';
import { loadMonster } from '../game_engine/utils/dataLoader.js';
import { loadDungeonFromJson } from '../game_engine/utils/dungeonUtils.js';
/**
 * Creates default test characters (Clara and Green Slime)
 */
export function createDefaultTestCharacters(): { player: Character; monster: Character } {
    return {
        player: loadMonster(claraJson),
        monster: loadMonster(greenSlimeJson)
    };
}

/**
 * Creates a test game state with default values
 */
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    // Load the profaned temple dungeon
    const dungeon = loadDungeonFromJson(JSON.stringify(profanedTempleJson));

    return {
        settings: { narrationEnabled: false },
        turnCounter: 0,
        dayCounter: 0,
        dungeon,
        deck: { baseMonsters: [], traits: [], traps: [] },
        infamy: 0,
        dailyPacksRemaining: 0,
        characters: {},
        currentPhase: 'planning',
        activeCombat: null,
        waveCounter: 0,
        waveHistory: [],
        ...overrides
    };
}

/**
 * Creates a test game state with two characters in the same room
 * This is the main function to use for testing scenarios that need
 * a dungeon with characters in it
 */
export function createTestStateWithCharactersInRoom(): GameState {
    // Create characters
    const { player, monster } = createDefaultTestCharacters();
    
    // Create game state with characters
    const gameState = createTestGameState({
        characters: {
            [player.id]: player,
            [monster.id]: monster
        }
    });
    
    // Get the first room from the dungeon
    const roomId = Object.keys(gameState.dungeon.rooms)[0];
    const room = gameState.dungeon.rooms[roomId];
    
    // Add both characters to the room
    room.characters = [player, monster];
    
    return gameState;
}

/**
 * Creates a test game state with a hero in one room and a monster in another
 * This is useful for testing combat initialization by moving characters
 */
export function createTestStateWithSeparateCharacters(): GameState {
    // Create characters
    const { player, monster } = createDefaultTestCharacters();
    
    // Ensure player is hero type and monster is monster type
    player.type = 'hero';
    monster.type = 'monster';
    
    // Create game state with characters
    const gameState = createTestGameState({
        settings: { narrationEnabled: false },
        characters: {
            [player.id]: player,
            [monster.id]: monster
        },
        gameActions: [] // Initialize with empty array
    });
    
    // Initialize characters array for all rooms
    Object.values(gameState.dungeon.rooms).forEach(room => {
        if (!room.characters) {
            room.characters = [];
        }
    });
    
    // Get two different rooms from the dungeon
    const roomIds = Object.keys(gameState.dungeon.rooms);
    if (roomIds.length < 2) {
        throw new Error('Dungeon needs at least 2 rooms for this test state');
    }
    
    // Add player to the first room
    const playerRoom = gameState.dungeon.rooms[roomIds[0]];
    playerRoom.characters.push(player);
    
    // Add monster to the second room
    const monsterRoom = gameState.dungeon.rooms[roomIds[1]];
    monsterRoom.characters.push(monster);
    
    // Skip generating available actions for now
    // We'll let the game engine handle this when needed
    
    return gameState;
}
