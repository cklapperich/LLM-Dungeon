import { RollResult, OpposedCheckResult } from '../../types/skilltypes.ts';
import { DungeonLayout } from '../../types/dungeon.ts';
import { Character } from '../../types/actor.ts';

/* TODO these are "suspicious" we shoouldnt need these right? these shoudl be moved into types/*.ts or better, use existing structures in 'types' folder */
interface GameInfo {
    turnCounter: number;
    dayCounter: number;
    infamy: number;
    dailyPacksRemaining: number;
}

interface Combat {
    roomId: string;
    turnCounter: number;
    initiative: number;
    grappleState: number;
    restrainedLimbs: string[];
}

/**
 * Format a skill check result for display
 */

/**
 * Format game info section
 */
export function formatGameInfo(info: GameInfo): string {
    return `
        <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-xl font-bold mb-2">Game Info</h2>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="font-bold">Turn:</span> ${info.turnCounter}
                    <span class="font-bold ml-4">Day:</span> ${info.dayCounter}
                </div>
                <div>
                    <span class="font-bold">Infamy:</span> ${info.infamy}
                    <span class="font-bold ml-4">Daily Packs:</span> ${info.dailyPacksRemaining}
                </div>
            </div>
        </div>
    `;
}

/**
 * Format actor (hero/monster) display
 */
export function formatActor(actor: Character): string {
    return `
        <div class="border-b border-gray-700 pb-2">
            <div class="font-bold">${actor.description || 'Unnamed Actor'}</div>
            <div>Vitality: ${actor.vitality}/${actor.maxVitality}</div>
            <div>Conviction: ${actor.conviction}/${actor.maxConviction}</div>
            <div class="grid grid-cols-2 gap-2">
                <div>Might: ${actor.might}</div>
                <div>Grace: ${actor.grace}</div>
                <div>Will: ${actor.will}</div>
                <div>Mind: ${actor.mind}</div>
            </div>
            ${actor.traits.length > 0 ? `
                <div class="mt-2">
                    <div class="font-bold">Traits:</div>
                    <div class="text-sm">${actor.traits.map(t => t.name).join(', ')}</div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Format combat information display
 */
export function formatCombatInfo(combat: Combat): string {
    return `
        <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-xl font-bold mb-2">Active Combat</h2>
            <div class="space-y-2">
                <div><span class="font-bold">Room:</span> ${combat.roomId}</div>
                <div><span class="font-bold">Turn:</span> ${combat.turnCounter}</div>
                <div><span class="font-bold">Initiative:</span> ${combat.initiative}</div>
                <div><span class="font-bold">Grapple State:</span> ${combat.grappleState}</div>
                <div><span class="font-bold">Restrained Limbs:</span> ${combat.restrainedLimbs.join(', ') || 'None'}</div>
            </div>
        </div>
    `;
}

export function formatRollResult(result: RollResult): string {
    const successText = result.success ? 
        '<span class="text-green-400">SUCCESS</span>' : 
        '<span class="text-red-400">FAILURE</span>';
    const criticalText = result.isCriticalSuccess ? 
        '<span class="text-green-300"> (CRITICAL SUCCESS!)</span>' :
        result.isCriticalFailure ? 
        '<span class="text-red-300"> (CRITICAL FAILURE!)</span>' : '';
    
    return `
        <div class="bg-gray-800 rounded p-2 space-y-1">
            <div>Roll: ${result.roll} vs ${result.attribute} = ${successText}${criticalText}</div>
            <div>Margin: ${result.margin} (${result.intensity})</div>
            ${result.description ? `<div class="text-gray-300">${result.description}</div>` : ''}
        </div>
    `;
}

export function formatOpposedResult(result: OpposedCheckResult): string {
    return `
        <div class="space-y-4">
            <div>
                <h3 class="font-bold mb-2">Attacker</h3>
                ${formatRollResult(result.attacker)}
            </div>
            
            <div>
                <h3 class="font-bold mb-2">Defender</h3>
                ${formatRollResult(result.defender)}
            </div>
            
            <div class="font-bold">
                Winner: ${result.attackerWins ? 
                    '<span class="text-red-400">Attacker</span>' : 
                    '<span class="text-blue-400">Defender</span>'}
            </div>
        </div>
    `;
}

/**
 * Display a dungeon layout as an HTML grid
 */
export function formatDungeonLayout(dungeon: DungeonLayout): string {
    return `
        <div class="dungeon-layout">
            <h2 class="text-xl font-bold mb-2">Dungeon Layout</h2>
            <div class="grid gap-1">
                ${dungeon.grid.map(row => `
                    <div class="flex gap-1">
                        ${row.map(cell => {
                            if (cell === 0) return '<div class="w-8 h-8 bg-gray-900"></div>'; // Empty
                            if (cell === 1) return '<div class="w-8 h-8 bg-gray-700 flex items-center justify-center">██</div>'; // Corridor
                            const room = dungeon.rooms[cell];
                            return `<div class="w-8 h-8 bg-gray-600 flex items-center justify-center text-sm" title="${room?.name || 'Unknown'}">${room ? room.name.substring(0,2) : '??'}</div>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Display detailed information about a room as HTML
 */
export function formatRoomInfo(dungeon: DungeonLayout, roomId: number, adjacentRooms: number[]): string {
    const room = dungeon.rooms[roomId];
    
    // Group adjacent rooms by name
    const connections = adjacentRooms.map(id => {
        const adjRoom = dungeon.rooms[id];
        return adjRoom?.name || 'Unknown Room';
    });
    
    return `
        <div class="room-info bg-gray-800 rounded-lg p-4 mt-4">
            <h2 class="text-xl font-bold mb-2">Room Information</h2>
            <div class="space-y-2">
                <p><span class="font-bold">Name:</span> ${room.name}</p>
                <p><span class="font-bold">Description:</span> ${room.description}</p>
                <p><span class="font-bold">Capacity:</span> ${room.capacity}</p>
                <p><span class="font-bold">Can be trapped:</span> ${room.canBeTrapped}</p>
                <p><span class="font-bold">Connected to:</span> ${connections.join(', ')}</p>
            </div>
        </div>
    `;
}
