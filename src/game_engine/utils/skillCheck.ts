import { RollResult, SKILL_CONSTANTS, OpposedCheckResult, SkillName, SkillNames, getSkillAttribute} from '../../types/skilltypes.ts';
import { Character, getAttributeBonus, getSkillBonus } from '../../types/actor.ts';
import { IntensityType, IntensityTypes } from '../../types/constants';
import { getStatusModifiers } from '../statusEffects';
import skillChecksJson from '@assets/descriptions/skillchecks.json';


interface MarginModifiers {
    skills: Record<string, Record<string, string[]>>;
    generic: Record<string, string[]>;
}
export const marginModifiers: MarginModifiers = skillChecksJson;


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
    if (!skillName) {
        prompts = marginModifiers.generic[intensity];
    } else {
        try {
            // Use the clean skill name from SkillNames
            const cleanSkillName = Object.values(SkillNames).find(name => name === skillName) || skillName;
            prompts = marginModifiers.skills[cleanSkillName][intensity];
        } catch {
            console.warn(`No skill description found for ${skillName}`);
            prompts = marginModifiers.generic[intensity];
        }
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
function roll1d20(): number {
    return Math.floor(Math.random() * 20) + 1 + Math.floor(Math.random() * 20) + 1
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
    gameState: any = {}
): RollResult {
    const attribute = getSkillAttribute(skillName);
    const baseAttribute = getAttributeBonus(character, attribute, gameState);
    const skillBonus = getSkillBonus(character, skillName, gameState);
    
    // Track all modifiers
    const modifiers = [];
    if (skillBonus) {
        modifiers.push({
            value: skillBonus,
            reason: `${skillName} proficiency`
        });
    }
    if (modifier) {
        modifiers.push({
            value: modifier,
            reason: 'ability modifier'
        });
    }

    // Calculate status effect modifiers
    let statusSkillMod = 0;
    let statusAttributeMod = 0;
    character.statuses?.forEach(status => {
        const statusMods = getStatusModifiers(status, gameState);
        // Add skill modifiers
        if (skillName in statusMods.skill_modifiers) {
            const value = statusMods.skill_modifiers[skillName];
            statusSkillMod += value;
            modifiers.push({
                value,
                reason: `${status.name} (${status.stacks} stacks)`
            });
        }
        // Add attribute modifiers
        const skillAttribute = getSkillAttribute(skillName);
        if (skillAttribute in statusMods.attribute_modifiers) {
            const value = statusMods.attribute_modifiers[skillAttribute];
            statusAttributeMod += value;
            modifiers.push({
                value,
                reason: `${status.name} affects ${skillAttribute}`
            });
        }
    });

    const roll = roll2d10();
    const modifiedAttribute = baseAttribute + skillBonus + modifier + statusSkillMod + statusAttributeMod;
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
        description: getSkillDescription(skillName, intensity),
        modifiers
    };
}

/**
 * Find the best defensive skill for a character from a list of options
 * @param character The defending character
 * @param defenseOptions Array of possible defensive skills
 * @returns The skill name that gives the highest total (attribute + bonus)
 */
function getBestDefensiveSkill(character: Character, defenseOptions: SkillName[], gameState: any = {}): SkillName {
    if (defenseOptions.length === 0) {
        throw new Error("No defense options provided");
    }

    let bestSkill = defenseOptions[0];
    let bestTotal = -Infinity;

    for (const skillName of defenseOptions) {
        const attribute = getSkillAttribute(skillName);
        const baseAttribute = getAttributeBonus(character, attribute, gameState);
        const skillBonus = getSkillBonus(character, skillName, gameState);
        
        // Calculate status modifiers
        let statusSkillMod = 0;
        let statusAttributeMod = 0;
        character.statuses?.forEach(status => {
            const statusMods = getStatusModifiers(status, gameState);
            if (skillName in statusMods.skill_modifiers) {
                statusSkillMod += statusMods.skill_modifiers[skillName];
            }
            if (attribute in statusMods.attribute_modifiers) {
                statusAttributeMod += statusMods.attribute_modifiers[attribute];
            }
        });

        const total = baseAttribute + skillBonus + statusSkillMod + statusAttributeMod;
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
    gameState: any = {}
): OpposedCheckResult {
    const attackerResult = makeSkillCheck(attacker, attackerSkill, attacker_modifier, gameState);
    
    // Convert single skill to array if needed
    const defenseOptionsArray = defenseOptions 
        ? (Array.isArray(defenseOptions) ? defenseOptions : [defenseOptions])
        : [attackerSkill]; // Default to same skill if no options provided
    
    const defenderSkill = getBestDefensiveSkill(defender, defenseOptionsArray, gameState);
    const defenderResult = makeSkillCheck(defender, defenderSkill, 0, gameState);
    
    // Calculate the margin between attacker and defender
    const margin = attackerResult.margin - defenderResult.margin;
    
    // If one succeeds and one fails, success wins
    let attackerWins = false;
    if (attackerResult.success && !defenderResult.success) {
        attackerWins = true;
    } else if (!attackerResult.success && defenderResult.success) {
        attackerWins = false;
    } else {
        // If both succeed or both fail, compare margins
        // For success ties, attacker wins (they met the target number)
        // For failure ties, defender wins
        attackerWins = attackerResult.success ? 
            attackerResult.margin > defenderResult.margin : // Success ties go to defender
            attackerResult.margin >= defenderResult.margin;   // Failure ties go to attacker
    }
    
    return {
        attacker: attackerResult,
        defender: defenderResult,
        margin,
        attackerWins,
        defenderSkill
    };
}
