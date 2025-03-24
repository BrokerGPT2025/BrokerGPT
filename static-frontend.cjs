// Static frontend generator for production deployment (CommonJS version)
// Creates a minimal but functional frontend when Vite build fails

'use strict';

// CommonJS imports
const fs = require('fs');
const path = require('path');
// __dirname is already available in CommonJS

console.log('Starting static frontend generation (CommonJS version)...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Ensure client/dist directory exists
const clientDistDir = path.join(process.cwd(), 'client', 'dist');
if (!fs.existsSync(clientDistDir)) {
  fs.mkdirSync(clientDistDir, { recursive: true });
  console.log(`Created directory: ${clientDistDir}`);
}

// Create a minimal but functional frontend
const indexHtmlPath = path.join(clientDistDir, 'index.html');
const cssPath = path.join(clientDistDir, 'styles.css');
const jsPath = path.join(clientDistDir, 'app.js');
const assetsDir = path.join(clientDistDir, 'assets');

// Create assets directory
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created directory: ${assetsDir}`);
}

// Generate CSS file
const css = `/* BrokerGPT Static CSS */
:root {
  --primary: #0087FF;
  --background: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --sidebar-width: 199px;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --transition: all 0.2s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body, html {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background);
  color: var(--text-primary);
}

.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--card-bg);
  border-right: 1px solid var(--border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  text-decoration: none;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.nav-link:hover {
  background-color: rgba(0, 135, 255, 0.1);
}

.nav-link.active {
  background-color: rgba(0, 135, 255, 0.1);
  color: var(--primary);
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

h1, h2, h3 {
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.5rem;
}

h2 {
  font-size: 1.25rem;
}

p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.status {
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.status-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3rem);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.chat-input {
  border-top: 1px solid var(--border);
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
}

.message {
  margin-bottom: 1rem;
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
  background-color: var(--primary);
  color: white;
  border-radius: 0.5rem 0.5rem 0 0.5rem;
  padding: 0.75rem;
}

.message-ai {
  align-self: flex-start;
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 0.5rem 0.5rem 0.5rem 0;
  padding: 0.75rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.table th {
  font-weight: 600;
}

@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}`;

// Generate JS file
const js = `// BrokerGPT Static App JS
document.addEventListener('DOMContentLoaded', () => {
  const routes = {
    '/': renderHome,
    '/chat': renderChat,
    '/clients': renderClients,
    '/carriers': renderCarriers,
    '/not-found': renderNotFound
  };

  // Simple router
  function navigateTo(path) {
    window.history.pushState(null, null, path);
    renderContent();
  }

  // Handle browser back/forward
  window.addEventListener('popstate', renderContent);

  // Initial render
  renderContent();

  // Set active nav link
  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Render the appropriate content based on URL
  function renderContent() {
    const path = window.location.pathname;
    const render = routes[path] || routes['/not-found'];
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = render();
    setActiveNavLink();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Add event listeners to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.getAttribute('href'));
      });
    });

    // Setup chat form if it exists
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
          sendChatMessage(message);
          input.value = '';
        }
      });
    }

    // Setup client search if it exists
    const clientSearch = document.getElementById('client-search');
    if (clientSearch) {
      clientSearch.addEventListener('input', (e) => {
        filterClients(e.target.value);
      });
    }

    // Setup carrier filters if they exist
    const carrierFilters = document.querySelectorAll('.carrier-filter');
    if (carrierFilters.length) {
      carrierFilters.forEach(filter => {
        filter.addEventListener('change', () => {
          filterCarriers();
        });
      });
    }
  }

  // Home page
  function renderHome() {
    return \`
      <h1>BrokerGPT Dashboard</h1>
      <p class="status status-success">System is online and operational</p>
      
      <div class="grid">
        <div class="card">
          <h2>Quick Actions</h2>
          <p>Start a new conversation or manage existing clients.</p>
          <a href="/chat" class="btn btn-primary">New Chat</a>
        </div>
        
        <div class="card">
          <h2>Recent Clients</h2>
          <p>View and manage your most recent client interactions.</p>
          <a href="/clients" class="btn btn-secondary">View All Clients</a>
        </div>
        
        <div class="card">
          <h2>Carrier Network</h2>
          <p>Browse and filter available insurance carriers.</p>
          <a href="/carriers" class="btn btn-secondary">View Carriers</a>
        </div>
      </div>
      
      <div class="card">
        <h2>System Status</h2>
        <div id="api-status">Checking API status...</div>
      </div>
    \`;
  }

  // Chat page
  function renderChat() {
    return \`
      <div class="chat-container">
        <div class="chat-messages" id="chat-messages">
          <div class="message message-ai">
            <p>Hello! I'm BrokerGPT, your AI insurance assistant. How can I help you today?</p>
          </div>
        </div>
        <form class="chat-input" id="chat-form">
          <input type="text" id="chat-input" placeholder="Type your message here..." />
          <button type="submit" class="btn btn-primary">Send</button>
        </form>
      </div>
    \`;
  }

  // Clients page
  function renderClients() {
    return \`
      <h1>Clients</h1>
      <div class="card">
        <input type="text" id="client-search" placeholder="Search clients..." style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;" />
        
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="clients-table-body">
            <tr>
              <td colspan="4">Loading clients...</td>
            </tr>
          </tbody>
        </table>
      </div>
    \`;
  }

  // Carriers page
  function renderCarriers() {
    return \`
      <h1>Insurance Carriers</h1>
      <div class="card">
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h3>Filter by Coverage</h3>
            <div>
              <label><input type="checkbox" class="carrier-filter" value="general-liability" /> General Liability</label>
            </div>
            <div>
              <label><input type="checkbox" class="carrier-filter" value="property" /> Property</label>
            </div>
            <div>
              <label><input type="checkbox" class="carrier-filter" value="workers-comp" /> Workers' Compensation</label>
            </div>
            <div>
              <label><input type="checkbox" class="carrier-filter" value="cyber" /> Cyber</label>
            </div>
          </div>
          
          <div style="flex: 1;">
            <input type="text" placeholder="Search carriers..." style="width: 100%; padding: 0.5rem;" />
          </div>
        </div>
        
        <div class="grid" id="carriers-grid">
          <div class="card">
            <h3>Loading carriers...</h3>
          </div>
        </div>
      </div>
    \`;
  }

  // Not Found page
  function renderNotFound() {
    return \`
      <div style="text-align: center; padding: 3rem 1rem;">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/" class="btn btn-primary">Go Home</a>
      </div>
    \`;
  }

  // API interactions
  function fetchApiStatus() {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        const statusEl = document.getElementById('api-status');
        if (statusEl) {
          statusEl.innerHTML = \`
            <p class="status status-success">
              ✅ API is online | Last updated: \${new Date(data.timestamp).toLocaleTimeString()}
            </p>
          \`;
        }
      })
      .catch(error => {
        const statusEl = document.getElementById('api-status');
        if (statusEl) {
          statusEl.innerHTML = \`
            <p class="status status-error">
              ❌ API is offline | Error: \${error.message}
            </p>
          \`;
        }
      });
  }

  function sendChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Add user message to UI
    chatMessages.innerHTML += \`
      <div class="message message-user">
        <p>\${message}</p>
      </div>
    \`;
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show typing indicator
    chatMessages.innerHTML += \`
      <div class="message message-ai" id="typing-indicator">
        <p>Typing...</p>
      </div>
    \`;
    
    // Make API request
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: message })
    })
      .then(response => response.json())
      .then(data => {
        // Remove typing indicator
        document.getElementById('typing-indicator').remove();
        
        // Add AI response
        chatMessages.innerHTML += \`
          <div class="message message-ai">
            <p>\${data.aiResponse?.content || "I'm sorry, I couldn't process that request."}</p>
          </div>
        \`;
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      })
      .catch(error => {
        // Remove typing indicator
        document.getElementById('typing-indicator').remove();
        
        // Show error message
        chatMessages.innerHTML += \`
          <div class="message message-ai">
            <p>I'm sorry, there was an error processing your request: \${error.message}</p>
          </div>
        \`;
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
  }

  function loadClients() {
    const clientsTableBody = document.getElementById('clients-table-body');
    if (!clientsTableBody) return;
    
    fetch('/api/clients')
      .then(response => response.json())
      .then(clients => {
        if (clients.length === 0) {
          clientsTableBody.innerHTML = '<tr><td colspan="4">No clients found</td></tr>';
          return;
        }
        
        let html = '';
        clients.forEach(client => {
          html += \`
            <tr>
              <td>\${client.name || 'N/A'}</td>
              <td>\${client.company || 'N/A'}</td>
              <td><span class="status status-success">Active</span></td>
              <td>
                <a href="/clients/\${client.id}" class="btn btn-secondary">View</a>
              </td>
            </tr>
          \`;
        });
        
        clientsTableBody.innerHTML = html;
      })
      .catch(error => {
        clientsTableBody.innerHTML = \`<tr><td colspan="4">Error loading clients: \${error.message}</td></tr>\`;
      });
  }

  function loadCarriers() {
    const carriersGrid = document.getElementById('carriers-grid');
    if (!carriersGrid) return;
    
    fetch('/api/carriers')
      .then(response => response.json())
      .then(carriers => {
        if (carriers.length === 0) {
          carriersGrid.innerHTML = '<div class="card"><h3>No carriers found</h3></div>';
          return;
        }
        
        let html = '';
        carriers.forEach(carrier => {
          html += \`
            <div class="card" data-carrier-id="\${carrier.id}">
              <h3>\${carrier.name}</h3>
              <p>\${carrier.description || 'No description available.'}</p>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
                \${(carrier.coverageTypes || []).map(type => 
                  \`<span class="status status-success">\${type}</span>\`
                ).join('')}
              </div>
            </div>
          \`;
        });
        
        carriersGrid.innerHTML = html;
      })
      .catch(error => {
        carriersGrid.innerHTML = \`<div class="card"><h3>Error loading carriers: \${error.message}</h3></div>\`;
      });
  }

  function filterClients(searchTerm) {
    const rows = document.querySelectorAll('#clients-table-body tr');
    if (!rows.length) return;
    
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
      const clientName = row.cells[0]?.textContent.toLowerCase() || '';
      const clientCompany = row.cells[1]?.textContent.toLowerCase() || '';
      
      if (clientName.includes(searchTerm) || clientCompany.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function filterCarriers() {
    const carrierCards = document.querySelectorAll('#carriers-grid .card');
    if (!carrierCards.length) return;
    
    const selectedFilters = Array.from(document.querySelectorAll('.carrier-filter:checked')).map(
      checkbox => checkbox.value
    );
    
    if (selectedFilters.length === 0) {
      // If no filters selected, show all
      carrierCards.forEach(card => {
        card.style.display = '';
      });
      return;
    }
    
    carrierCards.forEach(card => {
      const coverageTypes = Array.from(card.querySelectorAll('.status')).map(
        span => span.textContent.toLowerCase()
      );
      
      const hasMatch = selectedFilters.some(filter => 
        coverageTypes.some(type => type.includes(filter))
      );
      
      if (hasMatch) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Initialize data loading
  setTimeout(() => {
    fetchApiStatus();
    
    // Load appropriate data based on current page
    const path = window.location.pathname;
    if (path === '/clients') {
      loadClients();
    } else if (path === '/carriers') {
      loadCarriers();
    } else if (path === '/') {
      fetchApiStatus();
    }
  }, 100);
});`;

// Generate index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrokerGPT</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="app">
    <div class="sidebar">
      <div class="sidebar-logo">
        BrokerGPT
      </div>
      <nav>
        <a href="/" class="nav-link">Dashboard</a>
        <a href="/chat" class="nav-link">Chat</a>
        <a href="/clients" class="nav-link">Clients</a>
        <a href="/carriers" class="nav-link">Carriers</a>
      </nav>
      
      <div style="margin-top: auto; padding-top: 1rem; font-size: 0.75rem; color: var(--text-secondary);">
        <p>CommonJS Version</p>
        <p>© ${new Date().getFullYear()} BrokerGPT</p>
      </div>
    </div>
    
    <div class="main-content">
      <!-- Content will be loaded here by JavaScript -->
      <div style="text-align: center; padding: 2rem;">
        <h2>Loading...</h2>
      </div>
    </div>
  </div>
  
  <script src="/app.js"></script>
</body>
</html>`;

// Write files
fs.writeFileSync(indexHtmlPath, indexHtml);
fs.writeFileSync(cssPath, css);
fs.writeFileSync(jsPath, js);

console.log('Static frontend files generated successfully!');
console.log(`Generated: ${indexHtmlPath}`);
console.log(`Generated: ${cssPath}`);
console.log(`Generated: ${jsPath}`);

// Create a basic asset file for auto-reload detection
const assetIndexPath = path.join(assetsDir, 'index.js');
fs.writeFileSync(assetIndexPath, '// Asset marker for auto-reload detection (CommonJS version)');
console.log(`Generated: ${assetIndexPath}`);

console.log('Static frontend generation completed successfully (CommonJS version)!');