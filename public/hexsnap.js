function enableHexSnap() {
    // Get all grid cell centers and sidebar boxes
    const gridCells = Array.from(document.querySelectorAll('.hex-cell'));
    const sidebarBoxes = Array.from(document.querySelectorAll('.box'));
    
    const cellCenters = gridCells.map(cell => {
        const rect = cell.getBoundingClientRect();
        return {
            cell,
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY,
            type: 'grid'
        };
    });
    
    const boxCenters = sidebarBoxes.map(box => {
        const rect = box.getBoundingClientRect();
        return {
            cell: box,
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY,
            type: 'sidebar'
        };
    });
    
    const allDropZones = [...cellCenters, ...boxCenters];

    // Override the drag end behavior for hexagons to handle word placement
    document.addEventListener('mouseup', function handleHexagonDrop(e) {
        // Check if this is a hexagon being dropped
        const hexagon = e.target.closest('.hexagon');
        if (!hexagon) return;
        
        // Get card data if this is a word hexagon
        const cardText = hexagon.dataset.text;
        const isCorrect = hexagon.dataset.isCorrect === 'true';
        
        // Check if dropped on a grid cell or sidebar box
        const mouseX = e.clientX + window.scrollX;
        const mouseY = e.clientY + window.scrollY;
        
        let minDist = Infinity;
        let nearest = null;
        
        for (const zone of allDropZones) {
            const dx = mouseX - zone.x;
            const dy = mouseY - zone.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = zone;
            }
        }
        
        // If dropped on a valid zone, handle placement
        if (nearest) {
            if (nearest.type === 'grid' && cardText && typeof isCorrect !== 'undefined') {
                // Dropping on grid cell
                const existingHexagon = nearest.cell.querySelector('.hexagon');
                if (!existingHexagon) {
                    // Get grid position for placement validation
                    const gridPosition = getGridPosition(nearest.cell);
                    const placementHistory = window.hexCardsManager ? window.hexCardsManager.placementController.getPlacementHistory() : [];
                    const isFirstCard = placementHistory.length === 0;
                    console.log(`HexSnap: Placement history length: ${placementHistory.length}, isFirstCard: ${isFirstCard}`);
                    
                    // Validate placement using placement controller
                    if (window.hexCardsManager) {
                        console.log(`HexSnap: Validating placement at grid position (${gridPosition.x}, ${gridPosition.y}), isFirstCard: ${isFirstCard}`);
                        const validation = window.hexCardsManager.validatePlacement(gridPosition, isFirstCard);
                        console.log(`HexSnap: Validation result:`, validation);
                        
                        if (!validation.isValid) {
                            console.log(`HexSnap: Invalid placement, showing error: ${validation.reason}`);
                            // Show placement error feedback
                            showPlacementError(validation.reason);
                            returnToOrigin(hexagon);
                            return;
                        }
                        console.log(`HexSnap: Valid placement, allowing drop`);
                    } else {
                        console.log(`HexSnap: No hexCardsManager found`);
                    }
                    
                    // Place the hexagon in the grid cell
                    hexagon.style.left = '50%';
                    hexagon.style.top = '50%';
                    hexagon.style.transform = 'translate(-50%, -50%)';
                    hexagon.style.position = 'absolute';
                    nearest.cell.appendChild(hexagon);
                    
                    // Make it draggable again for potential return to sidebar
                    makeDraggable(hexagon, nearest.cell);
                    
                    // Provide feedback to hex cards manager with position
                    if (window.hexCardsManager) {
                        window.hexCardsManager.onCardPlaced(isCorrect, hexagon, gridPosition);
                    }
                } else {
                    // Return to original position if cell is occupied
                    returnToOrigin(hexagon);
                }
            } else if (nearest.type === 'sidebar') {
                // Dropping on sidebar box - return hexagon to sidebar
                returnToOrigin(hexagon);
            } else {
                // Not a valid drop zone, return to origin
                returnToOrigin(hexagon);
            }
        } else {
            // Not dropped on any valid zone, return to origin
            returnToOrigin(hexagon);
        }
    });

    // Helper function to get grid position from cell
    function getGridPosition(cell) {
        const gridRow = cell.dataset.row;
        const gridCol = cell.dataset.col;
        return {
            x: parseInt(gridCol) || 0,
            y: parseInt(gridRow) || 0
        };
    }

    // Helper function to show placement error feedback
    function showPlacementError(reason) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ffc107;
            color: #212529;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut 1.5s ease-in-out;
            text-align: center;
            max-width: 300px;
        `;
        feedback.innerHTML = `⚠️ ${reason}`;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    // Helper function to return hexagon to its original position
    function returnToOrigin(hexagon) {
        const originBox = document.getElementById(hexagon.dataset.originBoxId);
        if (originBox) {
            hexagon.style.left = '50%';
            hexagon.style.top = '50%';
            hexagon.style.transform = 'translate(-50%, -50%)';
            hexagon.style.position = 'absolute';
            originBox.appendChild(hexagon);
            
            // Re-enable dragging for sidebar hexagons
            if (originBox.classList.contains('box')) {
                makeDraggable(hexagon, originBox);
            }
        }
    }

    console.log('Hex snap-to-grid or box enabled with placement control');
} 