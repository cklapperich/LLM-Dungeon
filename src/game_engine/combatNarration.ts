import { Character } from '../types/actor';
import { GameState, getCharactersFromIdList } from '../types/gamestate';
import { CombatState } from './combatState';
import { callLLM, narrationHelpers } from './llm';
import { PROMPTS, TASKS } from './prompts';

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
            currentRoundLog.combatLogs,
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
        const currentRoundLog = state.combatLog[state.round - 1];
        const previousNarrations = state.combatLog
            .slice(0, state.round - 1)
            .flatMap(log => log.narrations);
        
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, false);
        
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            characters[0],
            characters[1],
            spiceLevel,
            length,
            currentRoundLog.combatLogs,
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
