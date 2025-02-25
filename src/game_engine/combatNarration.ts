import { Character } from '../types/actor';
import { GameState, getCharactersFromIdList } from '../types/gamestate';
import { CombatState } from '../types/combatState';
import { callLLM, formatSystemPrompt } from './llm';
import { LLMLogFormatters } from './logs/llmLogFormatters';

// TODO - update this to check for events in the combat log and adjust the narration accordingly
// Import JSON data
import promptsData from '../../data/prompts.json';

export type SpiceLevel = 'NONE' | 'SUGGESTIVE' | 'EXPLICIT';

const TASKS = promptsData.tasks;
const PROMPTS = promptsData.prompts;

// Determine narration settings based on combat state and action type
function getNarrationSettings(state: CombatState, isInitialNarration: boolean = false): { spiceLevel: string, length: string } {
    const { NONE, SUGGESTIVE, EXPLICIT } = promptsData.spiceLevels;
    // Initial narration is always SUGGESTIVE/MEDIUM
    if (isInitialNarration) {
        return { spiceLevel: 'SUGGESTIVE', length: '4  sentences, a short paragraph.' };
    }

    // Check current round's combat logs for grapple actions
    const currentRoundLog = state.combatLog[state.round - 1];
    if (!currentRoundLog) {
        return { spiceLevel: 'SUGGESTIVE', length: '4 sentences, a short paragraph.' };
    }

    const logs = currentRoundLog.llmContextLog || [];
    if (logs.some(log => log?.toLowerCase().includes('penetrat'))) {
        return { spiceLevel: EXPLICIT, length: 'A detailed paragraph, 6-8 sentences.' };
    }
    if (logs.some(log => 
        log?.toLowerCase().includes('grapple') || 
        log?.toLowerCase().includes('prone') ||
        log?.toLowerCase().includes('heat')
    )) {
        return { spiceLevel: SUGGESTIVE, length: 'A meaty paragraph, 4-6 sentences.' };
    }

    // Default to NONE/SHORT for regular combat actions
    return { spiceLevel: NONE, length: '2-3 sentences, a short paragraph.' };
}

export async function generateInitialNarration(
    state: CombatState,
    gameState: GameState
): Promise<string> {
    try {
        const characters = getCharactersFromIdList(state.characterIds, gameState);
        const currentRoundLog = state.combatLog[0];
        const room = gameState.dungeon.rooms[state.roomId];
        
        const { spiceLevel, length } = getNarrationSettings(state, true);
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
        const characters = getCharactersFromIdList(state.characterIds, gameState);
        return `A battle begins between ${characters[0].name} and ${characters[1].name}!`;
    }
}

export async function generateRoundNarration(
    state: CombatState,
    gameState: GameState
): Promise<string> {
    try {
        const characters = getCharactersFromIdList(state.characterIds, gameState);
        const currentRoundLog = state.combatLog[state.round];
        const previousNarrations = state.combatLog
            .slice(0, state.round)
            .flatMap(log => log.llmNarrations);
        
        const { spiceLevel, length } = getNarrationSettings(state, false);
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
    state: CombatState,
    gameState: GameState
): Promise<string> {
    try {
        const characters = getCharactersFromIdList(state.characterIds, gameState);
        const currentRoundLog = state.combatLog[state.round - 1];
        const previousNarrations = state.combatLog
            .flatMap(log => log.llmNarrations);
        
        const { spiceLevel, length } = getNarrationSettings(state, false);
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
