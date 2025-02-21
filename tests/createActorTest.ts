import { createCharacter, loadCharacter } from '../src/types/actor.js';
import { createTrait } from '../src/types/abilities.js';
import { EffectType, TargetType } from '../src/types/constants.js';
import { Skills } from '../src/types/skilltypes.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Create Actor Tests', () => {
    test('creating a slime with a Slam ability', () => {
        const slimeJson = readFileSync(join(__dirname, '..', 'data', 'monsters', 'slime.json'), 'utf-8');
        const slime = loadCharacter(slimeJson);

        // Create Slam ability
        const slam = createTrait('slam', {
            name: 'Slam',
            description: 'A powerful body slam attack',
            skill: Skills.GRAPPLE_MIGHT,
            defenseOptions: [],
            modifier: 4,
            target: TargetType.OPPONENT,
            effects: [
                {
                    type: EffectType.WOUND,
                    value: 1
                }
            ]
        });

        // Add ability to slime
        slime.traits = [slam];

        // Test ability was added correctly
        expect(slime.traits.length).toBe(1);
        expect(slime.traits[0].name).toBe('Slam');
        expect(slime.traits[0].skill).toBe(Skills.GRAPPLE_MIGHT);
        expect(slime.traits[0].modifier).toBe(4);
        expect(slime.traits[0].defenseOptions).toEqual([]);
        expect(slime.traits[0].effects.length).toBe(1);
        expect(slime.traits[0].effects[0].type).toBe(EffectType.WOUND);
        expect(slime.traits[0].effects[0].value).toBe(1);
    });
});
