// Hex Cards Manager
class HexCardsManager {
    constructor() {
        this.currentWordIndex = 0;
        this.currentWordData = null;
        this.searchResults = null;
        this.placementController = new PlacementController();
        this.init();
    }

    init() {
        // Listen for search results
        this.setupSearchListener();
    }

    setupSearchListener() {
        // Listen for custom event when search results are available
        document.addEventListener('searchResultsReady', (event) => {
            this.loadWordOptions(event.detail);
        });
    }

    loadWordOptions(searchResults) {
        if (!searchResults || !searchResults.words || searchResults.words.length === 0) {
            this.showNoResults();
            return;
        }

        this.searchResults = searchResults;
        this.currentWordIndex = 0;
        
        // Clear the grid only when starting a new phrase
        this.clearGrid();
        
        this.loadNextWord();
    }

    loadNextWord() {
        console.log(`Loading next word: index ${this.currentWordIndex}, total words: ${this.searchResults.words.length}`);
        
        if (this.currentWordIndex >= this.searchResults.words.length) {
            console.log('All words completed! Showing completion message.');
            this.showAllComplete();
            return;
        }

        // Don't clear the grid - keep correct answers in place
        // Only update the sidebar cards for the next word
        
        this.currentWordData = this.searchResults.words[this.currentWordIndex];
        console.log(`Current word data:`, this.currentWordData);
        this.displayCards();
        
        // Clear position highlights when loading new word
        this.clearPositionHighlights();
    }

    displayCards() {
        // Use the options array directly (it already includes the correct form)
        const options = [...this.currentWordData.options];
        const shuffledOptions = this.shuffleArray([...options]);

        // Update all three boxes with randomized word options
        for (let i = 0; i < Math.min(3, shuffledOptions.length); i++) {
            const boxIndex = i + 1; // Box 1, 2, and 3
            const box = document.querySelector(`.box:nth-child(${boxIndex})`);
            if (box) {
                let hexagon = box.querySelector('.hexagon');
                
                // If hexagon doesn't exist (was dragged away), create a new one
                if (!hexagon) {
                    hexagon = document.createElement('div');
                    hexagon.className = 'hexagon';
                    hexagon.id = `hexagon-${boxIndex - 1}`;
                    hexagon.style.left = '50%';
                    hexagon.style.top = '50%';
                    hexagon.style.transform = 'translate(-50%, -50%)';
                    hexagon.dataset.originBoxId = box.id || `box-${boxIndex - 1}`;
                    if (!box.id) box.id = `box-${boxIndex - 1}`;
                    box.appendChild(hexagon);
                }
                
                // Update the hexagon content with the word option
                hexagon.innerHTML = `
                    <div style="text-align: center; padding: 10px; display: flex; align-items: center; justify-content: center; height: 100%;">
                        <span style="font-size: 16px; font-weight: bold;">${shuffledOptions[i]}</span>
                    </div>
                `;
                
                // Store the data for drag and drop
                hexagon.dataset.text = shuffledOptions[i];
                hexagon.dataset.isCorrect = shuffledOptions[i] === this.currentWordData.correctForm;
                hexagon.dataset.originalWord = this.currentWordData.originalWord;
                
                // Apply gradient styling
                hexagon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                hexagon.style.color = 'white';
                hexagon.style.fontSize = '14px';
                hexagon.style.fontWeight = 'bold';
                hexagon.style.padding = '10px';
                hexagon.style.wordWrap = 'break-word';
                hexagon.style.boxSizing = 'border-box';
                hexagon.style.display = 'flex';
                hexagon.style.alignItems = 'center';
                hexagon.style.justifyContent = 'center';
                hexagon.style.textAlign = 'center';
                hexagon.style.cursor = 'move';
                
                // Ensure the hexagon remains draggable
                if (typeof makeDraggable === 'function') {
                    makeDraggable(hexagon, box);
                }
            }
        }
    }

