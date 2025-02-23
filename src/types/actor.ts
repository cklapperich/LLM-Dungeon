import { Attribute, SkillName } from './skilltypes.js';
import { Trait } from './abilities.js';
import { abilities } from '../game_engine/default_abilities.ts';
import { copyTrait } from './abilities.js';
import { MonsterSize, CharacterType, CharacterTypeValue, Limb, LimbType } from './constants.js';

export interface Character {
    id: string;
    name: string;
    type: CharacterTypeValue;
    traits: Trait[];
    might: number;
    grace: number;
    wit: number;
    will: number;
    skills: Record<string, number>;
    maxVitality: number;
    vitality: number;
    maxConviction: number;
    conviction: number;
    description: string;
    flags: Record<string, number>;
    size?: MonsterSize; // Optional size field for monsters
    initiative?: number; // Track initiative in combat
    limbs: Record<Limb, boolean>; // Track which limbs the character has
}

export function calculateMaxVitality(might: number): number {
    if (might < 6) return 2;
    if (might < 9) return 3;
    if (might < 13) return 3;
    if (might < 16) return 4;
    return 5;
}

export function calculateMaxConviction(will: number): number {
    if (will <= 6) return 2;
    if (will <= 9) return 3;
    if (will <= 13) return 3;
    if (will <= 16) return 4;
    return 5;
}

/**
 * Create a new character with default values
 */
export function createCharacter(attributes: Partial<Character> = {}): Character {
    const might = attributes.might ?? 10;
    const will = attributes.will ?? 10;
    const grace = attributes.grace??10;
    const wit = attributes.wit??10;

    return {
        id: attributes.id ?? crypto.randomUUID(),
        name: attributes.name ?? 'New Character',
        type: attributes.type ?? CharacterType.MONSTER,  // Default to monster type
        traits: attributes.traits ?? [],
        might,
        grace,
        wit,
        will,
        skills: attributes.skills ?? {},
        maxVitality: calculateMaxVitality(might),
        vitality: calculateMaxVitality(might),
        maxConviction: calculateMaxConviction(will),
        conviction: calculateMaxConviction(will),
        description: attributes.description ?? "",
        flags: attributes.flags ?? {},
        limbs: attributes.limbs ?? {
            [LimbType.LEFT_ARM]: true,
            [LimbType.RIGHT_ARM]: true,
            [LimbType.LEFT_LEG]: true,
            [LimbType.RIGHT_LEG]: true,
            [LimbType.MOUTH]: true
        }
    };
}

export function getAttributeValue(character: Character, attribute: Attribute): number {
    return character[attribute.toLowerCase() as keyof Pick<Character, 'might' | 'grace' | 'wit' | 'will'>];
}

export function getSkillBonus(character: Character, skillName: SkillName): number {
    return character.skills[skillName] || 0;
}

/**
 * Check if a character has the required limbs for a trait
 */
export function hasRequiredLimbs(character: Character, trait: Trait): boolean {
    if (!trait.requirements?.limbs) return true;

    const requiredArms = trait.requirements.limbs.arms ?? 0;
    const requiredLegs = trait.requirements.limbs.legs ?? 0;
    const requiredMouth = trait.requirements.limbs.mouth ?? 0;

    let availableArms = 0;
    if (character.limbs[LimbType.LEFT_ARM]) availableArms++;
    if (character.limbs[LimbType.RIGHT_ARM]) availableArms++;

    let availableLegs = 0;
    if (character.limbs[LimbType.LEFT_LEG]) availableLegs++;
    if (character.limbs[LimbType.RIGHT_LEG]) availableLegs++;

    const hasMouth = character.limbs[LimbType.MOUTH];

    return availableArms >= requiredArms && 
           availableLegs >= requiredLegs && 
           (requiredMouth === 0 || hasMouth);
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
