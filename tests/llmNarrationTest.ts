import { callLLM, narrationHelpers } from '../src/game_engine/llm.ts';
import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { createDefaultTestCharacters, createTestCombatState, createTestGameState } from '../src/testing/stateGenerators.ts';
import { PROMPTS } from '../src/game_engine/prompts.ts';

describe('LLM Narration', () => {
    // Get properly initialized test characters and state
    const { player: clara, monster: slime } = createDefaultTestCharacters();
    const gameState = createTestGameState({
        characters: {
            [clara.name]: clara,
            [slime.name]: slime
        }
    });
    const state = createTestCombatState({ characters: [clara, slime] });
    const roomDescription = gameState.dungeon.rooms[parseInt(state.roomId)].description;

    // Previous round narrations
    const previousNarrations = [
        'The dungeon air is thick with moisture, your torch casting dancing shadows on the moss-covered walls. A sound catches your attention - the unmistakable squelch of a slime creature lurking nearby.',
        'The gelatinous mass surges forward with surprising speed, its acidic body slamming into Clara! The impact knocks her back against the wall, her armor now coated in corrosive slime.'
    ];

    // Current round combat logs
    const currentRoundLogs = [
        `${slime.name} appears! Initiative roll: ${slime.name} acts first`,
        `${clara.name} takes 25 damage and gains status: slimed`,
        `${clara.name} attacks with Stab. Deals WOUND to ${slime.name}.`
    ];

    test('generates initial combat narration', async () => {
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, true);
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            clara,
            slime,
            spiceLevel,
            length,
            currentRoundLogs,
            [],
            TASKS.INITIAL_COMBAT,
            roomDescription
        );

        const expectedNarration = 'With fierce determination, Clara grips her rapier tightly and executes a skillful thrust at the gelatinous creature. The blade pierces through the slime\'s membrane, leaving a deep wound in its amorphous form.';

        // Mock the LLM call
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    choices: [{ message: { content: expectedNarration } }] 
                })
            } as Response)
        );

        const narration = await callLLM('narrate', [systemPrompt]);
        expect(narration).toBe(expectedNarration);
    });

    test('generates regular round narration with NONE/SHORT for normal actions', async () => {
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, false);
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            clara,
            slime,
            spiceLevel,
            length,
            currentRoundLogs,
            previousNarrations,
            TASKS.CONTINUE_COMBAT,
            roomDescription
        );

        const expectedNarration = 'With fierce determination, Clara grips her rapier tightly and executes a skillful thrust at the gelatinous creature. The blade pierces through the slime\'s membrane, leaving a deep wound in its amorphous form.';

        // Mock the LLM call
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    choices: [{ message: { content: expectedNarration } }] 
                })
            } as Response)
        );

        const narration = await callLLM('narrate', [systemPrompt]);
        expect(narration).toBe(expectedNarration);
    });

    test('generates round narration with SUGGESTIVE/MEDIUM for grapple actions', async () => {
        // Create a state with grapple action
        const grappleState = createTestCombatState({ 
            characters: [clara, slime],
            combatLog: [{
                round: 1,
                combatLogs: [
                    `${slime.name} used Grapple on ${clara.name}`,
                    `${clara.name} is now grappled!`
                ],
                narrations: []
            }]
        });

        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(grappleState, false);
        expect(spiceLevel).toBe('SUGGESTIVE');
        expect(length).toBe('A meaty paragraph, 4-6 sentences.');

        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            clara,
            slime,
            spiceLevel,
            length,
            grappleState.combatLog[0].combatLogs,
            [],
            TASKS.CONTINUE_COMBAT,
            roomDescription
        );

        const expectedNarration = 'The gelatinous creature surges forward, its amorphous form wrapping around Clara with surprising strength. She finds herself entangled in its grip, the slime\'s surface pulsing with an unsettling warmth.';

        // Mock the LLM call
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    choices: [{ message: { content: expectedNarration } }] 
                })
            } as Response)
        );

        const narration = await callLLM('narrate', [systemPrompt]);
        expect(narration).toBe(expectedNarration);
    });

    test('handles API error', async () => {
        const { spiceLevel, length } = narrationHelpers.getNarrationSettings(state, false);
        const systemPrompt = narrationHelpers.formatSystemPrompt(
            PROMPTS.narrate.system,
            clara,
            slime,
            spiceLevel,
            length,
            currentRoundLogs,
            previousNarrations,
            TASKS.CONTINUE_COMBAT,
            roomDescription
        );

        // Mock a failed API call
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: 'Internal Server Error' })
            } as Response)
        );

        await expect(callLLM('narrate', [systemPrompt]))
            .rejects
            .toThrow('OpenRouter API error: Internal Server Error');
    });
});