    clearGrid() {
        // Remove all hexagons from grid cells
        const gridCells = document.querySelectorAll('.hex-cell');
        gridCells.forEach(cell => {
            const hexagons = cell.querySelectorAll('.hexagon');
            hexagons.forEach(hex => hex.remove());
        });
        
        // Reset placement controller when starting a new phrase
        this.resetPlacementController();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    onCardPlaced(isCorrect, hexagon, position = null) {
        if (isCorrect) {
            // Record the placement in the placement controller
            if (hexagon && position) {
                const cardData = {
                    id: hexagon.id || `card-${Date.now()}`,
                    x: position.x,
                    y: position.y,
                    options: this.currentWordData.options,
                    correctForm: this.currentWordData.correctForm
                };
                this.placementController.recordPlacement(cardData, this.currentWordData.correctForm);
            }
            
            // Make the correct answer turn green and stay in the grid
            if (hexagon) {
                hexagon.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                hexagon.style.border = '3px solid #155724';
                // Remove draggability from correct answers
                hexagon.style.cursor = 'default';
                // Remove event listeners to prevent dragging
                const newHexagon = hexagon.cloneNode(true);
                hexagon.parentNode.replaceChild(newHexagon, hexagon);
            }
            
            // Show success feedback
            this.showSuccessFeedback();
            
            // Move to next word after a short delay
            setTimeout(() => {
                console.log(`Moving to next word. Current index: ${this.currentWordIndex}`);
                this.currentWordIndex++;
                console.log(`New index: ${this.currentWordIndex}`);
                this.loadNextWord();
            }, 1500);
        } else {
            // Show error feedback
            this.showErrorFeedback();
            // Don't progress - let user try again
        }
    }

    showSuccessFeedback() {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #28a745;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut 1.5s ease-in-out;
        `;
        feedback.innerHTML = '✓ Correct!';
        document.body.appendChild(feedback);

        // Add CSS animation
        if (!document.getElementById('feedback-animations')) {
            const style = document.createElement('style');
            style.id = 'feedback-animations';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            feedback.remove();
        }, 1500);
    }

    showErrorFeedback() {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut 1.5s ease-in-out;
        `;
        feedback.innerHTML = '✗ Try again!';
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 1500);
    }

    showNoResults() {
        // Update the first box to show no results message
        const box1 = document.querySelector('.box:nth-child(1)');
        if (box1) {
            const hexagon = box1.querySelector('.hexagon');
            if (hexagon) {
                hexagon.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 20px;">
                        <div style="font-size: 16px; margin-bottom: 10px;">No word forms found</div>
                        <div style="font-size: 12px;">Try a different phrase</div>
                    </div>
                `;
            }
        }
        // Clear other boxes
        const boxes = document.querySelectorAll('.box:nth-child(2), .box:nth-child(3)');
        boxes.forEach(box => {
            const hexagon = box.querySelector('.hexagon');
            if (hexagon) {
                hexagon.innerHTML = '';
            }
        });
    }

    validatePlacement(position, isFirstCard = false) {
        console.log(`Validating placement at (${position.x}, ${position.y}), isFirstCard: ${isFirstCard}`);
        const result = this.placementController.validatePlacement(position, isFirstCard);
        console.log(`Placement validation result:`, result);
        return result;
    }

    getValidAdjacentPositions() {
        return this.placementController.getValidAdjacentPositions();
    }

    getLastCorrectWord() {
        return this.placementController.getLastCorrectWord();
    }

    resetPlacementController() {
        console.log('Resetting placement controller...');
        this.placementController.reset();
        console.log('Placement controller reset complete. History length:', this.placementController.getPlacementHistory().length);
    }

    highlightValidPositions() {
        // Remove any existing highlights
        this.clearPositionHighlights();
        
        // Get valid adjacent positions
        const validPositions = this.getValidAdjacentPositions();
        
        // Highlight valid positions
        validPositions.forEach(pos => {
            const cell = document.querySelector(`[data-row="${pos.y}"][data-col="${pos.x}"]`);
            if (cell) {
                const inner = cell.querySelector('.hex-inner');
                if (inner) {
                    inner.style.background = '#d4edda';
                    inner.style.border = '2px solid #28a745';
                }
            }
        });
    }

    clearPositionHighlights() {
        const cells = document.querySelectorAll('.hex-cell');
        cells.forEach(cell => {
            const inner = cell.querySelector('.hex-inner');
            if (inner) {
                inner.style.background = '#f0f0f0';
                inner.style.border = 'none';
            }
        });
    }

    showAllComplete() {
        // Clear all boxes first
        const allBoxes = document.querySelectorAll('.box');
        allBoxes.forEach(box => {
            const hexagon = box.querySelector('.hexagon');
            if (hexagon) {
                hexagon.innerHTML = '';
            }
        });
        
        // Update the first box to show completion message
        const box1 = document.querySelector('.box:nth-child(1)');
        if (box1) {
            // Create a new hexagon if one doesn't exist
            let hexagon = box1.querySelector('.hexagon');
            if (!hexagon) {
                hexagon = document.createElement('div');
                hexagon.className = 'hexagon';
                hexagon.style.left = '50%';
                hexagon.style.top = '50%';
                hexagon.style.transform = 'translate(-50%, -50%)';
                box1.appendChild(hexagon);
            }
            
            // Set the completion message
            hexagon.innerHTML = `
                <div style="text-align: center; color: #28a745; padding: 20px;">
                    <div style="font-size: 18px; margin-bottom: 10px;">🎉 All done!</div>
                    <div style="font-size: 14px;">Great job completing all words</div>
                </div>
            `;
            
            // Style the completion hexagon
            hexagon.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            hexagon.style.color = 'white';
            hexagon.style.border = 'none';
            hexagon.style.cursor = 'default';
        }
    }
}

// Initialize the hex cards manager
const hexCardsManager = new HexCardsManager();

// Export for use in other files
window.HexCardsManager = HexCardsManager;
window.hexCardsManager = hexCardsManager;