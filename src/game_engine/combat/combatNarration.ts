import { CombatState } from '../../types/combatState';
import { callLLM, formatSystemPrompt, LLMErrorType } from '../llm';
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

/**
 * Creates a detailed error message for narration generation
 * @param narrationType The type of narration being generated
 * @param error The error that occurred
 * @param state The combat state
 * @param additionalInfo Additional information about the error
 * @returns A formatted error message
 */
function createNarrationErrorMessage(
    narrationType: 'initial' | 'round' | 'aftermath',
    error: Error,
    state: CombatState,
    additionalInfo: Record<string, any> = {}
): string {
    // Extract useful information from the state without including the entire state object
    const stateInfo = {
        round: state.round,
        charactersPresent: state.characters.map(c => c.name),
        spiceLevel: additionalInfo.spiceLevel,
        length: additionalInfo.length,
        modelUsed: additionalInfo.model
    };
    
    // Check if this is an LLM error with a specific type
    const errorTypeMatch = error.message.match(/\[(.*?)\]/);
    const errorType = errorTypeMatch ? errorTypeMatch[1] : 'NARRATION_ERROR';
    
    return `Failed to generate ${narrationType} narration [${errorType}]: ${error.message} | State: ${JSON.stringify(stateInfo)}`;
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
        
        // Track narration context for error reporting
        const narrationContext = {
            spiceLevel,
            length,
            model,
            isInitial: true,
            hasEvents: (currentRoundLog.events || []).length > 0,
            roomProvided: !!room?.description
        };
        
        try {
            const systemPrompt = formatSystemPrompt(
                PROMPTS.narrate,
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
            // Handle specific formatting errors
            if (error.message.includes('formatSystemPrompt')) {
                console.error(createNarrationErrorMessage(
                    'initial',
                    new Error(`Prompt formatting failed: ${error.message}`),
                    state,
                    narrationContext
                ));
            } else {
                // Re-throw for the outer catch block to handle
                throw error;
            }
        }
    } catch (error) {
        // Get narration settings again for error context
        const { spiceLevel, length } = getNarrationSettings(state, true, 0);
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        console.error(createNarrationErrorMessage(
            'initial',
            error,
            state,
            { spiceLevel, length, model }
        ));
        
        const characters = state.characters;
        return `A battle begins between ${characters[0].name} and ${characters[1].name}!`;
    }
}

export async function generateRoundNarration(
    state: CombatState,
    structuredLogs?: string
): Promise<string> {
    try {
        // Validate state has the required data
        if (!state.combatLog || state.round < 0 || state.round >= state.combatLog.length) {
            throw new Error(`Invalid combat state: round ${state.round} not found in combat log (length: ${state.combatLog?.length || 0})`);
        }
        
        const characters = state.characters;
        const currentRoundLog = state.combatLog[state.round];
        
        // Check if we have a valid current round log
        if (!currentRoundLog) {
            throw new Error(`Missing combat log for round ${state.round}`);
        }
        
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
        
        // Track narration context for error reporting
        const narrationContext = {
            spiceLevel,
            length,
            model,
            round: state.round,
            eventsCount: (currentRoundLog.events || []).length,
            previousNarrationsCount: previousNarrations.length,
            isExplicit: spiceLevel === SpiceLevels.EXPLICIT
        };
        
        try {
            const systemPrompt = formatSystemPrompt(
                PROMPTS.narrate,
                spiceLevel,
                length,
                formattedLogs,
                previousNarrations,
                TASKS.CONTINUE_COMBAT,
                null, // No room description needed for round narration
                characterInfo
            );
            
            // Log the prompt
            if (state.combatLog.length > 0) {
                state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
            }
            
            // Special handling for explicit narrations
            if (spiceLevel === SpiceLevels.EXPLICIT) {
                try {
                    return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
                } catch (explicitError) {
                    // Log the explicit narration error
                    console.error(createNarrationErrorMessage(
                        'round',
                        new Error(`Explicit narration failed: ${explicitError.message}`),
                        state,
                        narrationContext
                    ));
                    
                    // Fall back to suggestive narration
                    const fallbackSystemPrompt = formatSystemPrompt(
                        PROMPTS.narrate,
                        SpiceLevels.SUGGESTIVE, // Fallback to suggestive
                        length,
                        formattedLogs,
                        previousNarrations,
                        TASKS.CONTINUE_COMBAT,
                        null,
                        characterInfo
                    );
                    
                    // Use the regular model for fallback
                    return await callLLM('narrate', [fallbackSystemPrompt], state.settings.llm, get_api_key(state.settings));
                }
            }
            
            return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
        } catch (error) {
            // Handle specific formatting errors
            if (error.message.includes('formatSystemPrompt')) {
                console.error(createNarrationErrorMessage(
                    'round',
                    new Error(`Prompt formatting failed: ${error.message}`),
                    state,
                    narrationContext
                ));
            }
            
            // Re-throw for the outer catch block to handle
            throw error;
        }
    } catch (error) {
        // Get narration settings again for error context
        const { spiceLevel, length } = getNarrationSettings(state, false, state.round - 1);
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        console.error(createNarrationErrorMessage(
            'round',
            error,
            state,
            { spiceLevel, length, model, round: state.round }
        ));
        
        return `Round ${state.round} combat actions completed.`;
    }
}

