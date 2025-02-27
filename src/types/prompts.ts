// Define literal types for our enum-like values
export type SpiceLevel = 'NONE' | 'SUGGESTIVE' | 'EXPLICIT';
export type Length = 'SHORT' | 'MEDIUM' | 'LONG' | 'MEATY';

// Define the structure of prompts.json
export interface PromptsData {
    lengths: Record<Length, string>;
    spiceLevels: Record<SpiceLevel, string>;
    tasks: {
        INITIAL_COMBAT: string;
        CONTINUE_COMBAT: string;
        COMBAT_AFTERMATH: string;
    };
    prompts: {
        narrate: {
            system: string;
            task: string;
        };
    };
}
