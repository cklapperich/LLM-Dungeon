import { Attribute, SkillName} from '../../types/skilltypes.ts';
import { Character, loadCharacter } from '../../types/actor.ts';
import marginModifiersJson from '../../../data/margin_modifiers.json';
import skillsJson from '../../../data/skills.json';

interface MarginModifiers {
    skills: Record<string, Record<string, string[]>>;
    generic: Record<string, string[]>;
    initiative: Record<string, string[]>;
}

import { Skill } from '../../types/skilltypes';

interface SkillsJson {
    skills: Skill[];
}

// Load data directly from imported JSON
export const marginModifiers: MarginModifiers = marginModifiersJson;
export const skillsData: SkillsJson = skillsJson as SkillsJson;

/**
 * Load a monster from JSON data
 */
export function loadMonster(monsterData: any): Character {
    return loadCharacter(JSON.stringify(monsterData));
}

// Create lookup maps for quick access
const skillAttributeMap = new Map(
    skillsData.skills.map(skill => [skill.name, skill.attribute])
);

/**
 * Get the attribute associated with a skill
 */
export function getSkillAttribute(skillName: SkillName): Attribute {
    const attribute = skillAttributeMap.get(skillName);
    if (!attribute) {
        throw new Error(`Unknown skill: ${skillName}`);
    }
    return attribute;
}
