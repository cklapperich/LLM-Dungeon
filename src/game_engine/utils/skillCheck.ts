import { RollResult, SKILL_CONSTANTS, OpposedCheckResult, SkillName} from '../../types/skilltypes.ts';
import { marginModifiers, getSkillAttribute } from './dataLoader.ts';
import { Character, getAttributeValue, getSkillModifier } from '../../types/actor.ts';
import { IntensityType, IntensityTypes } from '../../types/constants';
interface InitiativeResult {
    initiatives: [number, number];
    margin: number;
    description: string;
}

export function processInitiative(char1: Character, char2: Character): InitiativeResult {
    // Roll initiative for both characters
    const init1 = roll2d10() - char1.grace;
    const init2 = roll2d10() - char2.grace;

    // Calculate margin between initiatives (lower is better)
    const margin = Math.abs(init1 - init2);
    const intensity = getIntensityLevel(null, margin);

    // Get description from initiative category
    const description = getSkillDescription('initiative', intensity);

    return {
        initiatives: [init1, init2],
        margin,
        description
    };
}

/**
 * Get the intensity level based on margin of success/failure
 */
function getIntensityLevel(roll: number | undefined | null, margin: number): IntensityTypes {
    const { MARGIN_THRESHOLDS, CRITICAL_SUCCESS_ROLL, CRITICAL_FAILURE_ROLL } = SKILL_CONSTANTS;
    
    if (!roll){
        // Check for critical success/failure first based on roll
        if (roll <= CRITICAL_SUCCESS_ROLL) return IntensityType.CRITICAL_SUCCESS;
        if (roll >= CRITICAL_FAILURE_ROLL) return IntensityType.CRITICAL_FAILURE;
    }

    // Then check margins for regular success/failure
    if (margin >= MARGIN_THRESHOLDS.SOLID_SUCCESS) return IntensityType.SOLID_SUCCESS;
    if (margin >= MARGIN_THRESHOLDS.MINIMAL_SUCCESS) return IntensityType.MINIMAL_SUCCESS;
    if (margin > MARGIN_THRESHOLDS.SOLID_FAILURE) return IntensityType.SOLID_FAILURE;

    return IntensityType.MINIMAL_FAILURE;
}

/**
 * Get a random description for a skill check result
 */
function getSkillDescription(skillName: string | undefined, intensity: IntensityTypes): string {
    let prompts = null;
    if (!skillName)
        prompts = marginModifiers.generic[intensity];
    else if (skillName=='initiative')
        prompts = marginModifiers.initiative[intensity];
    else
       try{
           prompts = marginModifiers.skills[skillName][intensity];
       } catch {
           console.warn(`No skill description found for ${skillName}`);
           prompts = marginModifiers.generic[intensity];
       }
    // Return a random prompt
    return prompts[Math.floor(Math.random() * prompts.length)];
}


function roll3d6(): number {
    return Math.floor(Math.random() * 6) + 1 +
           Math.floor(Math.random() * 6) + 1 +
           Math.floor(Math.random() * 6) + 1;
}
function roll2d10(): number {
    return Math.floor(Math.random() * 10) + 1 +
           Math.floor(Math.random() * 10) + 1
}
/**
 * Make a skill check
 * @param character The character making the check
 * @param skillName The skill to check
 * @param modifier additional modifiers
 * @returns The result of the roll
 */
/**
 * Make a skill check
 */
export function makeSkillCheck(
    character: Character,
    skillName: SkillName,
    modifier: number = 0,
): RollResult {
    const attribute = getSkillAttribute(skillName);
    const baseAttribute = getAttributeValue(character, attribute);
    const skillBonus = getSkillModifier(character, skillName);
    
    const roll = roll2d10();
    const modifiedAttribute = baseAttribute + skillBonus + modifier;
    const margin = modifiedAttribute - roll;
    const intensity = getIntensityLevel(roll, margin);
    const isCriticalSuccess = roll <= 3;
    const isCriticalFailure = roll >= 19;
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
        const skillBonus = getSkillModifier(character, skillName);
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
