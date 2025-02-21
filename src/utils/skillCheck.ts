import { RollResult, IntensityLevel, SKILL_CONSTANTS, OpposedCheckResult, SkillName} from '../types/skilltypes.js';
import { marginModifiers, getSkillAttribute } from './dataLoader.js';
import { Character, getAttributeValue, getSkillBonus } from '../types/actor.js';

// Roll 3d6 and subtract Grace for initiative (rerolled each round)
// Lower numbers go first
// Example: Grace 13, roll 15 = initiative 2 (15-13)
//         Grace 13, roll 8 = initiative -5 (8-13)
export function rollInitiative(character: Character): number {
    const roll = Math.floor(Math.random() * 6) + 1 + 
                Math.floor(Math.random() * 6) + 1 + 
                Math.floor(Math.random() * 6) + 1;
    return roll - character.grace;
}

/**
 * Get the intensity level based on margin of success/failure
 */
function getIntensityLevel(margin: number): IntensityLevel {
    const { MARGIN_THRESHOLDS } = SKILL_CONSTANTS;
    if (margin >= MARGIN_THRESHOLDS.SOLID_SUCCESS) return 'solid_success';
    if (margin >= MARGIN_THRESHOLDS.MINIMAL_SUCCESS) return 'minimal_success';
    if (margin > MARGIN_THRESHOLDS.SOLID_FAILURE) return 'solid_failure';
    return 'minimal_failure';
}

/**
 * Get a random description for a skill check result
 */
function getSkillDescription(skillName: string | undefined, intensity: IntensityLevel): string {
    // Get the appropriate prompts array
    const prompts = skillName && marginModifiers.skills[skillName]?.[intensity] || 
                   marginModifiers.generic[intensity];
    
    // Return a random prompt
    return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Roll 3d6
 */
function roll3d6(): number {
    return Math.floor(Math.random() * 6) + 1 +
           Math.floor(Math.random() * 6) + 1 +
           Math.floor(Math.random() * 6) + 1;
}

/**
 * Make a skill check
 * @param character The character making the check
 * @param skillName The skill to check
 * @param modifier additional modifiers
 * @returns The result of the roll
 */
export function makeSkillCheck(
    character: Character,
    skillName: SkillName,
    modifier: number = 0,
): RollResult {
    const attribute = getSkillAttribute(skillName);
    const baseAttribute = getAttributeValue(character, attribute);
    const skillBonus = getSkillBonus(character, skillName);
    
    const roll = roll3d6();
    const modifiedAttribute = baseAttribute + skillBonus + modifier;
    const margin = modifiedAttribute - roll;
    const intensity = getIntensityLevel(margin);
    const isCriticalSuccess = roll <= 4;
    const isCriticalFailure = roll >= 17;
    const success = isCriticalSuccess || (roll <= modifiedAttribute && !isCriticalFailure);

    return {
        roll,
        attribute: modifiedAttribute,
        margin,
        success: success,
        isCriticalSuccess,
        isCriticalFailure,
        intensity,
        description: getSkillDescription(skillName, intensity)
    };
}

/**
 * Find the best defensive skill for a character from a list of options
 * @param character The defending character
 * @param defenseOptions Array of possible defensive skills
 * @returns The skill name that gives the highest total (attribute + bonus)
 */
function getBestDefensiveSkill(character: Character, defenseOptions: SkillName[]): SkillName {
    if (defenseOptions.length === 0) {
        throw new Error("No defense options provided");
    }

    let bestSkill = defenseOptions[0];
    let bestTotal = -Infinity;

    for (const skillName of defenseOptions) {
        const attribute = getSkillAttribute(skillName);
        const baseAttribute = getAttributeValue(character, attribute);
        const skillBonus = getSkillBonus(character, skillName);
        const total = baseAttribute + skillBonus;

        if (total > bestTotal) {
            bestTotal = total;
            bestSkill = skillName;
        }
    }

    return bestSkill;
}

export function makeOpposedCheck(
    attacker: Character,
    attackerSkill: SkillName,
    defender: Character,
    defenseOptions?: SkillName | SkillName[],
    attacker_modifier: number = 0,
): OpposedCheckResult {
    const attackerResult = makeSkillCheck(attacker, attackerSkill, attacker_modifier);
    
    // Convert single skill to array if needed
    const defenseOptionsArray = defenseOptions 
        ? (Array.isArray(defenseOptions) ? defenseOptions : [defenseOptions])
        : [attackerSkill]; // Default to same skill if no options provided
    
    const defenderSkill = getBestDefensiveSkill(defender, defenseOptionsArray);
    const defenderResult = makeSkillCheck(defender, defenderSkill);
    
    // If one succeeds and one fails, success wins
    if (attackerResult.success && !defenderResult.success) {
        return { attacker: attackerResult, defender: defenderResult, attackerWins: true };
    }
    if (!attackerResult.success && defenderResult.success) {
        return { attacker: attackerResult, defender: defenderResult, attackerWins: false };
    }
    
    // If both succeed or both fail, compare margins
    // Ties go to defender
    const attackerWins = attackerResult.margin > defenderResult.margin;
    
    return {
        attacker: attackerResult,
        defender: defenderResult,
        attackerWins
    };
}
