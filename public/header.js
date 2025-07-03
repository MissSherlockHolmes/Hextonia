// Header component
function createHeader() {
    const header = document.createElement('div');
    header.id = 'header';
    header.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background-color: #f0f0f0;
        border-bottom: 1px solid #ccc;
        z-index: 1000;
        display: flex;
        align-items: center;
        padding: 0 20px;
    `;
    
    // Add header content here if needed
    header.innerHTML = '<div style="font-size: 18px; font-weight: bold;">Hextonia</div>';
    
    return header;
}

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const header = createHeader();
    document.body.insertBefore(header, document.body.firstChild);
    
    // Adjust body layout to account for header
    document.body.style.paddingTop = '60px';
    document.body.style.height = 'calc(100vh - 60px)';
    
    // Add styles to adjust sidebar and main content
    const style = document.createElement('style');
    style.textContent = `
        .sidebar {
            height: calc(100vh - 60px) !important;
        }
        #main {
            min-height: calc(100vh - 60px) !important;
        }
    `;
    document.head.appendChild(style);
}); 