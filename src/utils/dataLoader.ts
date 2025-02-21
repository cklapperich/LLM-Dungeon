import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Attribute, SkillName} from '../types/skilltypes.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface MarginModifiers {
    skills: Record<string, Record<string, string[]>>;
    generic: Record<string, string[]>;
}

interface SkillData {
    name: string;
    attribute: Attribute;
    description: string;
    opposed_by: string | null;
}

interface SkillsJson {
    skills: SkillData[];
}

/**
 * Load margin modifiers from JSON file
 */
export function loadMarginModifiers(): MarginModifiers {
    const filePath = join(__dirname, '..', '..', 'data', 'margin_modifiers.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as MarginModifiers;
}

/**
 * Load skills data from JSON file
 */
function loadSkills(): SkillsJson {
    const filePath = join(__dirname, '..', '..', 'data', 'skills.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as SkillsJson;
}

// Load data once at startup
export const marginModifiers = loadMarginModifiers();
export const skillsData = loadSkills();

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
