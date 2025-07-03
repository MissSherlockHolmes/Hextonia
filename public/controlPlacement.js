/**
 * Control Placement System
 * Ensures that each card after the first must be placed adjacent to the correct word from the previous card.
 */

class PlacementController {
    constructor() {
        this.placementHistory = [];
        this.grid = new Map(); // Tracks occupied positions
        this.adjacentDirections = [
            { x: -1, y: 0 },   // left
            { x: 1, y: 0 },    // right
            { x: 0, y: -1 },   // top
            { x: 0, y: 1 },    // bottom
            { x: -1, y: -1 },  // top-left
            { x: 1, y: -1 },   // top-right
            { x: -1, y: 1 },   // bottom-left
            { x: 1, y: 1 }     // bottom-right
        ];
    }

    /**
     * Record a card placement
     * @param {Object} card - The card object with position and word data
     * @param {string} correctWord - The correct word that was selected
     */
    recordPlacement(card, correctWord) {
        const placement = {
            cardId: card.id,
            position: { x: card.x, y: card.y },
            correctWord: correctWord,
            timestamp: Date.now()
        };
        
        this.placementHistory.push(placement);
        this.grid.set(`${card.x},${card.y}`, card.id);
        
        console.log(`Card ${card.id} placed at (${card.x}, ${card.y}) with correct word: ${correctWord}`);
    }

    /**
     * Get the last correct word that was placed
     * @returns {string|null} The correct word from the last placement, or null if no placements
     */
    getLastCorrectWord() {
        if (this.placementHistory.length === 0) {
            return null;
        }
        return this.placementHistory[this.placementHistory.length - 1].correctWord;
    }

    /**
     * Get the position of the last placed card
     * @returns {Object|null} The position {x, y} of the last card, or null if no placements
     */
    getLastPosition() {
        if (this.placementHistory.length === 0) {
            return null;
        }
        return this.placementHistory[this.placementHistory.length - 1].position;
    }

    /**
     * Check if a position is adjacent to the last placed card
     * @param {Object} position - The position to check {x, y}
     * @returns {boolean} True if adjacent to the last placed card
     */
    isAdjacentToLast(position) {
        const lastPosition = this.getLastPosition();
        if (!lastPosition) {
            return true; // First card can be placed anywhere
        }

        for (const direction of this.adjacentDirections) {
            const adjacentPos = {
                x: lastPosition.x + direction.x,
                y: lastPosition.y + direction.y
            };
            
            if (adjacentPos.x === position.x && adjacentPos.y === position.y) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get all valid adjacent positions for the next card
     * @returns {Array} Array of valid adjacent positions {x, y}
     */
    getValidAdjacentPositions() {
        const lastPosition = this.getLastPosition();
        if (!lastPosition) {
            return []; // First card - return empty array to allow any position
        }

        const validPositions = [];
        
        for (const direction of this.adjacentDirections) {
            const adjacentPos = {
                x: lastPosition.x + direction.x,
                y: lastPosition.y + direction.y
            };
            
            // Check if position is not already occupied
            if (!this.grid.has(`${adjacentPos.x},${adjacentPos.y}`)) {
                validPositions.push(adjacentPos);
            }
        }
        
        return validPositions;
    }

    /**
     * Validate if a card can be placed at a given position
     * @param {Object} position - The position to validate {x, y}
     * @param {boolean} isFirstCard - Whether this is the first card being placed
     * @returns {Object} Validation result with isValid and reason
     */
    validatePlacement(position, isFirstCard = false) {
        // Check if position is already occupied
        if (this.grid.has(`${position.x},${position.y}`)) {
            return {
                isValid: false,
                reason: 'Position already occupied'
            };
        }

        // First card can be placed anywhere
        if (isFirstCard || this.placementHistory.length === 0) {
            return {
                isValid: true,
                reason: 'First card placement'
            };
        }

        // Subsequent cards must be adjacent to the last placed card
        if (!this.isAdjacentToLast(position)) {
            return {
                isValid: false,
                reason: 'Card must be placed adjacent to the last placed card'
            };
        }

        return {
            isValid: true,
            reason: 'Valid placement'
        };
    }

    /**
     * Get placement statistics
     * @returns {Object} Statistics about placements
     */
    getStats() {
        return {
            totalPlacements: this.placementHistory.length,
            lastCorrectWord: this.getLastCorrectWord(),
            lastPosition: this.getLastPosition(),
            validAdjacentPositions: this.getValidAdjacentPositions().length
        };
    }

    /**
     * Reset the placement controller
     */
    reset() {
        this.placementHistory = [];
        this.grid.clear();
        console.log('Placement controller reset');
    }

    /**
     * Get the placement history
     * @returns {Array} Array of all placements
     */
    getPlacementHistory() {
        return [...this.placementHistory];
    }

    /**
     * Check if a card contains the correct word from the previous placement
     * @param {Object} card - The card to check
     * @param {string} correctWord - The correct word to look for
     * @returns {boolean} True if the card contains the correct word
     */
    cardContainsCorrectWord(card, correctWord) {
        // This assumes the card has an options array with the correct word somewhere
        if (card.options && Array.isArray(card.options)) {
            return card.options.includes(correctWord);
        }
        return false;
    }

    /**
     * Get the correct word position within a card's options
     * @param {Object} card - The card to check
     * @param {string} correctWord - The correct word to find
     * @returns {number} Index of the correct word, or -1 if not found
     */
    getCorrectWordIndex(card, correctWord) {
        if (card.options && Array.isArray(card.options)) {
            return card.options.indexOf(correctWord);
        }
        return -1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlacementController;
} else {
    // Browser environment
    window.PlacementController = PlacementController;
} 