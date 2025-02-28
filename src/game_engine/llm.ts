import promptsData from '../../public/data/prompts.json';

export type TaskType = 'narrate';
const PROMPTS = promptsData.prompts;

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Format the system prompt with all required information
export function formatSystemPrompt(
    prompt: string,
    spiceLevel: string,
    length: string,
    combatLogs: string[],
    previousNarration: string[] = [],
    task: string,
    roomDescription?: string,
    characterInfo?: string
): string {
    // Build room description section
    const roomSection = roomDescription 
        ? `=== Room Description ===\n${roomDescription}`
        : '';
    
    // Format combat logs
    const formattedLogs = combatLogs.length > 0 
        ? `=== Recent Combat Actions ===\n${combatLogs.join('\n')}`
        : '';

    return prompt
        .replace('{spiceLevel}', spiceLevel)
        .replace('{length}', length)
        .replace('{roomDescription}', roomSection)
        .replace('{characterInfo}', characterInfo)
        .replace('{combatLogs}', formattedLogs)
        .replace('{previousNarration}', previousNarration.join('\n'))
        .replace('{task}', task);
}

function cleanLLMResponse(response: string): string {    
    return response;
}

export async function callLLM(
    taskType: TaskType,
    messages: string[],
    model = 'anthropic/claude-3.7-sonnet' // 'meta-llama/llama-3.3-70b-instruct:free'
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
