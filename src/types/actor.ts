import { Attribute, SkillName } from './skilltypes.js';
import { Trait } from './abilities.js';
import { default_monster_abilities, default_hero_abilities, system_actions } from '../game_engine/combat/default_abilities.ts';
import { copyTrait } from './abilities.js';
import { loadAbility } from '../game_engine/abilityManager';
import { MonsterSize, CharacterType, CharacterTypeValue, BodyPart, BodyPartType } from './constants.js';
import { Status, ModifierResult } from './status.js';
import { getStatusModifiers } from '../game_engine/statusEffects.js';

export interface Character {
    id: string;
    name: string;
    type: CharacterTypeValue;
    artworkUrl?: string;  // URL for character artwork
    traits: Trait[];
    attributes: Record<Attribute, number>;
    skills: Record<string, number>;
    vitality: {
        max: number,
        current: number
    }
    conviction: {
        max: number,
        current: number
    }
    description: string;
    flags: Record<string, string>;
    size?: MonsterSize; // Optional size field for monsters
    initiative?: number; // Track initiative in combat
    armor: {
        max:number,
        current: number
    }
    limbs: Partial<Record<BodyPart, number>>; // Track which limbs the character has
    statuses: Status[]; // Track active status effects
    selected_action?: Trait; // Track the selected action for the current turn
    passives:Trait[];
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
export function createCharacter(character: Partial<Character> = {}): Character {
    const attributes = character.attributes ?? {
        Might: character.attributes?.Might ?? 10,
        Will: character.attributes?.Will ?? 10,
        Grace: character.attributes?.Grace ?? 10,
        Wit: character.attributes?.Wit ?? 10,
    };

    // Calculate max values based on attributes
    const maxVitalityValue = calculateMaxVitality(attributes.Might);
    const maxConvictionValue = calculateMaxConviction(attributes.Will);

    return {
        id: character.id ?? crypto.randomUUID(),
        name: character.name ?? 'New Character',
        type: character.type ?? CharacterType.MONSTER,  // Default to monster type
        artworkUrl: character.artworkUrl,
        traits: character.traits ?? [],
        attributes: attributes,
        skills: character.skills ?? {},
        vitality: character.vitality ?? {
            max: maxVitalityValue,
            current: maxVitalityValue
        },
        conviction: character.conviction ?? {
            max: maxConvictionValue,
            current: maxConvictionValue
        },
        description: character.description ?? "",
        flags: character.flags ?? {},
        armor: character.armor ?? {max:1, current:1},
        limbs: character.limbs ?? {
            [BodyPartType.ARM]: 2,
            [BodyPartType.LEG]: 2,
            [BodyPartType.MOUTH]: 1
        },
        statuses: character.statuses ?? [], // Initialize empty status array
        passives:[]
    };
}


export function getAttributeValue(character: Character, attribute: Attribute): number {
    return character.attributes[attribute];
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
    const default_abilities = { ...default_monster_abilities, ...default_hero_abilities };
    // Convert string traits to actual Trait instances
    if (data.traits) {
        data.traits = data.traits.map((trait: string | Trait) => {
            if (typeof trait === 'string') {
                // First try to load from default abilities
                const defaultTrait = (default_abilities as Record<string, Trait>)[trait];
                if (defaultTrait) {
                    return copyTrait(defaultTrait);
                }
                
                // If not found in default abilities, try to load from ability registry
                const registryTrait = loadAbility(trait);
                if (registryTrait) {
                    return registryTrait;
                }
                
                // If still not found, throw an error
                throw new Error(`Unknown trait: ${trait}`);
            }
            return trait;
        });
    }
    
    return createCharacter(data);
}
