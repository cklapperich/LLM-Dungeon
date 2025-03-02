import skillDescriptions from '@assets/descriptions/skillchecks.json';
import status from '@assets/descriptions/status.json';
import attributes from '@assets/descriptions/attributes.json';
import armorDescriptions from '@assets/descriptions/clothing.json';
import vitalityDescriptions from '@assets/descriptions/vitality.json';
import convictionDescriptions from '@assets/descriptions/conviction.json';
import { IntensityType, IntensityTypes } from '../../types/constants';
import { RollResult, SkillNames } from '../../types/skilltypes';

export class DescriptionManager {
    static getSkillDescription(skillName: string, intensity: IntensityTypes): string {
        try {
            // Get the clean skill name from SkillNames if possible
            const cleanSkillName = Object.values(SkillNames).find(name => name === skillName) || skillName;
            const prompts = skillDescriptions.skills[cleanSkillName]?.[intensity] || 
                          skillDescriptions.generic[intensity];
            return prompts[Math.floor(Math.random() * prompts.length)];
        } catch (error) {
            console.warn(`No skill description found for ${skillName}`);
            return '';
        }
    }

    /**
     * Gets a description of a character's armor based on type and damage state
     * @param armor Object containing current and max armor values
     * @returns A description of the character's armor
     */
    static getArmorDescription(armor: { current: number, max: number }): string {
        const { current, max } = armor;
        
        // Quick validation - just the essential checks
        if (current < 0 || max < 0 || current > max || !armorDescriptions.armorTypes[max.toString()]) {
            console.error(`Invalid armor: current=${current}, max=${max}`);
            return "wearing damaged armor"; // Fallback description instead of throwing
        }
        
        // Handle special cases first
        if (max === 0) {
            return armorDescriptions.armorTypes["0"]; // Unarmored
        }
        
        if (current === 0) {
            return `${armorDescriptions.armorTypes[max.toString()]} ${armorDescriptions.damageStates.destroyed}`;
        }
        
        // Normal case - find damage state based on percentage
        const damagePercentage = (current / max) * 100;
        
        // Find first threshold that applies
        const damageState = armorDescriptions.damageThresholds.find(
            t => damagePercentage >= t.threshold
        )?.state || "destroyed";
        
        // Combine armor type with damage state
        return `${armorDescriptions.armorTypes[max.toString()]} ${armorDescriptions.damageStates[damageState]}`;
    }

    static getAttributeDescription(value: number): string {
        let key: string;
        if (value <= 6) key = '6_or_less';
        else if (value === 7) key = '7';
        else if (value <= 9) key = '8_9';
        else if (value === 10) key = '10';
        else if (value <= 12) key = '11_12';
        else if (value <= 14) key = '13_14';
        else if (value <= 16) key = '15_16';
        else if (value <= 18) key = '17_18';
        else if (value <= 20) key = '19_20';
        else key = '21_plus';

        try {
            const prompts = attributes[key];
            return prompts[Math.floor(Math.random() * prompts.length)];
        } catch (error) {
            console.warn(`No attribute description found for value ${value}`);
            return '';
        }
    }

