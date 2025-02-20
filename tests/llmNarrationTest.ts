import { config } from 'dotenv';
import { callLLM, Message } from '../src/llm.js';

// Load environment variables
config();

// Example usage
async function testNarration() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not found in environment variables');
    }
    
    // Example chat history
    const messages: Message[] = [
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

    try {
        console.log('Sending request to OpenRouter API...');
        const narration = await callLLM('narrate', messages, apiKey);
        console.log('\nNarration:', narration);
    } catch (error) {
        console.error('Error:', error);
    }
}

testNarration();
