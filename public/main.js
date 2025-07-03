function createMain() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #main {
            flex: 1;
            background-color: grey !important;
            min-height: 100vh;
        }
        .main-content {
            width: 100%;
            height: 100%;
            background-color: mediumgrey !important;
        }
    `;
    document.head.appendChild(style);
    
    // Create HTML
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="main-content">
            <!-- Main content area -->
        </div>
    `;
    
    console.log('Main component created with grey background');
} 