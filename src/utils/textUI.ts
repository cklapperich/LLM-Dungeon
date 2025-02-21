import { RollResult, OpposedCheckResult } from '../types/skilltypes.js';
import { DungeonLayout } from '../types/dungeon.js';

/**
 * Format a skill check result for display
 */
export function formatRollResult(result: RollResult): string {
    const successText = result.success ? "SUCCESS" : "FAILURE";
    const criticalText = result.isCriticalSuccess ? " (CRITICAL SUCCESS!)" :
                        result.isCriticalFailure ? " (CRITICAL FAILURE!)" : "";
    
    return `Roll: ${result.roll} vs ${result.attribute} = ${successText}${criticalText}\n` +
           `Margin: ${result.margin} (${result.intensity})` +
           (result.description ? `\n${result.description}` : '');
}

/**
 * Format an opposed check result for display
 */
export function formatOpposedResult(result: OpposedCheckResult): string {
    return "Attacker:\n" +
           formatRollResult(result.attacker) + "\n\n" +
           "Defender:\n" +
           formatRollResult(result.defender) + "\n\n" +
           `Winner: ${result.attackerWins ? "Attacker" : "Defender"}`;
}

/**
 * Display a dungeon layout as ASCII art
 */
export function formatDungeonLayout(dungeon: DungeonLayout): string {
    return '\nDungeon Layout:\n' + 
        dungeon.grid.map(row => 
            row.map(cell => {
                if (cell === 0) return '  '; // Empty space
                if (cell === 1) return '██'; // Corridor
                // Room - get first 2 chars of name
                const room = dungeon.rooms[cell];
                return room ? room.name.substring(0, 2) : '??';
            }).join(' ')
        ).join('\n');
}

/**
 * Display detailed information about a room
 */
export function formatRoomInfo(dungeon: DungeonLayout, roomId: number, adjacentRooms: number[]): string {
    const room = dungeon.rooms[roomId];
    
    // Group adjacent rooms by name
    const connections = adjacentRooms.map(id => {
        const adjRoom = dungeon.rooms[id];
        return adjRoom?.name || 'Unknown Room';
    });
    
    return `\nRoom Name: ${room.name}\n` +
           `Description: ${room.description}\n` +
           `Capacity: ${room.capacity}\n` +
           `Can be trapped: ${room.canBeTrapped}\n` +
           'Connected to: ' + connections.join(', ');
}
