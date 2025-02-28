import { Attribute, SkillName } from './skilltypes.js';
import { Trait } from './abilities.js';
import { abilities } from '../game_engine/combat/default_abilities.ts';
import { copyTrait } from './abilities.js';
import { MonsterSize, CharacterType, CharacterTypeValue, BodyPart, BodyPartType } from './constants.js';
import { Status, ModifierResult } from './status.js';
import { getStatusModifiers } from '../game_engine/statusEffects.js';

export interface Character {
    id: string;
    name: string;
    type: CharacterTypeValue;
    artworkUrl?: string;  // URL for character artwork
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
    flags: Record<string, string>;
    size?: MonsterSize; // Optional size field for monsters
    initiative?: number; // Track initiative in combat
    clothing: number; // Track clothing level (0-5)
    limbs: Partial<Record<BodyPart, number>>; // Track which limbs the character has
    statuses: Status[]; // Track active status effects
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
        artworkUrl: attributes.artworkUrl,
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
        clothing: attributes.clothing ?? 1, // Default clothing level is 1
        limbs: attributes.limbs ?? {
            [BodyPartType.ARM]: 2,
            [BodyPartType.LEG]: 2,
            [BodyPartType.MOUTH]: 1
        },
        statuses: attributes.statuses ?? [] // Initialize empty status array
    };
}


export function getAttributeValue(character: Character, attribute: Attribute): number {
    return character[attribute.toLowerCase() as keyof Pick<Character, 'might' | 'grace' | 'wit' | 'will'>];
}

export function getSkillModifier(character: Character, skillName: SkillName): number {
    return character.skills[skillName] || 0;
}

/**
 * Get combined modifiers from all status effects on a character
 */
export function getCombinedModifiers(statuses: Status[], gameState: any = {}): ModifierResult {
    return statuses.reduce((acc, status) => {
        const mods = getStatusModifiers(status, gameState);
        // Sum up skill modifiers
        Object.entries(mods.skill_modifiers).forEach(([skill, value]) => {
            acc.skill_modifiers[skill] = (acc.skill_modifiers[skill] || 0) + value;
        });
        // Sum up attribute modifiers  
        Object.entries(mods.attribute_modifiers).forEach(([attr, value]) => {
            acc.attribute_modifiers[attr] = (acc.attribute_modifiers[attr] || 0) + value;
        });
        return acc;
    }, { skill_modifiers: {}, attribute_modifiers: {} });
}

/**
 * Get total attribute value including base attribute and status effect modifiers
 */
export function getAttributeBonus(character: Character, attribute: Attribute, gameState: any = {}): number {
    const baseAttribute = getAttributeValue(character, attribute);
    const statusMods = getCombinedModifiers(character.statuses, gameState);
    return baseAttribute + (statusMods.attribute_modifiers[attribute.toLowerCase()] || 0);
}

/**
 * Get total skill bonus including base skill and status effect modifiers
 */
export function getSkillBonus(character: Character, skillName: SkillName, gameState: any = {}): number {
    const baseSkill = getSkillModifier(character, skillName);
    const statusMods = getCombinedModifiers(character.statuses, gameState);
    return baseSkill + (statusMods.skill_modifiers[skillName] || 0);
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
                const defaultTrait = (abilities as Record<string, Trait>)[trait];
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
