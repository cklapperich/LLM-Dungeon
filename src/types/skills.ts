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


export function isSkillProficient(skillLevels: SkillLevels, skillName: string): boolean {
    return (skillLevels[skillName] || 0) === 4;
}
