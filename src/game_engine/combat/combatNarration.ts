import { CombatState } from '../../types/combatState';
import { callLLM, formatSystemPrompt } from '../llm';
import { LLMLogFormatters } from '../llmLogFormatters';
import { SpiceLevel, Length, SpiceLevels, Lengths } from '../../types/prompts';

// Import JSON data
import promptsData from '@assets/descriptions/prompts.json';
import { StatusEvent } from '../../events/eventTypes';
import { StatusName } from '../../types/status';
import { get_api_key } from '../settings';
import { GameSettings } from '../../types/gamestate';

// Type assertion to help TypeScript understand the structure
const TASKS = promptsData.tasks;
const PROMPTS = promptsData.prompts;

// Determine narration settings based on combat state and action type
function getNarrationSettings(state: CombatState, isInitialNarration: boolean = false, roundIndex?: number): { spiceLevel: SpiceLevel, length: Length } {
    // Initial narration is always SUGGESTIVE/MEDIUM
    if (isInitialNarration) {
        return { spiceLevel: SpiceLevels.SUGGESTIVE, length: Lengths.MEDIUM };
    }

    // Use provided round index or default to current round
    const targetRoundIndex = roundIndex !== undefined ? roundIndex : state.round - 1;
    
    // Check target round's combat logs for events
    const targetRoundLog = state.combatLog[targetRoundIndex];
    if (!targetRoundLog) {
        return { spiceLevel: SpiceLevels.SUGGESTIVE, length: Lengths.MEDIUM };
    }

    // Check events in the combat log (only for this specific round)
    const events = targetRoundLog.events || [];
    
    // Check for penetration status
    const hasPenetration = events.some(event => {
        if (event.type === 'STATUS') {
            const statusEvent = event as StatusEvent;
            return statusEvent.status.name === StatusName.PENETRATED && 
                   statusEvent.action === 'ADDED';
        }
        return false;
    });
    
    if (hasPenetration) {
        return { spiceLevel: SpiceLevels.EXPLICIT, length: Lengths.LONG };
    }
    
    // Check for grapple, bound, or heat statuses
    const hasIntimateContact = events.some(event => {
        if (event.type === 'STATUS') {
            const statusEvent = event as StatusEvent;
            const statusName = statusEvent.status.name;
            const isAdded = statusEvent.action === 'ADDED' || statusEvent.action === 'STACKS_INCREASED';
            
            return isAdded && (
                statusName === StatusName.GRAPPLED ||
                statusName === StatusName.HEAT ||
                statusName === StatusName.BOUND_ARM ||
                statusName === StatusName.BOUND_LEG ||
                statusName === StatusName.BOUND_MOUTH ||
                statusName === StatusName.BOUND_TAIL
            );
        }
        return false;
    });
    
    if (hasIntimateContact) {
        return { spiceLevel: SpiceLevels.SUGGESTIVE, length: Lengths.MEDIUM };
    }

    // Default to NONE/SHORT for regular combat actions
    return { spiceLevel: SpiceLevels.NONE, length: Lengths.SHORT };
}

/**
 * Determines which LLM model to use based on spice level and length
 * @param spiceLevel The spice level of the narration
 * @param length The length of the narration
 * @param settings The game settings containing model information
 * @returns The appropriate model string to use for the narration
 */
function getModelForNarration(spiceLevel: SpiceLevel, length: Length, settings: GameSettings): string {
    // Currently only using spice level to determine model
    // Length parameter included for future extensibility
    if (spiceLevel === SpiceLevels.EXPLICIT) {
        return settings.spicy_llm;
    }
    
    return settings.llm;
}

export async function generateInitialNarration(
    state: CombatState,
    structuredLogs: string
): Promise<string> {
    try {
        const characters = state.characters;
        const currentRoundLog = state.combatLog[0];
        const room = state.room;
        
        const { spiceLevel, length } = getNarrationSettings(state, true, 0);
        const characterInfo = LLMLogFormatters.formatCharactersForLLM(characters[0], characters[1]);
        
        // Generate structured logs if not provided
        const formattedLogs = structuredLogs || 
            LLMLogFormatters.formatEventsForSingleRound(currentRoundLog.events || []);
        
        // Get the appropriate model for this narration
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            spiceLevel,
            length,
            formattedLogs,  // Use the new structured logs
            [], // No previous narrations for initial
            TASKS.INITIAL_COMBAT,
            room?.description,
            characterInfo
        );
        
        // Log the prompt
        if (state.combatLog.length > 0) {
            state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
        }

        return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
    } catch (error) {
        console.error('Failed to generate initial combat narration:', error);
        const characters = state.characters;
        return `A battle begins between ${characters[0].name} and ${characters[1].name}!`;
    }
}

export async function generateRoundNarration(
    state: CombatState,
    structuredLogs?: string
): Promise<string> {
    try {
        const characters = state.characters;
        const currentRoundLog = state.combatLog[state.round];
        const previousNarrations = state.combatLog
            .slice(0, state.round)
            .flatMap(log => log.llmNarrations);
        
        // Use the just-completed round for narration settings
        const { spiceLevel, length } = getNarrationSettings(state, false, state.round - 1);
        const characterInfo = LLMLogFormatters.formatCharactersForLLM(characters[0], characters[1]);
        
        // Generate structured logs if not provided
        const formattedLogs = structuredLogs ||
            LLMLogFormatters.formatEventsForSingleRound(currentRoundLog.events || []);
        
        // Get the appropriate model for this narration
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            spiceLevel,
            length,
            formattedLogs,  // Use the new structured logs
            previousNarrations,
            TASKS.CONTINUE_COMBAT,
            null, // No room description needed for round narration
            characterInfo
        );
        
        // Log the prompt
        if (state.combatLog.length > 0) {
            state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
        }
        
        return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
    } catch (error) {
        console.error('Failed to generate round narration:', error);
        return `Round ${state.round} combat actions completed.`;
    }
}

export async function generateAfterMathNarration(
    state: CombatState,
    structuredLogs?: string
): Promise<string> {
    try {
        const characters = state.characters;
        const currentRoundLog = state.combatLog[state.round - 1];
        const previousNarrations = state.combatLog
            .flatMap(log => log.llmNarrations);
        
        // Use the final round for narration settings
        const { spiceLevel, length } = getNarrationSettings(state, false, state.round - 1);
        const characterInfo = LLMLogFormatters.formatCharactersForLLM(characters[0], characters[1]);
        
        // Generate structured logs if not provided
        const formattedLogs = structuredLogs ||
            LLMLogFormatters.formatEventsForSingleRound(currentRoundLog.events || []);
        
        // Get the appropriate model for this narration
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            spiceLevel,
            length,
            formattedLogs,  // Use the new structured logs
            previousNarrations,
            TASKS.COMBAT_AFTERMATH, 
            null, // Room description
            characterInfo
        );
        
        // Log the prompt
        if (state.combatLog.length > 0) {
            state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
        }
        
        return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
    } catch (error) {
        console.error('Failed to generate aftermath narration:', error);
        return `The combat has ended.`;
    }
}