import { GameState } from '../types/gamestate.js';
import { Character } from '../types/actor.js';
// Use Vite's import.meta.glob to import all monster JSON files
const monsterFiles = import.meta.glob('@assets/monsters/*.json', { eager: true });
const heroFiles = import.meta.glob('@assets/heroes/*.json', { eager: true });
import profanedTempleJson from '@assets/dungeons/profaned_temple.json';
import { loadDungeonFromJson } from '../game_engine/utils/dungeonUtils.js';
import { loadMonster } from '@/game_engine/utils/dataLoader.js';
import {getSettings} from '../game_engine/settings.js';

// Process these files to separate heroes and monsters
export function loadAllCharacters() {
    const heroes: Record<string, Character> = {};
    const monsters: Record<string, Character> = {};
    
    Object.values(monsterFiles).forEach((module: any) => {
      const character = loadMonster(module.default);
      character.type = 'monster'
      monsters[character.id] = character;
    });
    
    Object.values(heroFiles).forEach((module: any) => {
        const character = loadMonster(module.default);
        character.type = 'hero'
        heroes[character.id] = character;
      });
      
    return { heroes, monsters };
  }

/**
 * Creates a test game state with default values
 */
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
    const { heroes, monsters } = loadAllCharacters();
    const dungeon = loadDungeonFromJson(JSON.stringify(profanedTempleJson));
    const settings = getSettings();
    
    return {
        settings: settings,
        turnCounter: 0,
        dayCounter: 0,
        dungeon,
        heroes: heroes,
        monsters:monsters,
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
    const gameState = createTestGameState();
    const hero_values = Object.values(gameState.heroes)    
    const hero = hero_values[0];
    // Get the first room from the dungeon
    const roomId = Object.keys(gameState.dungeon.rooms)[0];
    console.log(roomId)
    const room = gameState.dungeon.rooms[roomId];
    
    // Add both characters to the room
    room.characters = [hero];
    
    return gameState;
}

/**
 * Creates a test game state with a hero in one room and a monster in another
 * This is useful for testing combat initialization by moving characters
 */
export function createTestStateWithSeparateCharacters(): GameState {
    // Create characters
    const gameState = createTestGameState();
    const hero_values = Object.values(gameState.heroes)    
    const hero = hero_values[0];
    const monster_values = Object.values(gameState.monsters)    
    const monster = monster_values[0];

    // Initialize characters array for all rooms
    Object.values(gameState.dungeon.rooms).forEach(room => {
        if (!room.characters) {
            room.characters = [];
        }
    });
    
    // Get two different rooms from the dungeon
    const rooms = Object.values(gameState.dungeon.rooms);
    if (rooms.length < 2) {
        throw new Error('Dungeon needs at least 2 rooms for this test state');
    }
    //add the hero to a room
    rooms[0].characters.push(hero);
    rooms[1].characters.push(monster);
    return gameState; 
}
