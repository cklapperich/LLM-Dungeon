import { IntensityType, IntensityTypes } from "./constants";

/**
 * Attributes as defined in skillsystem.md
 */
export type Attribute = 'Might' | 'Grace' | 'Will' | 'Wit';

/**
 * Base skill interface representing a skill definition
 */
export interface Skill {
    /** Unique identifier for the skill */
    name: string;
    
    /** Human readable description of what the skill does */
    description: string;
    
    /** The attribute this skill is based on */
    attribute: Attribute;
}

/**
 * Character skill proficiency level
 * Currently just stores the +4 proficiency bonus if proficient
 */
export interface SkillProficiency {
    /** The skill's name */
    skillName: string;
    
    /** Proficiency bonus (+4 if proficient, 0 if not) */
    bonus: number;
}

/**
 * Helper type for storing character skill levels
 */
export type SkillLevels = Record<string, number>;

/**
 * Result of a skill check roll
 */
export interface RollResult {
    roll: number;
    attribute: number;
    margin: number;
    success: boolean;
    isCriticalSuccess: boolean;
    isCriticalFailure: boolean;
    description?: string;
    intensity?: IntensityTypes;
    modifiers?: {
        value: number;
        reason: string;
    }[];
}

/**
 * Result of an opposed skill check
 */
export interface OpposedCheckResult {
    attacker: RollResult;
    defender: RollResult;
    margin: number;
    attackerWins: boolean;
    defenderSkill: SkillName; // The skill used by the defender
}

/**
 * Constants for skill system
 */
export const SKILL_CONSTANTS = {
    PROFICIENCY_BONUS: 4,
    DEFAULT_ATTRIBUTE: 10, // Average human score
    MIN_ATTRIBUTE: 3,
    MAX_ATTRIBUTE: 18,
    
    // Critical success/failure thresholds for natural rolls
    CRITICAL_SUCCESS_ROLL: 4,    // Natural roll of 4 or less
    CRITICAL_FAILURE_ROLL: 17,   // Natural roll of 17 or higher
    
    // Margin thresholds for success/failure intensity
    MARGIN_THRESHOLDS: {
        SOLID_SUCCESS: 4,       
        MINIMAL_SUCCESS: 1,  
        SOLID_FAILURE: -4,    
    }
} as const;

/**
 * Utility function to check if a skill is proficient
 */
export function isSkillProficient(skillLevels: SkillLevels, skillName: string): boolean {
    return (skillLevels[skillName] || 0) === 4;
}

/**
 * Clean skill names without attribute brackets
 */
export const SkillNames = {
    // System
    NONE: "None",
    INITIATIVE: "Initiative",
    // Combat
    GRAPPLE_MIGHT: "Strong Grapple",
    GRAPPLE_GRACE: "Quick Grapple",
    LIGHT_WEAPONS: "Light Weapons",
    HEAVY_WEAPONS: "Heavy Weapons",
    BLOCK: "Block",
    DODGE: "Dodge",
    PARRY: "Parry",
    BREAK_FREE: "Break Free",
    SLIP_FREE: "Slip Free",
    // Stealth & Detection
    STEALTH: "Stealth",
    PERCEPTION: "Perception",
    DISARM_TRAP: "Disarm Trap",
    // Attribute-based skills: the skill is literally just the attribute
    MIGHT: "Might",
    GRACE: "Grace",
    WIT: "Wit",
    WILL: "Will",
} as const;

/**
 * Mapping of skill names to their associated attributes
 */
export const SkillAttributeMap: Record<string, Attribute> = {
    [SkillNames.NONE]: "Grace", // Default
    [SkillNames.INITIATIVE]: "Grace",
    [SkillNames.GRAPPLE_MIGHT]: "Might",
    [SkillNames.GRAPPLE_GRACE]: "Grace",
    [SkillNames.LIGHT_WEAPONS]: "Grace",
    [SkillNames.HEAVY_WEAPONS]: "Might",
    [SkillNames.BLOCK]: "Might",
    [SkillNames.DODGE]: "Grace",
    [SkillNames.PARRY]: "Grace",
    [SkillNames.BREAK_FREE]: "Might",
    [SkillNames.SLIP_FREE]: "Grace",
    [SkillNames.STEALTH]: "Grace",
    [SkillNames.PERCEPTION]: "Wit",
    [SkillNames.DISARM_TRAP]: "Grace",
    [SkillNames.MIGHT]: "Might",
    [SkillNames.GRACE]: "Grace",
    [SkillNames.WIT]: "Wit",
    [SkillNames.WILL]: "Will",
};

/**
 * For backward compatibility - will be deprecated
 */
export const Skills = {
    // System
    NONE: SkillNames.NONE,
    INITIATIVE: SkillNames.INITIATIVE,
    // Combat
    GRAPPLE_MIGHT: SkillNames.GRAPPLE_MIGHT,
    GRAPPLE_GRACE: SkillNames.GRAPPLE_GRACE,
    LIGHT_WEAPONS: SkillNames.LIGHT_WEAPONS,
    HEAVY_WEAPONS: SkillNames.HEAVY_WEAPONS,
    BLOCK_MIGHT: SkillNames.BLOCK,
    DODGE_GRACE: SkillNames.DODGE,
    PARRY_GRACE: SkillNames.PARRY,
    BREAK_FREE_MIGHT: SkillNames.BREAK_FREE,
    SLIP_FREE_GRACE: SkillNames.SLIP_FREE,
    // Stealth & Detection
    STEALTH: SkillNames.STEALTH,
    PERCEPTION: SkillNames.PERCEPTION,
    DISARM_TRAP: SkillNames.DISARM_TRAP,
    // Attribute-based skills: the skill is literally just the attribute
    MIGHT: SkillNames.MIGHT,
    GRACE: SkillNames.GRACE,
    WIT: SkillNames.WIT,
    WILL: SkillNames.WILL,
} as const;

export type SkillName = typeof SkillNames[keyof typeof SkillNames];

/**
 * Get the attribute associated with a skill
 */
export function getSkillAttribute(skillName: string): Attribute {
    return SkillAttributeMap[skillName] || "Grace"; // Default to Grace if not found
}
