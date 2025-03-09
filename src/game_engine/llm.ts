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
    formattedRoundLog:string,
    previousNarration: string[] = [],
    task: string,
    roomDescription?: string,
    characterInfo?: string
): string {
    // Insert jailbreak only for SUGGESTIVE or EXPLICIT spice levels
    const jailbreakPrompt = (spiceLevel === 'SUGGESTIVE' || spiceLevel === 'EXPLICIT') 
        ? PROMPTS.jailbreak 
        : '';
    
    // Format sections using LLMLogFormatters.formatSectionWithHeader directly
    const spiceLevelDescription = promptsData.spiceLevels[spiceLevel];
    const lengthDescription = promptsData.lengths[length];
    const narrationSettingsContent = `SPICE LEVEL: ${spiceLevelDescription}\nLENGTH: ${lengthDescription}`;
    const narrationSettings = LLMLogFormatters.formatSectionWithHeader('Narration Settings', narrationSettingsContent);
    
    const roomSection = LLMLogFormatters.formatSectionWithHeader('Room Description', roomDescription || '');
    const formattedLogs = LLMLogFormatters.formatSectionWithHeader('Recent Combat Actions', formattedRoundLog);
    const formattedTask = LLMLogFormatters.formatSectionWithHeader('TASK', task);
    const formattedPreviousNarration = LLMLogFormatters.formatSectionWithHeader('The Story So Far: ', previousNarration);

    // Replace placeholders in the prompt template with descriptive strings
    return prompt
        .replace('{jailbreak}', jailbreakPrompt)
        .replace('{narrationSettings}', narrationSettings)
        .replace('{roomDescription}', roomSection)
        .replace('{characterInfo}', characterInfo || '')
        .replace('{combatLogs}', formattedLogs)
        .replace('{previousNarration}', formattedPreviousNarration)
        .replace('{task}', formattedTask)
        .replace('{game_context}', GAME_CONTEXT);
}

/**
 * Error types for LLM API calls
 */
export enum LLMErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    API_ERROR = 'API_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    RESPONSE_PARSING_ERROR = 'RESPONSE_PARSING_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Creates a detailed error message for LLM API calls
 * @param errorType The type of error that occurred
 * @param message The error message
 * @param details Additional details about the error
 * @returns A formatted error message
 */
function createLLMErrorMessage(
    errorType: LLMErrorType,
    message: string,
    details: Record<string, any> = {}
): string {
    // Filter out sensitive information
    const safeDetails = { ...details };
    if (safeDetails.apiKey) safeDetails.apiKey = '[REDACTED]';
    
    return `[${errorType}] ${message} | Details: ${JSON.stringify(safeDetails)}`;
}

/**
 * Calls the LLM API with the provided messages
 * @param taskType The type of task to perform
 * @param messages The messages to send to the LLM
 * @param model The model to use
 * @param apiKey The API key to use
 * @returns The LLM response
 */
export async function callLLM(
    taskType: TaskType,
    messages: string[],
    model = 'deepseek/deepseek-chat:free',
    apiKey: string = null,
): Promise<string> {
    try {
        // Get the system prompt for this task type
        const systemPrompt = PROMPTS[taskType];

        // Construct the full message array with system prompt
        const fullMessages: ChatMessage[] = [
            { role: 'system' as const, content: systemPrompt },
            ...messages.map(msg => ({ role: 'user' as const, content: msg }))
        ];

        // Log request details (excluding sensitive info)
        const requestDetails = {
            taskType,
            model,
            messageCount: messages.length,
            firstMessagePreview: messages[0]?.substring(0, 50) + (messages[0]?.length > 50 ? '...' : '')
        };

        try {
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
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                
                // Determine error type based on status code
                let errorType = LLMErrorType.API_ERROR;
                if (response.status === 401 || response.status === 403) {
                    errorType = LLMErrorType.AUTH_ERROR;
                }
                
                const errorMessage = createLLMErrorMessage(
                    errorType,
                    `OpenRouter API error (${response.status}): ${errorData.message || 'Unknown error'}`,
                    { ...requestDetails, statusCode: response.status }
                );
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(createLLMErrorMessage(
                    LLMErrorType.RESPONSE_PARSING_ERROR,
                    'Invalid response format from OpenRouter API',
                    requestDetails
                ));
            }
            
            return data.choices[0].message.content;
        } catch (error) {
            // Handle network errors (when fetch itself fails)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(createLLMErrorMessage(
                    LLMErrorType.NETWORK_ERROR,
                    `Network error when calling OpenRouter API: ${error.message}`,
                    requestDetails
                ));
            }
            
            // Re-throw the error if it's already been processed
            throw error;
        }
    } catch (error) {
        // Catch any unhandled errors
        if (!error.message.includes('[')) {
            error.message = createLLMErrorMessage(
                LLMErrorType.UNKNOWN_ERROR,
                `Unexpected error in callLLM: ${error.message}`,
                { taskType, model }
            );
        }
        throw error;
    }
}
