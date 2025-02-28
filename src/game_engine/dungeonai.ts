import { GameState } from '../types/gamestate';
import { Character } from '../types/actor';
import { Room } from '../types/dungeon';
import { CharacterType } from '../types/constants';
import { moveCharacterToRoom, populateGameLog } from './gameEngine';
import { getAdjacentRooms } from './utils/dungeonUtils';
import { HeroMovedEvent } from '../events/eventTypes';

// Flag key for tracking last room
export const LAST_ROOM_FLAG = 'last_room_id';

// Helper function to attempt moving a single hero
export async function attemptHeroMove(gameState: GameState, hero: Character): Promise<{success: boolean}> {
  // Find which room the hero is currently in
  let currentRoom: Room | undefined;
  for (const room of Object.values(gameState.dungeon.rooms)) {
    if (room.characters.some(c => c.id === hero.id)) {
      currentRoom = room;
      break;
    }
  }
  
  if (!currentRoom) return { success: false }; // Hero not in any room
  
  // Decide where to move
  const targetRoom = decideHeroMovement(gameState, hero, currentRoom);
  
  if (!targetRoom) return { success: false }; // No valid move available
  
  // Create event for game log
  const heroMovedEvent: HeroMovedEvent = {
    type: 'HERO_MOVED',
    hero,
    fromRoom: currentRoom,
    toRoom: targetRoom
  };
  
  // Move the hero
  await moveCharacterToRoom(gameState, hero, targetRoom);
  
  // Log the event
  await populateGameLog(heroMovedEvent, gameState);
  
  // Update the hero's last room flag
  if (!hero.flags) hero.flags = {};
  hero.flags[LAST_ROOM_FLAG] = currentRoom.id;
  
  return {success:true};
}

// Function to decide where a hero should move
function decideHeroMovement(gameState: GameState, hero: Character, currentRoom: Room): Room | null {
  // Get adjacent rooms
  const adjacentRoomIds = getAdjacentRooms(gameState.dungeon, currentRoom.id);
  
  // Filter out rooms with heroes
  const validRooms = adjacentRoomIds
    .map(id => gameState.dungeon.rooms[id])
    .filter(room => !roomContainsHero(room));
  
  if (validRooms.length === 0) return null; // No valid rooms to move to
  
  // Get the last room this hero was in from their flags
  const lastRoomId = hero.flags?.[LAST_ROOM_FLAG];
  
  // Filter out the last room if possible
  const preferredRooms = validRooms.filter(room => room.id !== lastRoomId);
  
  // If we have rooms that aren't the last room, choose from those
  // Otherwise, choose from all valid rooms
  const candidateRooms = preferredRooms.length > 0 ? preferredRooms : validRooms;
  
  // For now, just pick a random room from the candidates
  const randomIndex = Math.floor(Math.random() * candidateRooms.length);
  return candidateRooms[randomIndex];
}

// Helper function to check if a room contains any heroes
function roomContainsHero(room: Room): boolean {
  return room.characters.some(character => character.type === CharacterType.HERO);
}
