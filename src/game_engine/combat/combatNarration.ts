import { GameState } from '../../types/gamestate';
import { CombatState } from '../../types/combatState';
import { callLLM, formatSystemPrompt } from '../llm';
import { LLMLogFormatters } from '../llmLogFormatters';
import { SpiceLevel, Length, PromptsData } from '../../types/prompts';

// Import JSON data
import promptsData from '../../../data/prompts.json';
import { StatusEvent } from '../../events/eventTypes';
import { StatusName } from '../../types/status';

// Type assertion to help TypeScript understand the structure
const typedPromptsData = promptsData as PromptsData;

const TASKS = promptsData.tasks;
const PROMPTS = promptsData.prompts;

// Determine narration settings based on combat state and action type
function getNarrationSettings(state: CombatState, isInitialNarration: boolean = false, roundIndex?: number): { spiceLevel: SpiceLevel, length: Length } {
    // Initial narration is always SUGGESTIVE/MEDIUM
    if (isInitialNarration) {
        return { spiceLevel: 'SUGGESTIVE', length: 'MEDIUM' };
    }

    // Use provided round index or default to current round
    const targetRoundIndex = roundIndex !== undefined ? roundIndex : state.round - 1;
    
    // Check target round's combat logs for events
    const targetRoundLog = state.combatLog[targetRoundIndex];
    if (!targetRoundLog) {
        return { spiceLevel: 'SUGGESTIVE', length: 'MEDIUM' };
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
        return { spiceLevel: 'EXPLICIT', length: 'LONG' };
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
                statusName === StatusName.BOUND_TAIL ||
                statusName === StatusName.BOUND_MONSTER_PART
            );
        }
        return false;
    });
    
    if (hasIntimateContact) {
        return { spiceLevel: 'SUGGESTIVE', length: 'MEATY' };
    }

    // Default to NONE/SHORT for regular combat actions
    return { spiceLevel: 'NONE', length: 'SHORT' };
}

export async function generateInitialNarration(
    state: CombatState
): Promise<string> {
    try {
        const characters = state.characters;
        const currentRoundLog = state.combatLog[0];
        const room = state.room;
        
        const { spiceLevel, length } = getNarrationSettings(state, true, 0);
        const characterInfo = LLMLogFormatters.formatCharactersForLLM(characters[0], characters[1]);
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            [], // No previous narrations for initial
            TASKS.INITIAL_COMBAT,
            room?.description,
            characterInfo
        );

        return await callLLM('narrate', [systemPrompt]);
    } catch (error) {
        console.error('Failed to generate initial combat narration:', error);
        const characters = state.characters;
        return `A battle begins between ${characters[0].name} and ${characters[1].name}!`;
    }
}

export async function generateRoundNarration(
    state: CombatState
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
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            previousNarrations,
            TASKS.CONTINUE_COMBAT,
            null, // No room description needed for round narration
            characterInfo
        );

        return await callLLM('narrate', [systemPrompt]);
    } catch (error) {
        console.error('Failed to generate round narration:', error);
        return `Round ${state.round} combat actions completed.`;
    }
}

export async function generateAfterMathNarration(
    state: CombatState
): Promise<string> {
    try {
        const characters = state.characters;
        const currentRoundLog = state.combatLog[state.round - 1];
        const previousNarrations = state.combatLog
            .flatMap(log => log.llmNarrations);
        
        // Use the final round for narration settings
        const { spiceLevel, length } = getNarrationSettings(state, false, state.round - 1);
        const characterInfo = LLMLogFormatters.formatCharactersForLLM(characters[0], characters[1]);
        
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            previousNarrations,
            TASKS.COMBAT_AFTERMATH,
            null,
            characterInfo
        );

        return await callLLM('narrate', [systemPrompt]);
    } catch (error) {
        console.error('Failed to generate aftermath narration:', error);
        return `The combat has ended.`;
    }
}
