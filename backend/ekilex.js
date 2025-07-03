require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fetch = require('node-fetch');

const EKILEX_API_KEY = process.env.EKILEX_API_KEY;
const BASE_URL = 'https://ekilex.ee/api';
const DATASET = 'eki';

// Debug: Check if Ekilex API key is loaded
console.log('Ekilex API key check:');
console.log('EKILEX_API_KEY exists:', !!EKILEX_API_KEY);
console.log('EKILEX_API_KEY length:', EKILEX_API_KEY ? EKILEX_API_KEY.length : 0);
console.log('EKILEX_API_KEY first 10 chars:', EKILEX_API_KEY ? EKILEX_API_KEY.substring(0, 10) + '...' : 'undefined');

async function getAllFormsForWords(words) {
  if (!Array.isArray(words)) words = [words];
  const results = {};
  for (const word of words) {
    try {
      // Get all forms for this word, trying multiple variations
      const forms = await getFormsForWord(word);
      results[word] = forms;
    } catch (error) {
      console.error(`Error processing word ${word}:`, error);
      results[word] = [];
    }
  }
  return results;
}

async function getFormsForWord(word) {
  const forms = [];
  
  // Define word variations to try
  const variations = [word];
  
  console.log(`Processing word: "${word}"`);
  
  // Add common Estonian word variations
  if (word === 'läheb') {
    variations.push('minema', 'lähen', 'lähed', 'läheme', 'lähete', 'lähevad');
    console.log(`Added variations for läheb:`, variations);
  } else if (word === 'sul') {
    variations.push('sina', 'sinu', 'sulle', 'sult');
    console.log(`Added variations for sul:`, variations);
  } else if (word === 'kuidas') {
    variations.push('kuidas', 'kui', 'kust');
    console.log(`Added variations for kuidas:`, variations);
  } else {
    console.log(`No specific variations for "${word}", using only:`, variations);
  }
  
  // Try each variation
  for (const variation of variations) {
    try {
      const searchUrl = `${BASE_URL}/word/search/${encodeURIComponent(variation)}/${DATASET}`;
      console.log(`Searching for word variation: ${variation} at ${searchUrl}`);
      
      const searchRes = await fetch(searchUrl, {
        headers: { 'ekilex-api-key': EKILEX_API_KEY }
      });
      
      if (!searchRes.ok) {
        console.error(`Search failed for ${variation}: ${searchRes.status} ${searchRes.statusText}`);
        continue;
      }
      
      const searchData = await searchRes.json();
      console.log(`Search response for ${variation}:`, searchData);
      
      if (!searchData.words || !searchData.words.length) {
        console.log(`No words found for ${variation}`);
        continue;
      }
      
      // For each found word, fetch all forms
      for (const wordObj of searchData.words) {
        const paradigmUrl = `${BASE_URL}/paradigm/details/${wordObj.wordId}`;
        console.log(`Fetching paradigm for wordId ${wordObj.wordId}`);
        
        const paradigmRes = await fetch(paradigmUrl, {
          headers: { 'ekilex-api-key': EKILEX_API_KEY }
        });
        
        if (!paradigmRes.ok) {
          console.error(`Paradigm fetch failed for wordId ${wordObj.wordId}: ${paradigmRes.status} ${paradigmRes.statusText}`);
          continue;
        }
        
        const paradigmData = await paradigmRes.json();
        console.log(`Paradigm data for wordId ${wordObj.wordId}:`, JSON.stringify(paradigmData, null, 2));
        
        if (paradigmData && paradigmData.length) {
          paradigmData.forEach(paradigmObj => {
            if (paradigmObj.paradigmForms && Array.isArray(paradigmObj.paradigmForms)) {
              paradigmObj.paradigmForms.forEach(form => {
                if (form.value && !forms.includes(form.value)) {
                  forms.push(form.value);
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error processing variation ${variation}:`, error);
      continue;
    }
  }
  
  return forms;
}

// Fetch synonyms for a word from Ekilex
async function getSynonymsForWord(word) {
  const synonyms = new Set();
  try {
    // Search for the word to get wordId(s)
    const searchUrl = `${BASE_URL}/word/search/${encodeURIComponent(word)}/${DATASET}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'ekilex-api-key': EKILEX_API_KEY }
    });
    if (!searchRes.ok) {
      console.error(`Search failed for ${word}: ${searchRes.status} ${searchRes.statusText}`);
      return [];
    }
    const searchData = await searchRes.json();
    if (!searchData.words || !searchData.words.length) {
      return [];
    }
    // For each found word, fetch details and extract synonyms
    for (const wordObj of searchData.words) {
      const detailsUrl = `${BASE_URL}/word/details/${wordObj.wordId}`;
      const detailsRes = await fetch(detailsUrl, {
        headers: { 'ekilex-api-key': EKILEX_API_KEY }
      });
      if (!detailsRes.ok) {
        console.error(`Details fetch failed for wordId ${wordObj.wordId}: ${detailsRes.status} ${detailsRes.statusText}`);
        continue;
      }
      const detailsData = await detailsRes.json();
      // Synonyms may be in lexemes -> meanings -> synonyms
      if (detailsData.lexemes && Array.isArray(detailsData.lexemes)) {
        for (const lexeme of detailsData.lexemes) {
          if (lexeme.meanings && Array.isArray(lexeme.meanings)) {
            for (const meaning of lexeme.meanings) {
              if (meaning.synonyms && Array.isArray(meaning.synonyms)) {
                for (const syn of meaning.synonyms) {
                  if (typeof syn.word === 'string') {
                    synonyms.add(syn.word);
                  } else if (typeof syn === 'string') {
                    synonyms.add(syn);
                  }
                }
              }
            }
          }
        }
      }
    }
    return Array.from(synonyms);
  } catch (error) {
    console.error(`Error fetching synonyms for ${word}:`, error);
    return [];
  }
}

// Export the functions
module.exports = { getAllFormsForWords, getSynonymsForWord }; 