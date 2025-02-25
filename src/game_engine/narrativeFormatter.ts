import { Character } from '../types/actor';
import { Effect } from './effect';
import { Status, StatusName } from '../types/status';
import descriptionsJson from '../../data/descriptions.json';

// Get attribute description
function getAttributeDescription(value: number): string {
    const ranges = {
        weak: (v: number) => v <= 6,
        untrained: (v: number) => v <= 9,
        average: (v: number) => v <= 12,
        skilled: (v: number) => v <= 14,
        exceptional: (v: number) => v <= 16,
        masterful: (v: number) => v <= 18,
        legendary: (v: number) => v <= 20,
        mythical: (v: number) => v > 20
    };

    for (const [key, check] of Object.entries(ranges)) {
        if (check(value)) return key;
    }
    return 'mythical';
}

// Get clothing description
export function getClothingDescription(level: number): string | null {
    const states = ['unprotected', 'lightly_protected', 'protected', 'well_protected'];
    const state = states[Math.min(level, states.length - 1)];
    const options = descriptionsJson.clothing[state];
    return options ? options[Math.floor(Math.random() * options.length)] : null;
}

// Get vitality description
export function getVitalityDescription(current: number, max: number = 3): string | null {
    const state = current === max ? 'energetic' :
                 current > max * 0.7 ? 'healthy' :
                 current > max * 0.3 ? 'wounded' : 'critical';
    
    const options = descriptionsJson.vitality[state];
    return options ? options[Math.floor(Math.random() * options.length)] : null;
}

// Get a random description from an array, safely handling missing descriptions
function getRandomDescription(category: string, key: string): string | null {
    try {
        const options = descriptionsJson[category][key];
        if (Array.isArray(options) && options.length > 0) {
            return options[Math.floor(Math.random() * options.length)];
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Format a character's information as a narrative paragraph
export function formatCharacterAsNarrative(character: Character): string {
    // Get attribute descriptions
    const mightDesc = getRandomDescription('attributes', getAttributeDescription(character.might));
    const graceDesc = getRandomDescription('attributes', getAttributeDescription(character.grace));
    const witDesc = getRandomDescription('attributes', getAttributeDescription(character.wit));
    const willDesc = getRandomDescription('attributes', getAttributeDescription(character.will));

    // Get clothing and vitality descriptions
    const clothingDesc = getClothingDescription(character.clothing);
    const vitalityDesc = getVitalityDescription(character.vitality);

    // Build narrative description without mechanical terms
    let description = `${character.name} ${character.description}. `;
    
    if (clothingDesc) description += `${clothingDesc}. `;
    if (mightDesc) description += `${mightDesc}. `;
    if (graceDesc) description += `${graceDesc}. `;
    if (witDesc) description += `${witDesc}. `;
    if (willDesc) description += `${willDesc}. `;
    if (vitalityDesc) description += `${vitalityDesc}. `;

    return description.trim();
}

// Format a status effect as a narrative description without brackets
export function formatStatusDescription(status: Status): string | null {
    const statusKey = status.name.toLowerCase();
    const description = getRandomDescription('status', statusKey);
    return description ? description.replace(/\[.*?\]/g, '').trim() : null;
}

// Format characters for LLM context without mechanical terms
export function formatCharactersForLLM(hero: Character, monster: Character): string {
    const heroDesc = formatCharacterAsNarrative(hero);
    const monsterDesc = formatCharacterAsNarrative(monster);
    
    return `${heroDesc}

${monsterDesc}`;
}
