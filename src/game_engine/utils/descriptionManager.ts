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
import clothing from '@assets/descriptions/clothing.json';
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

    static getClothingDescription(level: number): string {
        try {
            const prompts = clothing[level.toString()];
            return prompts[Math.floor(Math.random() * prompts.length)];
        } catch (error) {
            console.warn(`No clothing description found for level ${level}`);
            return '';
        }
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

    static getStatusDescription(statusName: string): string {
        try {
            const prompts = status[statusName];
            return prompts[Math.floor(Math.random() * prompts.length)];
        } catch (error) {
            console.warn(`No status description found for ${statusName}`);
            return '';
        }
    }

    static getIntensityFromRoll(roll: RollResult): IntensityTypes {
        const { MARGIN_THRESHOLDS } = {
            MARGIN_THRESHOLDS: {
                SOLID_SUCCESS: 4,
                MINIMAL_SUCCESS: 1,
                SOLID_FAILURE: -4
            }
        };

        // Check for critical success/failure first based on roll
        if (roll.isCriticalSuccess) return IntensityType.CRITICAL_SUCCESS;
        if (roll.isCriticalFailure) return IntensityType.CRITICAL_FAILURE;

        // Then check margins for regular success/failure
        if (roll.margin >= MARGIN_THRESHOLDS.SOLID_SUCCESS) return IntensityType.SOLID_SUCCESS;
        if (roll.margin >= MARGIN_THRESHOLDS.MINIMAL_SUCCESS) return IntensityType.MINIMAL_SUCCESS;
        if (roll.margin > MARGIN_THRESHOLDS.SOLID_FAILURE) return IntensityType.SOLID_FAILURE;

        return IntensityType.MINIMAL_FAILURE;
    }
}
