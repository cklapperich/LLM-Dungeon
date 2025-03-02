import promptsData from '@assets/descriptions/prompts.json';
import { LLMLogFormatters } from './llmLogFormatters';

export type TaskType = 'narrate';
const PROMPTS = promptsData.prompts;
const GAME_CONTEXT = promptsData.game_context;

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export function formatSystemPrompt(
    prompt: string,
    spiceLevel: string,  // Still takes enum key
    length: string,      // Still takes enum key
    combatLogs: string[],
    previousNarration: string[] = [],
    task: string,
    roomDescription?: string,
    characterInfo?: string
): string {
    // Format sections using LLMLogFormatters
    const narrationSettings = LLMLogFormatters.formatNarrationSettings(spiceLevel, length);
    const roomSection = LLMLogFormatters.formatRoomDescription(roomDescription);
    const formattedLogs = LLMLogFormatters.formatCombatLogs(combatLogs);
    const formattedTask = LLMLogFormatters.formatTask(task);
    const formattedPreviousNarration = LLMLogFormatters.formatPreviousNarration(previousNarration);

    // Replace placeholders in the prompt template with descriptive strings
    return prompt
        .replace('{narrationSettings}', narrationSettings)
        .replace('{roomDescription}', roomSection)
        .replace('{characterInfo}', characterInfo || '')
        .replace('{combatLogs}', formattedLogs)
        .replace('{previousNarration}', formattedPreviousNarration)
        .replace('{task}', formattedTask)
        .replace('{game_context}', GAME_CONTEXT);
}

export async function callLLM(
    taskType: TaskType,
    messages: string[],
    model = 'deepseek/deepseek-chat:free',
    apiKey:string=null,
): Promise<string> {

    // Get the system prompt for this task type
    const { system } = PROMPTS[taskType];

    // Construct the full message array with system prompt
    const fullMessages: ChatMessage[] = [
        { role: 'system' as const, content: system },
        ...messages.map(msg => ({ role: 'user' as const, content: msg }))
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
    return data.choices[0].message.content;
}
