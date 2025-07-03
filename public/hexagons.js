function createHexagons() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .hexagon {
            width: 225px;
            height: 225px;
            background-color: white;
            position: absolute;
            cursor: move;
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
            border: 2px solid #ccc;
            z-index: 1000;
        }
        
        .hexagon:hover {
            border: 2px solid #999;
        }
        
        .box {
            position: relative;
        }
    `;
    document.head.appendChild(style);
    
    // Create hexagons in each box
    const boxes = document.querySelectorAll('.box');
    boxes.forEach((box, index) => {
        const hexagon = document.createElement('div');
        hexagon.className = 'hexagon';
        hexagon.id = `hexagon-${index}`;
        hexagon.style.left = '50%';
        hexagon.style.top = '50%';
        hexagon.style.transform = 'translate(-50%, -50%)';
        hexagon.dataset.originBoxId = box.id || `box-${index}`;
        if (!box.id) box.id = `box-${index}`;
        // Make hexagon draggable
        makeDraggable(hexagon, box);
        box.appendChild(hexagon);
    });
    
    console.log('Hexagons created and made draggable');
}

function makeDraggable(element, originBox) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener('mousedown', dragStart);

    function dragStart(e) {
        e.preventDefault();
        isDragging = true;
        // Calculate offset between mouse and top-left of hex
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        // Set absolute positioning and move to body
        element.style.position = 'absolute';
        element.style.transform = '';
        document.body.appendChild(element);
        // Move hex to follow mouse immediately
        moveAt(e.pageX, e.pageY);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
    }

    function moveAt(pageX, pageY) {
        element.style.left = (pageX - offsetX) + 'px';
        element.style.top = (pageY - offsetY) + 'px';
    }

    function dragMove(e) {
        if (!isDragging) return;
        moveAt(e.pageX, e.pageY);
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        // Snap logic is handled in hexsnap.js
    }
} 