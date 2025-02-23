import { DungeonLayout, Room } from '../../types/dungeon.ts';
import { RoomType } from '../../types/constants.ts';
import { GameState } from '../../types/gamestate.ts';
import { Character } from '../../types/actor.ts';

export function getAdjacentRooms(layout: DungeonLayout, roomId: string): string[] {
    const rooms: string[] = [];
    const grid = layout.grid;
    
    // Find the room's coordinates
    let roomX = -1, roomY = -1;
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === roomId) {
                roomX = x;
                roomY = y;
                break;
            }
        }
        if (roomX !== -1) break;
    }
    
    // Check all 4 directions
    const directions = [
        [0, -1], // North
        [1, 0],  // East
        [0, 1],  // South
        [-1, 0]  // West
    ];
    
    for (const [dx, dy] of directions) {
        const newX = roomX + dx;
        const newY = roomY + dy;
        
        // Check bounds
        if (newY >= 0 && newY < grid.length && 
            newX >= 0 && newX < grid[newY].length) {
            const value = grid[newY][newX];
            // If it's a string, it's a room ID (not RoomType.EMPTY which is 0)
            if (typeof value === 'string') {
                rooms.push(value);
            }
        }
    }
    
    return rooms;
}

interface DungeonJson {
    name: string;
    description: string;
    templates: Room[];
    grid: number[][]; // Raw grid from JSON uses all numbers
}

// Get all characters in a specific room
export function getCharactersInRoom(gameState: GameState, roomId: string): Character[] {
    const room = gameState.dungeon.rooms[roomId];
    if (!room) {
        throw new Error(`Room ${roomId} not found`);
    }
    return room.actorIds.map(id => {
        const character = gameState.characters[id];
        if (!character) {
            throw new Error(`Character ${id} not found in game state`);
        }
        return character;
    });
}

// Find which room a character is in
export function findCharacterRoom(gameState: GameState, characterId: string): Room | null {
    for (const room of Object.values(gameState.dungeon.rooms)) {
        if (room.actorIds.includes(characterId)) {
            return room;
        }
    }
    return null;
}

// Move a character to a different room
export function moveCharacterToRoom(gameState: GameState, characterId: string, targetRoomId: string): void {
    // Remove from current room if in one
    const currentRoom = findCharacterRoom(gameState, characterId);
    if (currentRoom) {
        currentRoom.actorIds = currentRoom.actorIds.filter(id => id !== characterId);
    }

    // Add to new room
    const targetRoom = gameState.dungeon.rooms[targetRoomId];
    if (!targetRoom) {
        throw new Error(`Target room ${targetRoomId} not found`);
    }
    
    // Verify character exists in game state
    if (!gameState.characters[characterId]) {
        throw new Error(`Character ${characterId} not found in game state`);
    }

    targetRoom.actorIds.push(characterId);
}

export function loadDungeonFromJson(json: string): DungeonLayout {
    const data = JSON.parse(json) as DungeonJson;
    const rooms: Record<string, Room> = {};
    
    // Create a new grid that will use string IDs
    const newGrid: (typeof RoomType.EMPTY | string)[][] = 
        data.grid.map(row => row.map(() => RoomType.EMPTY));
    
    // Create room instances and populate new grid
    data.grid.forEach((row, y) => {
        row.forEach((templateValue, x) => {
            // Skip empty cells (0)
            if (templateValue === 0) {
                return;
            }
            
            // Process template IDs
            const template = data.templates.find(t => t.templateId === templateValue);
            if (!template) {
                throw new Error(`No template found for template ID ${templateValue}`);
            }
            
            // Create a new room with a unique ID based on template name and coordinates
            const uniqueRoomId = `${template.templateName}_${x}_${y}`;
            rooms[uniqueRoomId] = {
                ...template,
                id: uniqueRoomId,
                templateId: template.templateId,
                actorIds: [], // Initialize with empty array of actor ID
                flags: {},
            };
            
            // Update new grid with string ID
            newGrid[y][x] = uniqueRoomId;
        });
    });

    return {
        grid: newGrid,
        rooms,
        templates: data.templates
    };
}
