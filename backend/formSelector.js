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
    
    // Remove duplicates and invalid forms from forms array
    const validForms = forms.filter(form => {
        // Filter out dashes, empty strings, and other invalid forms
        return form && 
               form.trim() !== '' && 
               form.trim() !== '-' && 
               form.trim() !== '—' && 
               form.trim() !== '–' &&
               form.length > 1; // Ensure form has at least 2 characters
    });
    const uniqueForms = [...new Set(validForms)];
    
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
    // Pick two random forms, ensuring they're different from each other and the correct form
    const randomForms = [];
    for (const form of pool) {
        if (randomForms.length < 2 && form !== correctForm && !randomForms.includes(form)) {
            randomForms.push(form);
        }
    }
    
    // Combine with the correct form and ensure uniqueness
    const options = [correctForm];
    for (const form of randomForms) {
        if (!options.includes(form)) {
            options.push(form);
        }
    }
    
    // If we don't have 3 unique options, pick more from the pool
    while (options.length < 3 && pool.length > 0) {
        for (const form of pool) {
            if (options.length >= 3) break;
            if (!options.includes(form)) {
                options.push(form);
            }
        }
        break; // Prevent infinite loop
    }
    
    // Final shuffle
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return {
        correct: correctForm,
        options: options.slice(0, 3) // Ensure exactly 3 options
    };
}

module.exports = { selectForms }; 