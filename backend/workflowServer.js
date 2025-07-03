require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const Translator = require('./translator');
const { getAllFormsForWords, getSynonymsForWord } = require('./ekilex');
const { selectForms } = require('./formSelector');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main workflow endpoint
app.post('/api/process-phrase', async (req, res) => {
    try {
        const { phrase } = req.body;
        
        if (!phrase || typeof phrase !== 'string') {
            return res.status(400).json({ error: 'Phrase is required' });
        }

        console.log('Processing phrase:', phrase);

        // Step 1: Translate to Estonian with timeout
        let translationResult;
        try {
            const translator = new Translator();
            const translationPromise = translator.translateToEstonian(phrase);
            
            // Add 30 second timeout for translation
            translationResult = await Promise.race([
                translationPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation timeout')), 30000)
                )
            ]);
            
            console.log('Translation result:', translationResult);
        } catch (translationError) {
            console.error('Translation failed:', translationError.message);
            // If translation fails, use the original phrase as fallback
            translationResult = {
                translation: phrase,
                rootWords: {}
            };
            console.log('Using original phrase as fallback:', translationResult);
        }

        // Extract the Estonian phrase and root words mapping
        const estonianPhrase = translationResult.translation || translationResult;
        const rootWords = translationResult.rootWords || {};
        
        console.log('Translated to Estonian:', estonianPhrase);
        console.log('Root words mapping:', rootWords);

        // Step 2: Extract words from the Estonian phrase (clean word splitting)
        console.log('Raw estonian phrase before processing:', JSON.stringify(estonianPhrase));
        const words = estonianPhrase
            .replace(/["""]/g, '') // Remove quotes
            .replace(/[.,!?;:]/g, '') // Remove punctuation
            .split(/\s+/)
            .map(word => word.trim()) // Trim whitespace
            .map(word => word.replace(/^["""]+|["""]+$/g, '')) // Remove quotes from start/end
            .map(word => word.replace(/[.,!?;:]+/g, '')) // Remove any remaining punctuation
            .filter(word => word.length > 0);
        console.log('Extracted words:', words);
        console.log('Word extraction debug - after each step:');
        console.log('After quote removal:', estonianPhrase.replace(/["""]/g, ''));
        console.log('After punctuation removal:', estonianPhrase.replace(/["""]/g, '').replace(/[.,!?;:]/g, ''));
        console.log('After split:', estonianPhrase.replace(/["""]/g, '').replace(/[.,!?;:]/g, '').split(/\s+/));

        // Step 3: Get forms for each word from Ekilex, using root words when available
        const searchWords = words.map(word => rootWords[word] || word);
        console.log('Words to search in Ekilex (using root words when available):', searchWords);
        const formsData = await getAllFormsForWords(searchWords);
        console.log('Forms data:', formsData);

        // Step 4: For each word, select the correct form and two random forms
        const results = [];
        for (let i = 0; i < words.length; i++) {
            const originalWord = words[i];
            const searchWord = searchWords[i];
            let forms = formsData[searchWord] || [];
            
            // Filter out invalid forms (dashes, empty strings, etc.) and normalize to lowercase
            forms = forms.filter(form => {
                return form && 
                       form.trim() !== '' && 
                       form.trim() !== '-' && 
                       form.trim() !== '—' && 
                       form.trim() !== '–' &&
                       form.length > 1; // Ensure form has at least 2 characters
            }).map(form => form.toLowerCase()); // Normalize all forms to lowercase
            
            console.log(`Processing word "${originalWord}" (search: "${searchWord}") with ${forms.length} valid forms:`, forms);
            
            if (forms.length >= 3) {
                console.log(`Word "${originalWord}" has enough valid forms, using selectForms`);
                const selection = selectForms(forms, originalWord);
                
                // Final check to ensure no duplicates in options
                const uniqueOptions = [...new Set(selection.options)];
                if (uniqueOptions.length < 3) {
                    console.log(`Warning: Not enough unique options for "${originalWord}", using dummy options`);
                    // If we don't have enough unique options, use dummy logic
                    const dummyOptions = createDummyOptions(originalWord);
                    const allOptions = new Set([originalWord, ...uniqueOptions, ...dummyOptions]);
                    const finalOptions = Array.from(allOptions).slice(0, 3);
                    results.push({
                        originalWord: originalWord,
                        correctForm: originalWord.toLowerCase(),
                        options: finalOptions
                    });
                } else {
                    results.push({
                        originalWord: originalWord,
                        correctForm: originalWord.toLowerCase(), // Keep the original inflected form as correct answer in lowercase
                        options: uniqueOptions.slice(0, 3)
                    });
                }
            } else {
                // Try to get synonyms from Ekilex using the root word
                let synonyms = [];
                try {
                    synonyms = await getSynonymsForWord(searchWord);
                } catch (e) {
                    console.error(`Error fetching synonyms for ${searchWord}:`, e);
                }
                // Filter out the word itself, duplicates, and invalid forms, and normalize to lowercase
                synonyms = synonyms.filter(syn => {
                    return syn && 
                           syn !== originalWord && 
                           !forms.includes(syn) &&
                           syn.trim() !== '' && 
                           syn.trim() !== '-' && 
                           syn.trim() !== '—' && 
                           syn.trim() !== '–' &&
                           syn.length > 1;
                }).map(syn => syn.toLowerCase()); // Normalize synonyms to lowercase
                // Use available forms + synonyms (if any)
                let options = new Set([...forms]); // Use Set to prevent duplicates
                options.add(originalWord.toLowerCase()); // Add original word in lowercase
                for (const syn of synonyms) {
                    if (options.size < 3) {
                        options.add(syn);
                    }
                }
                // If we still don't have 3, fallback to dummy logic
                if (options.size < 3) {
                    console.log(`Not enough synonyms found for "${originalWord}", using dummy logic for remaining options`);
                    const dummyOptions = createDummyOptions(originalWord);
                    for (const dummy of dummyOptions) {
                        if (options.size < 3 && !options.has(dummy)) {
                            options.add(dummy);
                        }
                    }
                }
                // Ensure we have exactly 3 unique options
                const uniqueOptions = Array.from(options);
                const shuffled = uniqueOptions.sort(() => Math.random() - 0.5).slice(0, 3);
                console.log(`Created options for "${originalWord}":`, shuffled);
                results.push({
                    originalWord: originalWord,
                    correctForm: originalWord.toLowerCase(), // Keep the original inflected form as correct answer in lowercase
                    options: shuffled
                });
            }
        }

        res.json({
            originalPhrase: phrase,
            estonianPhrase: estonianPhrase,
            words: results
        });

    } catch (error) {
        console.error('Workflow error:', error);
        res.status(500).json({ 
            error: 'Failed to process phrase',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Helper method to create realistic dummy options for Estonian words
function createDummyOptions(word) {
    const options = new Set(); // Use Set to automatically prevent duplicates
    // Don't add the original word here since it's already added by the workflow server
    
    // Common Estonian suffixes and variations
    const suffixes = ['a', 'e', 'i', 'u', 'd', 't', 'n', 's'];
    const variations = [];
    
    // Add some common Estonian word variations
    if (word.endsWith('a')) {
        variations.push(word.slice(0, -1) + 'e'); // a -> e
        variations.push(word.slice(0, -1) + 'i'); // a -> i
    } else if (word.endsWith('e')) {
        variations.push(word.slice(0, -1) + 'a'); // e -> a
        variations.push(word.slice(0, -1) + 'i'); // e -> i
    } else if (word.endsWith('i')) {
        variations.push(word.slice(0, -1) + 'a'); // i -> a
        variations.push(word.slice(0, -1) + 'e'); // i -> e
    } else {
        // Add common suffixes
        variations.push(word + 'a');
        variations.push(word + 'e');
        variations.push(word + 'i');
    }
    
    // Shuffle and pick unique variations
    const shuffled = variations.sort(() => Math.random() - 0.5);
    for (const variation of shuffled) {
        if (options.size < 3) {
            options.add(variation);
        }
    }
    
    // If we still don't have 3 options, add some more variations
    while (options.size < 3) {
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const newOption = word + randomSuffix;
        options.add(newOption);
    }
    
    return Array.from(options).map(option => option.toLowerCase());
}

app.listen(PORT, () => {
    console.log(`Workflow server listening on port ${PORT}`);
}); 