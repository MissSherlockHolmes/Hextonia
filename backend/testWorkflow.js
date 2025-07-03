require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getAllFormsForWords } = require('./ekilex');
const { selectForms } = require('./formSelector');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Test workflow endpoint (skips translation)
app.post('/api/test-workflow', async (req, res) => {
    try {
        const { phrase } = req.body;
        
        if (!phrase || typeof phrase !== 'string') {
            return res.status(400).json({ error: 'Phrase is required' });
        }

        console.log('Testing workflow with phrase:', phrase);

        // Skip translation, use the phrase directly as Estonian words
        const estonianPhrase = phrase;
        console.log('Using phrase as Estonian:', estonianPhrase);

        // Extract words from the phrase
        const words = estonianPhrase.split(/\s+/).filter(word => word.length > 0);
        console.log('Extracted words:', words);

        // Get forms for each word from Ekilex
        const formsData = await getAllFormsForWords(words);
        console.log('Forms data:', formsData);

        // For each word, select the correct form and two random forms
        const results = [];
        for (const word of words) {
            const forms = formsData[word] || [];
            if (forms.length >= 3) {
                const selection = selectForms(forms, word);
                results.push({
                    originalWord: word,
                    correctForm: selection.correct,
                    options: selection.options
                });
            } else {
                // If not enough forms, just include the word as is
                results.push({
                    originalWord: word,
                    correctForm: word,
                    options: [word]
                });
            }
        }

        res.json({
            originalPhrase: phrase,
            estonianPhrase: estonianPhrase,
            words: results
        });

    } catch (error) {
        console.error('Test workflow error:', error);
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

app.listen(PORT, () => {
    console.log(`Test workflow server listening on port ${PORT}`);
}); 