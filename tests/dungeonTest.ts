import { readFileSync } from 'fs';
import { describe, test, expect } from 'vitest';
import { loadDungeonFromJson, getAdjacentRooms } from '../src/utils/dungeonUtils.js';
import { formatDungeonLayout, formatRoomInfo } from '../src/utils/textUI.js';
import { RoomType } from '../src/types/constants.js';

describe('Profaned Temple Dungeon', () => {
    const dungeonJson = readFileSync('data/dungeons/profaned_temple.json', 'utf-8');
    const dungeon = loadDungeonFromJson(dungeonJson);

    test('should load dungeon layout correctly', () => {
        const layout = formatDungeonLayout(dungeon);
        console.log(layout); // Visual inspection of layout
        expect(dungeon.grid.length).toBe(5); // 5 rows
        expect(dungeon.grid[0].length).toBe(5); // 5 columns
    });

    test('should have correct room templates', () => {
        expect(dungeon.templates).toHaveLength(5);
        expect(dungeon.templates.map(t => t.templateId)).toEqual([
            'dark_corridor',
            'desecrated_entrance',
            'corrupted_chapel',
            'defiled_confessional',
            'dark_altar'
        ]);
    });

    test('should have entrance marked', () => {
        const entrance = dungeon.templates.find(t => t.isEntrance);
        expect(entrance?.name).toBe('Desecrated Temple Gates');
    });

    test('should have correct room connections', () => {
        // Every room in the grid should exist in the rooms dictionary
        dungeon.grid.forEach(row => {
            row.forEach(value => {
                if (value !== RoomType.EMPTY) {
                    expect(dungeon.rooms[value]).toBeDefined();
                }
            });
        });

        // Every room should have valid connections
        Object.entries(dungeon.rooms).forEach(([id, room]) => {
            const adjacent = getAdjacentRooms(dungeon, parseInt(id));
            
            // Each room should have at least one connection
            expect(adjacent.length).toBeGreaterThan(0);
            
            // Each connected room should exist
            adjacent.forEach(adjId => {
                expect(dungeon.rooms[adjId]).toBeDefined();
            });
        });
    });

    test('should format dungeon displays without crashing', () => {
        // Test layout formatting
        const layout = formatDungeonLayout(dungeon);
        console.log('\nDungeon Layout Test:');
        console.log(layout);

        // Test room info formatting for each room
        console.log('\nRoom Info Test:');
        Object.entries(dungeon.rooms).forEach(([id, room]) => {
            const adjacent = getAdjacentRooms(dungeon, parseInt(id));
            const info = formatRoomInfo(dungeon, parseInt(id), adjacent);
            console.log(info);
        });

        // No assertions needed - test passes if nothing throws
        expect(true).toBe(true);
    });
});
