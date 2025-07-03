/**
 * Hex Dots System
 * Adds small dots on each side of hex cards that can be colored based on conditions
 */

class HexDotsManager {
    constructor() {
        this.dotSize = 8; // Size of the dots in pixels
        this.dotColor = '#cccccc'; // Light grey color for default state
        this.dotPositions = [
            { x: 50, y: 8 },    // Top
            { x: 78, y: 20 },   // Top-right
            { x: 78, y: 80 },   // Bottom-right
            { x: 50, y: 92 },   // Bottom
            { x: 22, y: 80 },   // Bottom-left
            { x: 22, y: 20 }    // Top-left
        ];
    }

    /**
     * Add dots to a hexagon element
     * @param {HTMLElement} hexagon - The hexagon element to add dots to
     */
    addDotsToHexagon(hexagon) {
        // Remove any existing dots first
        this.removeDotsFromHexagon(hexagon);
        
        // Create container for dots if it doesn't exist
        let dotsContainer = hexagon.querySelector('.hex-dots-container');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'hex-dots-container';
            dotsContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            `;
            hexagon.appendChild(dotsContainer);
        }

        // Create dots for each position
        this.dotPositions.forEach((position, index) => {
            const dot = document.createElement('div');
            dot.className = `hex-dot hex-dot-${index}`;
            dot.dataset.dotIndex = index;
            dot.style.cssText = `
                position: absolute;
                width: ${this.dotSize}px;
                height: ${this.dotSize}px;
                background-color: ${this.dotColor};
                border-radius: 50%;
                left: ${position.x}%;
                top: ${position.y}%;
                transform: translate(-50%, -50%);
                transition: background-color 0.3s ease;
                pointer-events: none;
            `;
            dotsContainer.appendChild(dot);
        });
    }

    /**
     * Remove dots from a hexagon element
     * @param {HTMLElement} hexagon - The hexagon element to remove dots from
     */
    removeDotsFromHexagon(hexagon) {
        const dotsContainer = hexagon.querySelector('.hex-dots-container');
        if (dotsContainer) {
            dotsContainer.remove();
        }
    }

    /**
     * Set the color of a specific dot
     * @param {HTMLElement} hexagon - The hexagon element
     * @param {number} dotIndex - Index of the dot (0-5)
     * @param {string} color - Color to set
     */
    setDotColor(hexagon, dotIndex, color) {
        const dot = hexagon.querySelector(`.hex-dot-${dotIndex}`);
        if (dot) {
            dot.style.backgroundColor = color;
        }
    }

    /**
     * Set the color of all dots on a hexagon
     * @param {HTMLElement} hexagon - The hexagon element
     * @param {string} color - Color to set for all dots
     */
    setAllDotsColor(hexagon, color) {
        const dots = hexagon.querySelectorAll('.hex-dot');
        dots.forEach(dot => {
            dot.style.backgroundColor = color;
        });
    }

    /**
     * Reset all dots to default color
     * @param {HTMLElement} hexagon - The hexagon element
     */
    resetDotsColor(hexagon) {
        this.setAllDotsColor(hexagon, this.dotColor);
    }

    /**
     * Show dots on a hexagon (make them visible)
     * @param {HTMLElement} hexagon - The hexagon element
     */
    showDots(hexagon) {
        const dots = hexagon.querySelectorAll('.hex-dot');
        dots.forEach(dot => {
            dot.style.display = 'block';
        });
    }

    /**
     * Hide dots on a hexagon (make them invisible)
     * @param {HTMLElement} hexagon - The hexagon element
     */
    hideDots(hexagon) {
        const dots = hexagon.querySelectorAll('.hex-dot');
        dots.forEach(dot => {
            dot.style.display = 'none';
        });
    }

    /**
     * Get the position of a dot relative to the hexagon
     * @param {number} dotIndex - Index of the dot (0-5)
     * @returns {Object} Position object with x and y percentages
     */
    getDotPosition(dotIndex) {
        return this.dotPositions[dotIndex] || null;
    }

    /**
     * Get all dot positions
     * @returns {Array} Array of dot positions
     */
    getAllDotPositions() {
        return [...this.dotPositions];
    }

    /**
     * Update dot size
     * @param {number} size - New size in pixels
     */
    setDotSize(size) {
        this.dotSize = size;
        // Update existing dots
        const allDots = document.querySelectorAll('.hex-dot');
        allDots.forEach(dot => {
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
        });
    }

    /**
     * Update default dot color
     * @param {string} color - New default color
     */
    setDefaultDotColor(color) {
        this.dotColor = color;
    }
}

// Initialize the hex dots manager
const hexDotsManager = new HexDotsManager();

// Export for use in other files
window.HexDotsManager = HexDotsManager;
window.hexDotsManager = hexDotsManager;

// Auto-add dots to hexagons when they're created
document.addEventListener('DOMContentLoaded', () => {
    // Add dots to existing hexagons
    const existingHexagons = document.querySelectorAll('.hexagon');
    existingHexagons.forEach(hexagon => {
        hexDotsManager.addDotsToHexagon(hexagon);
    });

    // Watch for new hexagons being added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node is a hexagon
                    if (node.classList && node.classList.contains('hexagon')) {
                        hexDotsManager.addDotsToHexagon(node);
                    }
                    // Check if the added node contains hexagons
                    const hexagons = node.querySelectorAll ? node.querySelectorAll('.hexagon') : [];
                    hexagons.forEach(hexagon => {
                        hexDotsManager.addDotsToHexagon(hexagon);
                    });
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

console.log('Hex dots system initialized'); 