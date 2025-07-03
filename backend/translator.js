require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
console.log('OPENAI_ASSISTANT_ID exists:', !!OPENAI_ASSISTANT_ID);
console.log('OPENAI_API_KEY length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
console.log('OPENAI_ASSISTANT_ID:', OPENAI_ASSISTANT_ID);

// Cache for storing translations to avoid repeated API calls
const translationCache = new Map();

class Translator {
    constructor() {
        this.threadId = null;
        this.assistantId = OPENAI_ASSISTANT_ID;
    }

    async createThread() {
        console.log('Creating thread...');
        const response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        console.log('Thread creation response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Thread creation error response:', errorText);
            throw new Error(`Failed to create thread: ${response.statusText} - ${errorText}`);
        }

        const thread = await response.json();
        this.threadId = thread.id;
        console.log('Thread created with ID:', this.threadId);
        return this.threadId;
    }

    async addMessage(message) {
        if (!this.threadId) {
            await this.createThread();
        }

        const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: message
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to add message: ${response.statusText}`);
        }

        return await response.json();
    }

    async runAssistant() {
        if (!this.threadId) {
            throw new Error('No thread created');
        }

        const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: this.assistantId
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to run assistant: ${response.statusText}`);
        }

        return await response.json();
    }

    async waitForCompletion(runId) {
        let run;
        do {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to check run status: ${response.statusText}`);
            }

            run = await response.json();
        } while (run.status === 'in_progress' || run.status === 'queued');

        if (run.status === 'failed') {
            throw new Error('Assistant run failed');
        }

        return run;
    }

    async getMessages() {
        if (!this.threadId) {
            throw new Error('No thread created');
        }

        const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get messages: ${response.statusText}`);
        }

        return await response.json();
    }

    async translateToEstonian(text) {
        // Check cache first
        const cacheKey = text.toLowerCase().trim();
        if (translationCache.has(cacheKey)) {
            console.log('Translation found in cache');
            return translationCache.get(cacheKey);
        }

        try {
            // Simple translation request - the assistant has the expert instructions
            const prompt = `Translate: "${text}"`;

            // Add message to thread
            await this.addMessage(prompt);

            // Run assistant
            const run = await this.runAssistant();
            await this.waitForCompletion(run.id);

            // Get the response
            const messages = await this.getMessages();
            const assistantMessage = messages.data[0]; // Most recent message (assistant's response)
            
            let responseText = '';
            if (assistantMessage.content && assistantMessage.content.length > 0) {
                responseText = assistantMessage.content[0].text.value.trim();
            }

            console.log('Raw assistant response:', responseText);

            // Parse the JSON response
            let result;
            try {
                // Try to extract JSON from the response (in case there's extra text)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('Failed to parse assistant response as JSON:', responseText);
                console.error('Parse error:', parseError.message);
                
                // If we can't parse JSON, try to extract just the Estonian translation
                let cleanText = responseText;
                
                // Remove common prompt artifacts and English words
                const promptArtifacts = [
                    'Translate this English text to Estonian:',
                    'IMPORTANT: Respond ONLY with valid JSON',
                    'DO NOT include any other text',
                    'ONLY the JSON',
                    'Examples:',
                    'For "how are you"',
                    'For "hello"',
                    'For "I am going"',
                    'Only include words in rootWords',
                    'If no words are inflected, use empty object',
                    'Translate:',
                    'Translation:',
                    'English:',
                    'Estonian:',
                    'Response:',
                    'JSON:',
                    'Result:'
                ];
                
                for (const artifact of promptArtifacts) {
                    cleanText = cleanText.replace(new RegExp(artifact, 'gi'), '');
                }
                
                // Remove common English words that might be in the prompt
                const englishWords = [
                    'translate', 'translation', 'english', 'estonian', 'response', 'json', 'result',
                    'who', 'do', 'you', 'think', 'are', 'and', 'what', 'doing', 'actually', 'inflected',
                    'forms', 'that', 'would', 'need', 'to', 'be', 'looked', 'up', 'in', 'a', 'dictionary',
                    'if', 'word', 'is', 'already', 'its', 'base', 'form', "don't", 'include', 'it', 'rootWords'
                ];
                
                for (const word of englishWords) {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    cleanText = cleanText.replace(regex, '');
                }
                
                // Clean up extra whitespace, quotes, and punctuation
                cleanText = cleanText.trim()
                    .replace(/^["""]+|["""]+$/g, '')
                    .replace(/^[\[\]{}]+|[\[\]{}]+$/g, '')
                    .replace(/^[.,;:!?]+|[.,;:!?]+$/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // If we still have meaningful text, use it as translation
                if (cleanText && cleanText.length > 2 && !/^[a-zA-Z\s]*$/.test(cleanText)) {
                    result = {
                        translation: cleanText,
                        rootWords: {}
                    };
                } else {
                    // Fallback to original text
                    result = {
                        translation: text,
                        rootWords: {}
                    };
                }
            }

            // Validate the result
            if (!result.translation || typeof result.translation !== 'string') {
                console.error('Invalid translation result:', result);
                result = {
                    translation: text, // fallback to original
                    rootWords: {}
                };
            }

            // Cache the result
            translationCache.set(cacheKey, result);
            
            console.log(`Translation: "${text}" -> "${result.translation}"`);
            console.log(`Root words mapping:`, result.rootWords);
            return result;

        } catch (error) {
            console.error('Translation error:', error);
            // Return fallback
            return {
                translation: text,
                rootWords: {}
            };
        }
    }

    // Method to clear cache if needed
    clearCache() {
        translationCache.clear();
        console.log('Translation cache cleared');
    }

    // Method to get cache size
    getCacheSize() {
        return translationCache.size;
    }
}

// Export the translator class
module.exports = Translator;

// Example usage
async function testTranslation() {
    const translator = new Translator();
    
    try {
        const testTexts = [
            "Hello, how are you?",
            "The cat is sleeping",
            "I love learning languages"
        ];

        for (const text of testTexts) {
            const translation = await translator.translateToEstonian(text);
            console.log(`"${text}" -> "${translation}"`);
        }

        console.log(`Cache size: ${translator.getCacheSize()}`);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testTranslation();
} 