    /**
     * Gets a description of a character's vitality based on current and maximum values
     * @param vitality Object containing current and max vitality values
     * @returns A description of the character's vitality state
     */
    static getVitalityDescription(vitality: { current: number, max: number }): string {
        const { current, max } = vitality;
        
        // Validate inputs
        if (current < 0 || max <= 0 || current > max) {
            console.error(`Invalid vitality: current=${current}, max=${max}`);
            return "in an unknown state"; // Fallback
        }
        
        // Handle special case where vitality is depleted
        if (current === 0) {
            return vitalityDescriptions.descriptions.depleted[
                Math.floor(Math.random() * vitalityDescriptions.descriptions.depleted.length)
            ];
        }
        
        // Calculate percentage of remaining vitality
        const vitalityPercentage = (current / max) * 100;
        
        // Find the appropriate state based on thresholds
        const vitalityState = vitalityDescriptions.thresholds.find(
            t => vitalityPercentage >= t.threshold
        )?.state || "depleted";
        
        // Get a random description for this state
        const descriptions = vitalityDescriptions.descriptions[vitalityState];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    /**
     * Gets a description of a character's conviction level (mental resistance to influence)
     * @param conviction Object containing current and max conviction values
     * @returns A description of the character's mental state and resistance to influence
     */
    static getConvictionDescription(conviction: { current: number, max: number }): string {
        const { current, max } = conviction;
        
        // Validate inputs
        if (current < 0 || max <= 0 || current > max) {
            console.error(`Invalid conviction: current=${current}, max=${max}`);
            return "in an indescribable mental state"; // Fallback
        }
        
        // Handle special case where conviction is completely eroded
        if (current === 0) {
            return convictionDescriptions.descriptions.broken[
                Math.floor(Math.random() * convictionDescriptions.descriptions.broken.length)
            ];
        }
        
        // Calculate percentage of remaining conviction
        const convictionPercentage = (current / max) * 100;
        
        // Find the appropriate state based on thresholds
        const convictionState = convictionDescriptions.thresholds.find(
            t => convictionPercentage >= t.threshold
        )?.state || "broken";
        
        // Get a random description for this state
        const descriptions = convictionDescriptions.descriptions[convictionState];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    static getStatusDescription(statusName: string, stacks: number): string {
        const statusObj = status[statusName];
        
        if (!statusObj) {
            console.warn(`No status description found for ${statusName}`);
            return '';
        }
        
        // Convert stacks to string
        let stacksStr = stacks.toString();
        
        // If exact stack level exists, use it
        if (statusObj[stacksStr]) {
            const descriptions = statusObj[stacksStr];
            return descriptions[Math.floor(Math.random() * descriptions.length)];
        }
        
        // Find the highest level that's lower than current stacks
        const availableLevels = Object.keys(statusObj)
            .map(key => parseInt(key))
            .filter(level => !isNaN(level) && level <= stacks)
            .sort((a, b) => b - a);
        
        if (availableLevels.length > 0) {
            const highestLevel = availableLevels[0].toString();
            const descriptions = statusObj[highestLevel];
            return descriptions[Math.floor(Math.random() * descriptions.length)];
        }
        
        // No appropriate level found
        console.warn(`No appropriate level found for status ${statusName}`);
        return '';
    }

    /**
     * Determines intensity level from a margin value (for opposed checks)
     * @param margin The margin value (attacker.margin - defender.margin)
     * @returns The appropriate intensity level
     */
    static getIntensityFromMargin(margin: number): IntensityTypes {
        const { MARGIN_THRESHOLDS } = {
            MARGIN_THRESHOLDS: {
                SOLID_SUCCESS: 4,
                MINIMAL_SUCCESS: 1,
                SOLID_FAILURE: -4
            }
        };

        // For margins, we don't have critical success/failure info
        // so we just use the margin thresholds
        if (margin >= MARGIN_THRESHOLDS.SOLID_SUCCESS) return IntensityType.SOLID_SUCCESS;
        if (margin >= MARGIN_THRESHOLDS.MINIMAL_SUCCESS) return IntensityType.MINIMAL_SUCCESS;
        if (margin > MARGIN_THRESHOLDS.SOLID_FAILURE) return IntensityType.SOLID_FAILURE;

        return IntensityType.MINIMAL_FAILURE;
    }

    /**
     * Gets a skill description directly from a skill name and margin
     * @param skillName The name of the skill
     * @param margin The margin value
     * @returns A description of the skill check result
     */
    static getSkillDescriptionFromMargin(skillName: string, margin: number): string {
        const intensity = this.getIntensityFromMargin(margin);
        return this.getSkillDescription(skillName, intensity);
    }

    /**
     * Ensures all descriptions have proper punctuation and formatting
     * @param text The description text to standardize
     * @returns The standardized text
     */
    static standardizePunctuation(text: string): string {
        if (!text) return '';
        
        // Trim whitespace
        let standardized = text.trim();
        
        // Ensure first letter is capitalized
        if (standardized.length > 0) {
            standardized = standardized.charAt(0).toUpperCase() + standardized.slice(1);
        }
        
        // Ensure the text ends with proper punctuation
        const lastChar = standardized.charAt(standardized.length - 1);
        if (!['.', '!', '?', '...'].includes(lastChar) && standardized.length > 0) {
            standardized += '.';
        }
        
        return standardized;
    }
}