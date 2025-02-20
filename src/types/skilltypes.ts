/**
 * Attributes as defined in skillsystem.md
 */
export type Attribute = 'Might' | 'Grace' | 'Mind' | 'Will';

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
    
    /** Name of the skill that opposes this one in contested checks, if any */
    opposed_by?: string;
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
 * Possible intensity levels for skill check results
 */
export type IntensityLevel = 
    | 'critical_success'
    | 'solid_success'
    | 'minimal_success'
    | 'minimal_failure'
    | 'solid_failure'
    | 'critical_failure';

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
    intensity?: IntensityLevel;
}

/**
 * Result of an opposed skill check
 */
export interface OpposedCheckResult {
    attacker: RollResult;
    defender: RollResult;
    attackerWins: boolean;
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

export const Skills = {
    // Attributes
    MIGHT: "Might",
    GRACE: "Grace",
    MIND: "Mind",
    WILL: "Will",

    // Combat
    LIGHT_WEAPONS: "Light Weapons",
    HEAVY_WEAPONS: "Heavy Weapons",

    // Stealth
    STEALTH: "Stealth",
    TRAP_DISARMING: "Trap Disarming",
    TRAP_DETECTION: "Trap Detection",

    // Knowledge
    ARCANE_KNOWLEDGE: "Arcane Knowledge",
    INVESTIGATION: "Investigation",

    // Social
    INTIMIDATION: "Intimidation",
    COMMAND: "Command",

    // Magic
    RESIST_MAGIC: "Resist Magic"
} as const;

export type SkillName = typeof Skills[keyof typeof Skills];
