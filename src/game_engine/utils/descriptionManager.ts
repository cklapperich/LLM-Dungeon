/**
 * DescriptionManager
 * 
 * PURPOSE:
 * Created to ensure consistent narrative theming and vocabulary throughout the game.
 * This component maps mechanical values (like health percentages or skill check margins)
 * to appropriate descriptive text, maintaining the game's tone while adding variety
 * through randomization. This prevents repetitive descriptions while keeping the
 * narrative voice consistent.
 */

import skillDescriptions from '@assets/descriptions/skillchecks.json';
import status from '@assets/descriptions/status.json';
import attributes from '@assets/descriptions/attributes.json';
import armorDescriptions from '@assets/descriptions/clothing.json';
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

    static getVitalityDescription(value: number): string {
        try {
            const prompts = attributes.vitality[value.toString()];
            return prompts ? prompts[Math.floor(Math.random() * prompts.length)] : '';
        } catch (error) {
            console.warn(`No vitality description found for value ${value}`);
            return '';
        }
    }

    static getCorruptionDescription(value: number): string {
        try {
            const prompts = attributes.corruption[value.toString()];
            return prompts ? prompts[Math.floor(Math.random() * prompts.length)] : '';
        } catch (error) {
            console.warn(`No corruption description found for value ${value}`);
            return '';
        }
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
}
