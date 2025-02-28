import { Attribute, SkillName, getSkillAttribute, Skills, SkillNames } from '../../types/skilltypes.ts';
import { Character, loadCharacter } from '../../types/actor.ts';
import skillChecksJson from '../../../public/data/descriptions/skillchecks.json';

interface MarginModifiers {
    skills: Record<string, Record<string, string[]>>;
    generic: Record<string, string[]>;
}

// Load data directly from imported JSON
export const marginModifiers: MarginModifiers = skillChecksJson;

/**
 * Load a monster from JSON data
 */
export function loadMonster(monsterData: any): Character {
    return loadCharacter(JSON.stringify(monsterData));
}

// Re-export the getSkillAttribute function from skilltypes.ts
export { getSkillAttribute };
