import { DungeonLayout, Room } from '../types/dungeon.js';
import { RoomType } from '../types/constants.js';

export function getAdjacentRooms(layout: DungeonLayout, roomId: number): number[] {
    const rooms: number[] = [];
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
            // If it's not empty, it's a room (either corridor or chamber)
            if (value !== RoomType.EMPTY) {
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
    grid: number[][];
}

export function loadDungeonFromJson(json: string): DungeonLayout {
    const data = JSON.parse(json) as DungeonJson;
    const rooms: Record<number, Room> = {};
    
    // Create room instances for every non-zero number in the grid
    data.grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== RoomType.EMPTY && !rooms[value]) {
                const template = data.templates[value - 1]; // -1 because grid uses 1-based indexing
                rooms[value] = {
                    ...template, // Copy all template properties
                    id: value,
                    actors: [],
                    monster: null,
                    trap: null
                };
            }
        });
    });

    return {
        grid: data.grid,
        rooms,
        templates: data.templates
    };
}