/**
 * Annotates a narration by adding references to combat events
 * @param narration The narration to annotate
 * @param state The current combat state
 * @param roundIndex The index of the round to use for annotation
 * @returns The annotated narration
 */
export async function annotateNarration(
    narration: string,
    state: CombatState,
    roundIndex: number
): Promise<string> {
    try {
        // Get the round log for the specified round
        const roundLog = state.combatLog[roundIndex];
        if (!roundLog || !roundLog.events || roundLog.events.length === 0) {
            console.error(`No events found for round ${roundIndex}`);
            return narration;
        }
        
        // Filter the logs for annotation
        const filteredLogs = LLMLogFormatters.filterLogsForAnnotation(roundLog.events);
        
        // Determine which model to use for annotation
        const model = state.settings.annotation_llm || state.settings.llm;
        
        // Create a system prompt for annotation
        const systemPrompt = formatSystemPrompt(
            PROMPTS.narrate,
            SpiceLevels.NONE, // Annotation doesn't need spice level
            Lengths.SHORT,    // Length doesn't matter for annotation
            filteredLogs,     // The filtered logs for reference
            [],               // No previous narrations needed
            TASKS.ANNOTATE_COMBAT, // Use the annotation task
            null,             // No room description needed
            null              // No character info needed
        );
        
        // Add the narration to annotate as a user message
        const userMessage = narration;
        
        // Log the prompt
        if (state.combatLog.length > 0) {
            state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
        }
        
        // Call the LLM to annotate the narration
        return await callLLM('narrate', [systemPrompt, userMessage], model, get_api_key(state.settings));
    } catch (error) {
        console.error(`Failed to annotate narration: ${error.message}`);
        // Return the original narration if annotation fails
        return narration;
    }
}

export async function generateAfterMathNarration(
    state: CombatState,
    structuredLogs?: string
): Promise<string> {
    try {
        // Validate state has the required data
        if (!state.combatLog || state.round <= 0 || state.round > state.combatLog.length) {
            throw new Error(`Invalid combat state for aftermath: round ${state.round} not valid for combat log (length: ${state.combatLog?.length || 0})`);
        }
        
        const characters = state.characters;
        const currentRoundLog = state.combatLog[state.round - 1];
        
        // Check if we have a valid final round log
        if (!currentRoundLog) {
            throw new Error(`Missing combat log for final round ${state.round - 1}`);
        }
        
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
        
        // Track narration context for error reporting
        const narrationContext = {
            spiceLevel,
            length,
            model,
            finalRound: state.round - 1,
            eventsCount: (currentRoundLog.events || []).length,
            previousNarrationsCount: previousNarrations.length,
            isExplicit: spiceLevel === SpiceLevels.EXPLICIT,
            winner: state.winner ? state.winner.name : 'none'
        };
        
        try {
            const systemPrompt = formatSystemPrompt(
                PROMPTS.narrate,
                spiceLevel,
                length,
                formattedLogs,
                previousNarrations,
                TASKS.COMBAT_AFTERMATH, 
                null, // Room description
                characterInfo
            );
            
            // Log the prompt
            if (state.combatLog.length > 0) {
                state.combatLog[state.combatLog.length-1].prompts.push(systemPrompt);
            }
            
            // Special handling for explicit narrations
            if (spiceLevel === SpiceLevels.EXPLICIT) {
                try {
                    return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
                } catch (explicitError) {
                    // Log the explicit narration error
                    console.error(createNarrationErrorMessage(
                        'aftermath',
                        new Error(`Explicit aftermath narration failed: ${explicitError.message}`),
                        state,
                        narrationContext
                    ));
                    
                    // Fall back to suggestive narration
                    const fallbackSystemPrompt = formatSystemPrompt(
                        PROMPTS.narrate,
                        SpiceLevels.SUGGESTIVE, // Fallback to suggestive
                        length,
                        formattedLogs,
                        previousNarrations,
                        TASKS.COMBAT_AFTERMATH,
                        null,
                        characterInfo
                    );
                    
                    // Use the regular model for fallback
                    return await callLLM('narrate', [fallbackSystemPrompt], state.settings.llm, get_api_key(state.settings));
                }
            }
            
            return await callLLM('narrate', [systemPrompt], model, get_api_key(state.settings));
        } catch (error) {
            // Handle specific formatting errors
            if (error.message.includes('formatSystemPrompt')) {
                console.error(createNarrationErrorMessage(
                    'aftermath',
                    new Error(`Prompt formatting failed: ${error.message}`),
                    state,
                    narrationContext
                ));
            }
            
            // Re-throw for the outer catch block to handle
            throw error;
        }
    } catch (error) {
        // Get narration settings again for error context
        const { spiceLevel, length } = getNarrationSettings(state, false, state.round - 1);
        const model = getModelForNarration(spiceLevel, length, state.settings);
        
        console.error(createNarrationErrorMessage(
            'aftermath',
            error,
            state,
            { 
                spiceLevel, 
                length, 
                model, 
                finalRound: state.round - 1,
                winner: state.winner ? state.winner.name : 'none'
            }
        ));
        
        // Provide a more informative fallback message
        if (state.winner) {
            return `The combat has ended. ${state.winner.name} is victorious!`;
        }
        return `The combat has ended.`;
    }
}
