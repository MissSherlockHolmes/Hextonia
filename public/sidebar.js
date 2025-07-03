function createSidebar() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .sidebar {
            width: 250px;
            height: 100vh;
            border-right: 1px solid black;
            display: flex;
            flex-direction: column;
            background-color: lightgray;
        }
        .box {
            flex: 1;
            border-bottom: 1px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
        }
        .box:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
    
    // Create HTML
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
        <div class="sidebar">
            <div class="box">Box 1</div>
            <div class="box">Box 2</div>
            <div class="box">Box 3</div>
        </div>
    `;
} 