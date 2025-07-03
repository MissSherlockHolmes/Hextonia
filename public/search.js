// Search component for header
function createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Find phrase...';
    searchBox.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        width: 700px;
        outline: none;
    `;
    
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Search';
    searchButton.style.cssText = `
        padding: 8px 16px;
        background-color: black;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    // Add loading state
    const loadingSpinner = document.createElement('div');
    loadingSpinner.style.cssText = `
        display: none;
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    `;
    
    // Add CSS for spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Add hover effect to button
    searchButton.addEventListener('mouseenter', () => {
        searchButton.style.backgroundColor = '#333';
    });
    
    searchButton.addEventListener('mouseleave', () => {
        searchButton.style.backgroundColor = 'black';
    });
    
    // Add search functionality
    searchButton.addEventListener('click', async () => {
        const searchTerm = searchBox.value.trim();
        if (searchTerm) {
            // Show loading state
            searchButton.disabled = true;
            searchButton.textContent = '';
            loadingSpinner.style.display = 'block';
            searchButton.appendChild(loadingSpinner);
            
            try {
                console.log('Searching for:', searchTerm);
                
                const response = await fetch('http://localhost:5000/api/process-phrase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phrase: searchTerm })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                console.log('Workflow result:', result);
                
                // Display results
                displayResults(result);
                
            } catch (error) {
                console.error('Search error:', error);
                alert('Error processing phrase: ' + error.message);
            } finally {
                // Reset button state
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
                loadingSpinner.style.display = 'none';
            }
        }
    });
    
    // Allow Enter key to trigger search
    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
    
    searchContainer.appendChild(searchBox);
    searchContainer.appendChild(searchButton);
    
    return searchContainer;
}

// Function to display results
function displayResults(result) {
    // Remove any existing results
    const existingResults = document.getElementById('search-results');
    if (existingResults) {
        existingResults.remove();
    }
    
    const existingTab = document.getElementById('results-tab');
    if (existingTab) {
        existingTab.remove();
    }
    
    // Create the hidden tab
    const resultsTab = document.createElement('div');
    resultsTab.id = 'results-tab';
    resultsTab.style.cssText = `
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        background: #007bff;
        color: white;
        padding: 15px 10px;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: -2px 0 8px rgba(0,0,0,0.1);
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 14px;
        font-weight: bold;
    `;
    resultsTab.innerHTML = 'Results';
    document.body.appendChild(resultsTab);
    
    // Create the results container (initially hidden)
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    resultsContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: -420px;
        width: 400px;
        max-height: 600px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px 0 0 8px;
        padding: 20px;
        box-shadow: -4px 0 8px rgba(0,0,0,0.1);
        overflow-y: auto;
        z-index: 1001;
        transition: right 0.3s ease;
    `;
    document.body.appendChild(resultsContainer);
    
    // Create results HTML with hidden answers
    const resultsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #333;">Translation Results</h3>
            <button onclick="hideResults()" 
                    style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                ✕
            </button>
        </div>
        <div style="margin-bottom: 15px;">
            <strong>Original:</strong> ${result.originalPhrase}<br>
            <strong>Estonian:</strong> ${result.estonianPhrase}
        </div>
        <h4 style="margin-bottom: 10px; color: #555;">Word Forms:</h4>
        ${result.words.map((word, index) => `
            <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                <strong>${word.originalWord}</strong><br>
                <div id="answer-${index}" style="display: none; margin-top: 5px;">
                    <small style="color: #666;">Correct: ${word.correctForm}</small><br>
                    ${word.options.length > 1 ? 
                        `<small style="color: #666;">Options: ${word.options.join(', ')}</small>` : 
                        ''
                    }
                </div>
                <button onclick="toggleAnswer(${index})" 
                        id="toggle-${index}"
                        style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 5px;">
                    Show Answer
                </button>
            </div>
        `).join('')}
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Add click handler to show results
    resultsTab.addEventListener('click', () => {
        resultsContainer.style.right = '0px';
        resultsTab.style.display = 'none';
    });
    
    // Trigger hex cards with search results
    document.dispatchEvent(new CustomEvent('searchResultsReady', {
        detail: result
    }));
}

// Function to hide results
function hideResults() {
    const resultsContainer = document.getElementById('search-results');
    const resultsTab = document.getElementById('results-tab');
    
    if (resultsContainer) {
        resultsContainer.style.right = '-420px';
        setTimeout(() => {
            if (resultsContainer) resultsContainer.remove();
        }, 300);
    }
    
    if (resultsTab) {
        resultsTab.style.display = 'block';
    }
}

// Function to toggle answer visibility
function toggleAnswer(index) {
    const answerDiv = document.getElementById(`answer-${index}`);
    const toggleButton = document.getElementById(`toggle-${index}`);
    
    if (answerDiv.style.display === 'none') {
        answerDiv.style.display = 'block';
        toggleButton.textContent = 'Hide Answer';
        toggleButton.style.background = '#6c757d';
    } else {
        answerDiv.style.display = 'none';
        toggleButton.textContent = 'Show Answer';
        toggleButton.style.background = '#007bff';
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the header to be created
    setTimeout(() => {
        const header = document.getElementById('header');
        if (header) {
            const searchBox = createSearchBox();
            header.appendChild(searchBox);
        }
    }, 100);
}); 