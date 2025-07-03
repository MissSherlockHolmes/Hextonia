/**
 * Selects the correct form and two random forms from a list.
 * @param {string[]} forms - Array of word forms.
 * @param {string} correctForm - The correct form to always include.
 * @returns {{ correct: string, options: string[] }}
 */
function selectForms(forms, correctForm) {
    if (!Array.isArray(forms) || forms.length === 0) {
        throw new Error('At least 1 form is required');
    }
    
    // Remove duplicates from forms array
    const uniqueForms = [...new Set(forms)];
    
    // If we have less than 3 unique forms, we need to work with what we have
    if (uniqueForms.length < 3) {
        // Use all available unique forms plus the correct form if not already included
        let availableForms = [...uniqueForms];
        if (!availableForms.includes(correctForm)) {
            availableForms.push(correctForm);
        }
        
        // If we still don't have 3, we'll need to create dummy options
        // This will be handled by the workflow server's createDummyOptions function
        // For now, just return what we have (the workflow server will handle the rest)
        const shuffled = availableForms.sort(() => Math.random() - 0.5);
        return {
            correct: correctForm,
            options: shuffled
        };
    }
    
    // Original logic for 3+ forms
    // Remove the correct form from the pool
    const pool = uniqueForms.filter(f => f !== correctForm);
    // Shuffle the pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Pick two random forms
    const randomForms = pool.slice(0, 2);
    // Combine with the correct form and shuffle again
    const options = [correctForm, ...randomForms];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return {
        correct: correctForm,
        options
    };
}

module.exports = { selectForms }; 