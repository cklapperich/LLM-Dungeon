// Define literal types for our enum-like values
export type SpiceLevel = 'NONE' | 'SUGGESTIVE' | 'EXPLICIT';
export type Length = 'SHORT' | 'MEDIUM' | 'LONG' | 'MEATY';

// Constants for spice levels
export const SpiceLevels = {
    NONE: 'NONE' as SpiceLevel,
    SUGGESTIVE: 'SUGGESTIVE' as SpiceLevel,
    EXPLICIT: 'EXPLICIT' as SpiceLevel
};

// Constants for lengths
export const Lengths = {
    SHORT: 'SHORT' as Length,
    MEDIUM: 'MEDIUM' as Length,
    LONG: 'LONG' as Length,
    MEATY: 'MEATY' as Length
};

// Define the structure of prompts.json
export interface PromptsData {
    lengths: Record<Length, string>;
    spiceLevels: Record<SpiceLevel, string>;
    tasks: {
        INITIAL_COMBAT: string;
        CONTINUE_COMBAT: string;
        COMBAT_AFTERMATH: string;
        ANNOTATE_COMBAT: string;
    };
    game_context: string;
    prompts: {
        narrate: string;
        jailbreak: string;
    };
}
