function createHexGrid() {
    // Hex size
    const HEX_WIDTH = 225;
    const HEX_HEIGHT = 225;
    const BORDER_SIZE = 6; // 6px border (3px on each side)
    const ROWS = 4;
    const COLS = 6;
    const HORIZONTAL_STEP = HEX_WIDTH * 0.75;
    const VERTICAL_STEP = HEX_HEIGHT;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .hex-grid {
            position: relative;
            width: ${COLS * HORIZONTAL_STEP + HEX_WIDTH * 0.25}px;
            height: ${(ROWS - 1) * VERTICAL_STEP + HEX_HEIGHT}px;
            margin: 30px auto;
        }
        .hex-cell {
            position: absolute;
            width: ${HEX_WIDTH}px;
            height: ${HEX_HEIGHT}px;
        }
        .hex-border {
            position: absolute;
            width: 100%;
            height: 100%;
            background: black;
            clip-path: polygon(
                25% 0%,
                75% 0%,
                100% 50%,
                75% 100%,
                25% 100%,
                0% 50%
            );
            z-index: 1;
        }
        .hex-inner {
            position: absolute;
            left: ${BORDER_SIZE / 2}px;
            top: ${BORDER_SIZE / 2}px;
            width: ${HEX_WIDTH - BORDER_SIZE}px;
            height: ${HEX_HEIGHT - BORDER_SIZE}px;
            background: #f0f0f0;
            clip-path: polygon(
                25% 0%,
                75% 0%,
                100% 50%,
                75% 100%,
                25% 100%,
                0% 50%
            );
            z-index: 2;
            transition: background 0.2s;
        }
        .hex-inner:hover {
            background: #e0e0e0;
        }
    `;
    document.head.appendChild(style);

    // Create grid
    const mainContent = document.querySelector('.main-content');
    const gridContainer = document.createElement('div');
    gridContainer.className = 'hex-grid';

            for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const hex = document.createElement('div');
                hex.className = 'hex-cell';
                hex.id = `hex-${row}-${col}`;
                hex.dataset.row = row;
                hex.dataset.col = col;
                // Flat-top honeycomb math: odd columns offset vertically
                const left = col * HORIZONTAL_STEP;
                const top = row * VERTICAL_STEP + (col % 2 ? VERTICAL_STEP / 2 : 0);
                hex.style.left = `${left}px`;
                hex.style.top = `${top}px`;

                // Add border and inner hex
                const border = document.createElement('div');
                border.className = 'hex-border';
                const inner = document.createElement('div');
                inner.className = 'hex-inner';

                hex.appendChild(border);
                hex.appendChild(inner);
                gridContainer.appendChild(hex);
            }
        }
    mainContent.appendChild(gridContainer);
    console.log('True flat-top honeycomb hex grid created (double-layer CSS border)');
} 