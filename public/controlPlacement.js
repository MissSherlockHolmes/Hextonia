/**
 * Control Placement System
 * Ensures that each card after the first must be placed adjacent to the correct word from the previous card.
 */

class PlacementController {
    constructor() {
        this.placementHistory = [];
        this.grid = new Map(); // Tracks occupied positions
        // Adjacent directions for flat-top hexagonal grid
        // In a flat-top hex grid, odd columns are offset vertically
        this.adjacentDirections = [
            { x: -1, y: 0 },   // left
            { x: 1, y: 0 },    // right
            { x: 0, y: -1 },   // top
            { x: 0, y: 1 },    // bottom
            { x: -1, y: -1 },  // top-left (for even columns)
            { x: 1, y: -1 },   // top-right (for even columns)
            { x: -1, y: 1 },   // bottom-left (for even columns)
            { x: 1, y: 1 }     // bottom-right (for even columns)
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
     * Check if a position is adjacent to exactly one previous card
     * @param {Object} position - The position to check {x, y}
     * @returns {Object} Result with isValid and reason
     */
    isAdjacentToExactlyOneCard(position) {
        if (this.placementHistory.length === 0) {
            return { isValid: true, reason: 'First card can be placed anywhere' };
        }

        let adjacentCount = 0;
        let adjacentCard = null;

        // Check adjacency to all previously placed cards
        for (const placement of this.placementHistory) {
            const cardPos = placement.position;
            
            // Check if this position is adjacent to the card position
            if (this.isAdjacent(position, cardPos)) {
                adjacentCount++;
                adjacentCard = placement;
            }
        }

        if (adjacentCount === 0) {
            return { isValid: false, reason: 'Card must be adjacent to exactly one previous card' };
        } else if (adjacentCount > 1) {
            return { isValid: false, reason: 'Card cannot be adjacent to multiple previous cards' };
        } else {
            return { isValid: true, reason: 'Valid placement adjacent to one card' };
        }
    }

    /**
     * Check if two positions are adjacent in a flat-top hexagonal grid
     * @param {Object} pos1 - First position {x, y}
     * @param {Object} pos2 - Second position {x, y}
     * @returns {boolean} True if positions are adjacent
     */
    isAdjacent(pos1, pos2) {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        
        // For flat-top hexagonal grid
        if (dx === 0) {
            // Same column - only adjacent if y differs by 1
            return dy === 1;
        } else if (dx === 1) {
            // Adjacent columns - check y difference based on column parity
            const evenCol = pos2.x % 2 === 0;
            if (evenCol) {
                // Even column: adjacent to same y and y-1
                return dy === 0 || dy === 1;
            } else {
                // Odd column: adjacent to same y and y+1
                return dy === 0 || dy === 1;
            }
        }
        
        return false;
    }

    /**
     * Get all valid adjacent positions for the next card
     * @returns {Array} Array of valid adjacent positions {x, y}
     */
    getValidAdjacentPositions() {
        if (this.placementHistory.length === 0) {
            return []; // First card - return empty array to allow any position
        }

        const validPositions = [];
        
        // Check all possible positions around all placed cards
        for (const placement of this.placementHistory) {
            const cardPos = placement.position;
            
            // Generate all possible adjacent positions for this card
            const adjacentPositions = this.getAdjacentPositions(cardPos);
            
            for (const adjacentPos of adjacentPositions) {
                // Check if position is not already occupied
                if (!this.grid.has(`${adjacentPos.x},${adjacentPos.y}`)) {
                    // Check if this position is adjacent to exactly one card
                    const validation = this.isAdjacentToExactlyOneCard(adjacentPos);
                    if (validation.isValid) {
                        // Only add if not already in the list
                        const exists = validPositions.some(pos => pos.x === adjacentPos.x && pos.y === adjacentPos.y);
                        if (!exists) {
                            validPositions.push(adjacentPos);
                        }
                    }
                }
            }
        }
        
        return validPositions;
    }

    /**
     * Get all adjacent positions for a given position in a flat-top hexagonal grid
     * @param {Object} position - The position {x, y}
     * @returns {Array} Array of adjacent positions {x, y}
     */
    getAdjacentPositions(position) {
        const adjacent = [];
        const { x, y } = position;
        
        // Same column positions
        adjacent.push({ x, y: y - 1 }); // top
        adjacent.push({ x, y: y + 1 }); // bottom
        
        // Adjacent column positions
        adjacent.push({ x: x - 1, y }); // left
        adjacent.push({ x: x + 1, y }); // right
        
        // Diagonal positions based on column parity
        if (x % 2 === 0) {
            // Even column
            adjacent.push({ x: x - 1, y: y - 1 }); // top-left
            adjacent.push({ x: x + 1, y: y - 1 }); // top-right
        } else {
            // Odd column
            adjacent.push({ x: x - 1, y: y + 1 }); // bottom-left
            adjacent.push({ x: x + 1, y: y + 1 }); // bottom-right
        }
        
        return adjacent;
    }

    /**
     * Validate if a card can be placed at a given position
     * @param {Object} position - The position to validate {x, y}
     * @param {boolean} isFirstCard - Whether this is the first card being placed
     * @returns {Object} Validation result with isValid and reason
     */
    validatePlacement(position, isFirstCard = false) {
        console.log(`PlacementController: Validating position (${position.x}, ${position.y}), isFirstCard: ${isFirstCard}`);
        console.log(`PlacementController: Current grid:`, Array.from(this.grid.entries()));
        console.log(`PlacementController: Placement history length:`, this.placementHistory.length);
        console.log(`PlacementController: Placement history details:`, this.placementHistory);
        
        // Check if position is already occupied
        if (this.grid.has(`${position.x},${position.y}`)) {
            console.log(`PlacementController: Position already occupied`);
            return {
                isValid: false,
                reason: 'Position already occupied'
            };
        }

        // First card can be placed anywhere
        if (isFirstCard || this.placementHistory.length === 0) {
            console.log(`PlacementController: First card placement allowed`);
            return {
                isValid: true,
                reason: 'First card placement'
            };
        }

        // Subsequent cards must be adjacent to exactly one previous card
        const adjacencyValidation = this.isAdjacentToExactlyOneCard(position);
        console.log(`PlacementController: Adjacency validation:`, adjacencyValidation);
        if (!adjacencyValidation.isValid) {
            return adjacencyValidation;
        }

        console.log(`PlacementController: Valid placement`);
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