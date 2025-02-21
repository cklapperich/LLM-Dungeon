import { config } from 'dotenv';
import { callLLM, Message } from '../src/llm.js';
import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';

// Load environment variables
config();

describe('LLM Narration', () => {
    const mockApiKey = 'test-api-key';
    const mockMessages: Message[] = [
        {
            role: 'assistant',
            content: 'The dungeon air is thick with moisture, your torch casting dancing shadows on the moss-covered walls. A sound catches your attention - the unmistakable squelch of a slime creature lurking nearby.'
        },
        {
            role: 'system',
            content: 'Slime appears! Initiative roll: Slime acts first'
        },
        {
            role: 'assistant',
            content: 'The gelatinous mass surges forward with surprising speed, its acidic body slamming into Chloe! The impact knocks her back against the wall, her armor now coated in corrosive slime.'
        },
        {
            role: 'system',
            content: 'Chloe takes 25 damage and gains status: slimed'
        },
        {
            role: 'user',
            content: 'Chloe attacks with Short Sword. Deals WOUND to slime.'
        }
    ];

    const expectedNarration = 'With fierce determination, Chloe grips her short sword tightly and strikes at the gelatinous creature. The blade slices through the slime\'s membrane, leaving a deep wound in its amorphous form.';

    beforeAll(() => {
        // Mock process.env
        process.env.OPENROUTER_API_KEY = mockApiKey;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('successfully generates narration', async () => {
        // Mock the LLM call with proper json method
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    choices: [{ message: { content: expectedNarration } }] 
                })
            } as Response)
        );

        const narration = await callLLM('narrate', mockMessages, mockApiKey);
        expect(narration).toBe(expectedNarration);
    });

    test('handles API error', async () => {
        // Mock a failed API call with proper json method
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: 'Internal Server Error' })
            } as Response)
        );

        await expect(callLLM('narrate', mockMessages, mockApiKey))
            .rejects
            .toThrow('OpenRouter API error: Internal Server Error');
    });

    test('handles missing API key', async () => {
        // Mock a failed API call with proper json method
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: 'Unknown error' })
            } as Response)
        );

        await expect(callLLM('narrate', mockMessages, ''))
            .rejects
            .toThrow('OpenRouter API error: Unknown error');
    });

    test('handles invalid response format', async () => {
        // Mock an invalid response format that will cause TypeError
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ choices: [] })
            } as Response)
        );

        await expect(callLLM('narrate', mockMessages, mockApiKey))
            .rejects
            .toThrow("Cannot read properties of undefined (reading 'message')");
    });
});
