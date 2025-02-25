import { Character } from '../types/actor';
import { GameState, getCharactersFromIdList } from '../types/gamestate';
import { CombatState } from '../types/combatState';
import { callLLM, narrationHelpers } from './llm';

// Import JSON data
import promptsData from '../../data/prompts.json';

export type SpiceLevel = 'NONE' | 'SUGGESTIVE' | 'EXPLICIT';

const TASKS = promptsData.tasks;
const PROMPTS = promptsData.prompts;

export async function generateInitialNarration(
    state: CombatState,
    gameState: GameState
): Promise<string> {
    try {
        const characters = getCharactersFromIdList(state.characterIds, gameState);
        const currentRoundLog = state.combatLog[0];
        const room = gameState.dungeon.rooms[state.roomId];
        
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, true);
        
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            [], // No previous narrations for initial
            TASKS.INITIAL_COMBAT,
            room?.description
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
        
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, false);
        
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            previousNarrations,
            TASKS.CONTINUE_COMBAT,
            null // No room description needed for round narration
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
        
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, false);
        
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.llmContextLog || [],
            previousNarrations,
            TASKS.COMBAT_AFTERMATH,
            null
        );

        return await callLLM('narrate', [systemPrompt]);
    } catch (error) {
        console.error('Failed to generate aftermath narration:', error);
        return `The combat has ended.`;
    }
}
