import { TaskType, PROMPTS } from './prompts.js';

export type Message = {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function callLLM(
    taskType: TaskType,
    messages: Message[],
    apiKey: string,
    model = 'meta-llama/llama-3.3-70b-instruct:free'
): Promise<string> {
    // Get the prompts for this task type
    const { system, task } = PROMPTS[taskType];

    // Construct the full message array with system prompt and task
    const fullMessages: Message[] = [
        { role: 'system', content: system },
        ...messages,
        { role: 'user', content: task }
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
