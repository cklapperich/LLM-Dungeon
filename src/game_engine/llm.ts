import { TaskType, PROMPTS } from './prompts.js';
import { Character } from '../types/actor.js';
import { CombatState } from './combatState.js';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Format character information for the prompt
function formatCharacterInfo(hero: Character, monster: Character): string {
    return `HERO: ${hero.name} - ${hero.description}
Stats: Might ${hero.might}, Grace ${hero.grace}, Wit ${hero.wit}, Will ${hero.will}
Skills: ${Object.entries(hero.skills).map(([skill, level]) => `${skill} (${level})`).join(', ')}

MONSTER: ${monster.name} - ${monster.description}
Stats: Might ${monster.might}, Grace ${monster.grace}, Wit ${monster.wit}, Will ${monster.will}
Skills: ${Object.entries(monster.skills).map(([skill, level]) => `${skill} (${level})`).join(', ')}`;
}

// Determine narration settings based on combat state and action type
function getNarrationSettings(state: CombatState, isInitialNarration: boolean = false): { spiceLevel: string, length: string } {
    // Initial narration is always SUGGESTIVE/MEDIUM
    if (isInitialNarration) {
        return { spiceLevel: 'SUGGESTIVE', length: '4 sentences, a short paragraph.' };
    }

    // Check current round's combat logs for grapple actions
    const currentRoundLog = state.combatLog[state.round - 1];
    if (currentRoundLog?.combatLogs.some(log => 
        log.toLowerCase().includes('grapple') || 
        log.toLowerCase().includes('prone') ||
        log.toLowerCase().includes('heat')
    )) {
        return { spiceLevel: 'SUGGESTIVE', length: 'A meaty paragraph, 4-6 sentences.' };
    }

    // Default to NONE/SHORT for regular combat actions
    return { spiceLevel: 'NONE', length: '2-3 sentences, a short paragraph.' };
}

// Format the system prompt with all required information
function formatSystemPrompt(
    prompt: string,
    hero: Character,
    monster: Character,
    spiceLevel: string,
    length: string,
    combatLogs: string[],
    previousNarration: string[] = [],
    task: string,
    roomDescription?: string
): string {
    // Build room description section
    const roomSection = roomDescription 
        ? `=== Room Description ===\n${roomDescription}`
        : '';

    return prompt
        .replace('{spiceLevel}', spiceLevel)
        .replace('{length}', length)
        .replace('{roomDescription}', roomSection)
        .replace('{characterInfo}', formatCharacterInfo(hero, monster))
        .replace('{combatLogs}', combatLogs.join('\n'))
        .replace('{previousNarration}', previousNarration.join('\n'))
        .replace('{task}', task);
}

// Clean LLM response by removing repeated settings
function cleanLLMResponse(response: string): string {
    // Remove spice level line with value (case insensitive)
    response = response.replace(/(?:spice level|spiciness)(?:\s*:|:)?\s*(?:is\s+)?(?:set\s+to\s+)?[a-zA-Z]+(?:[,\s]*[\r\n]+)?/i, '');
    
    // Remove length line with value (case insensitive)
    response = response.replace(/length(?:\s*:|:)?\s*(?:is\s+)?(?:set\s+to\s+)?(?:[^.!?\r\n]+[.!?\r\n])/i, '');
    
    // Clean up any extra newlines and spaces at the start
    response = response.replace(/^[\s\r\n]+/, '');
    
    return response;
}

export async function callLLM(
    taskType: TaskType,
    messages: string[],
    model = 'anthropic/claude-3.5-sonnet' // 'meta-llama/llama-3.3-70b-instruct:free'
): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_OPENROUTER_API_KEY environment variable is required');
    }
    // Get the prompts for this task type
    const { system, task } = PROMPTS[taskType];

    // Construct the full message array with system prompt and task
    const fullMessages: ChatMessage[] = [
        { role: 'system' as const, content: system },
        ...messages.map(msg => ({ role: 'user' as const, content: msg })),
        { role: 'user' as const, content: task }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:8000',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: fullMessages
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return cleanLLMResponse(data.choices[0].message.content);
}

// Export helper functions for use in combat.ts
export const narrationHelpers = {
    formatSystemPrompt,
    getNarrationSettings,
    formatCharacterInfo
};
