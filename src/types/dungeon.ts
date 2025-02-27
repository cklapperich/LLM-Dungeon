import { RoomCapacity, RoomType, RoomTypeValue } from './constants.js';
import {Character} from './actor.js'
// Helper type for grid values
export type GridValue = typeof RoomType.EMPTY | string;

export interface Room {
    id: string;
    templateId: number | null;
    templateName: string;
    name: string;
    description: string;
    type: RoomTypeValue;
    capacity: RoomCapacity;
    canBeTrapped: boolean; 
    characters: Character[];
    flags: Record<string, number>;
}

export interface DungeonLayout {
    grid: (typeof RoomType.EMPTY | string)[][];
    rooms: Record<string, Room>;
    templates: Room[];
}
