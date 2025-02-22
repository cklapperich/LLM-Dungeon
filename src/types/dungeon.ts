import { Character } from './actor.js';
import { BaseMonster, Trap } from './gamestate.js';
import { RoomCapacity, RoomType, RoomTypeValue } from './constants.js';

// Helper type for grid values
export type GridValue = typeof RoomType.EMPTY | number;

export interface Room {
    id: number;
    templateId: string;
    templateName: string;
    name: string;
    description: string;
    type: RoomTypeValue;
    capacity: RoomCapacity;
    canBeTrapped: boolean;
    isEntrance?: boolean;
    monster?: BaseMonster | null;
    trap?: Trap | null;
    actors: Character[];
    flags: Record<string, number>;
}

export interface DungeonLayout {
    grid: number[][];
    rooms: Record<number, Room>;
    templates: Room[];
}
