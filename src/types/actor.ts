import { Attribute, SkillName} from './skilltypes.js';

export interface Character {
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
    if (might <= 6) return 1;
    if (might <= 9) return 2;
    if (might <= 13) return 3;
    if (might <= 17) return 4;
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
    return createCharacter(data);
}
