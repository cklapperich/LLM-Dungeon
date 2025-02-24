import { Character } from '../types/actor';
import { Effect } from './effect';
import { Status, StatusName } from '../types/status';
import descriptionsJson from '../../data/descriptions.json';

// Get attribute description based on value
function getAttributeDescription(value: number): string {
    if (value <= 6) return "6_or_less";
    if (value === 7) return "7";
    if (value <= 9) return "8_9";
    if (value === 10) return "10";
    if (value <= 12) return "11_12";
    if (value <= 14) return "13_14";
    if (value <= 16) return "15_16";
    if (value <= 18) return "17_18";
    if (value <= 20) return "19_20";
    return "21_plus";
}

// Get clothing description based on level
export function getClothingDescription(level: number): string | null {
    const options = descriptionsJson.clothing[level.toString()];
    return options ? options[Math.floor(Math.random() * options.length)] : null;
}

// Get vitality state and description
export function getVitalityDescription(current: number, max: number = 3): string | null {
    // Calculate state
    const ratio = current / max;
    let state = "low";
    if (ratio === 1) state = "full";
    else if (ratio >= 0.7) state = "high";
    else if (ratio >= 0.3) state = "medium";

    // Get description for this state
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

    // Format skills into a readable list
    const skills = Object.entries(character.skills)
        .filter(([_, level]) => level > 0)
        .map(([skill, _]) => skill)
        .join(', ');

    // Build the narrative description
    return `${character.name} is ${character.description}. ${clothingDesc ? `They are ${clothingDesc}.` : ''} ${
        mightDesc ? `Their might is ${mightDesc}` : ''}, ${
        graceDesc ? `their grace ${graceDesc}` : ''}, ${
        witDesc ? `their wit ${witDesc}` : ''}, ${
        willDesc ? `and their will ${willDesc}` : ''}. ${
        skills ? `They are skilled in ${skills}.` : ''} ${
        vitalityDesc ? `They appear ${vitalityDesc}.` : ''}`;
}

// Format a status effect as a narrative description
export function formatStatusDescription(status: Status): string | null {
    const statusKey = status.name.toLowerCase();
    return getRandomDescription('status', statusKey);
}

// Format characters for LLM context
export function formatCharactersForLLM(hero: Character, monster: Character): string {
    return `HERO: ${formatCharacterAsNarrative(hero)}

MONSTER: ${formatCharacterAsNarrative(monster)}`;
}
