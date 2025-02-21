import { Attribute, SkillName } from './skilltypes.js';
import { Trait } from './abilities.js';
import { abilities } from '../default_abilities.js';
import { copyTrait } from './abilities.js';

export interface Character {
    traits: Trait[]; // Array of traits/abilities the character has
    might: number;
    grace: number;
    mind: number;
    will: number;
    skills: Record<string, number>;
    maxVitality: number;
    vitality: number;
    maxConviction: number;
    conviction: number;
    grappleState: number;
    description:string;
}

export function calculateMaxVitality(might: number): number {
    if (might < 6) return 1;
    if (might < 9) return 2;
    if (might < 13) return 3;
    if (might < 17) return 4;
    return 5;
}

export function calculateMaxConviction(will: number): number {
    if (will <= 6) return 1;
    if (will <= 9) return 2;
    if (will <= 13) return 3;
    if (will <= 17) return 4;
    return 5;
}

/**
 * Create a new character with default values
 */
export function createCharacter(attributes: Partial<Character> = {}): Character {
    const might = attributes.might ?? 10;
    const will = attributes.will ?? 10;
    const grace = attributes.grace??10;
    const mind = attributes.mind??10;

    return {
        traits: attributes.traits ?? [],
        might,
        grace,
        mind,
        will,
        skills: attributes.skills ?? {},
        maxVitality: calculateMaxVitality(might),
        vitality: calculateMaxVitality(might),
        maxConviction: calculateMaxConviction(will),
        conviction: calculateMaxConviction(will),
        grappleState: 0,
        description:attributes.description??"",
    };
}

export function getAttributeValue(character: Character, attribute: Attribute): number {
    return character[attribute.toLowerCase() as keyof Pick<Character, 'might' | 'grace' | 'mind' | 'will'>];
}

export function getSkillBonus(character: Character, skillName: SkillName): number {
    return character.skills[skillName] || 0;
}

/**
 * Save a character to JSON string
 */
export function saveCharacter(character: Character): string {
    return JSON.stringify(character, null, 2);
}

/**
 * Load a character from JSON string
 * Uses createCharacter to ensure all fields are properly initialized
 */
export function loadCharacter(json: string): Character {
    const data = JSON.parse(json);
    
    // Convert string traits to actual Trait instances
    if (data.traits) {
        data.traits = data.traits.map((trait: string | Trait) => {
            if (typeof trait === 'string') {
                // Look up trait in default abilities and create a copy
                const defaultTrait = (abilities as Record<string, Trait>)[trait.toLowerCase()];
                if (!defaultTrait) {
                    throw new Error(`Unknown trait: ${trait}`);
                }
                return copyTrait(defaultTrait);
            }
            return trait;
        });
    }
    
    return createCharacter(data);
}
