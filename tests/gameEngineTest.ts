import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestStateWithCharactersInRoom } from '../src/testing/stateGenerators.js';
import { createNewCombat } from '../src/game_engine/combat/combatEngine.js';
import { CharacterType } from '../src/types/constants.js';

describe('Game Engine Tests', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up if needed
  });

  it('should create a game state with two characters in the same room', () => {
    // Create test game state with two characters in the same room
    const gameState = createTestStateWithCharactersInRoom();
    
    // Verify the state was created correctly
    expect(gameState).toBeDefined();
    expect(gameState.settings).toBeDefined();
    expect(gameState.settings.narrationEnabled).toBe(false);
    
    // Verify characters exist in the state
    expect(Object.keys(gameState.characters).length).toBe(2);
    
    // Get the first room and verify characters are in it
    const roomId = Object.keys(gameState.dungeon.rooms)[0];
    const room = gameState.dungeon.rooms[roomId];
    
    expect(room.characters.length).toBe(2);
    
    // Verify one character is a player and one is a monster
    const playerCharacter = room.characters.find(c => c.type === CharacterType.HERO);
    const monsterCharacter = room.characters.find(c => c.type === CharacterType.MONSTER);
    
    expect(playerCharacter).toBeDefined();
    expect(monsterCharacter).toBeDefined();
  });

  it('should initialize combat with characters from the same room', async () => {
    // Create test game state with two characters in the same room
    const gameState = createTestStateWithCharactersInRoom();
    
    // Get the first room and its characters
    const roomId = Object.keys(gameState.dungeon.rooms)[0];
    const room = gameState.dungeon.rooms[roomId];
    const characters = room.characters;
    
    // Initialize combat
    const combatState = await createNewCombat(characters, room, gameState.settings);
    
    // Verify combat was initialized correctly
    expect(combatState).toBeDefined();
    expect(combatState.characters).toHaveLength(2);
    expect(combatState.room).toBe(room);
    
    // Verify player actions were set up
    expect(combatState.playerActions).toBeDefined();
    expect(combatState.playerActions.length).toBeGreaterThan(0);
    
    // Verify combat log was initialized
    expect(combatState.combatLog).toBeDefined();
    expect(combatState.combatLog.length).toBeGreaterThan(0);
    
    // Verify round is set to 0 initially
    expect(combatState.round).toBe(0);
    
    // Verify combat is not complete
    expect(combatState.isComplete).toBe(false);
  });
});
