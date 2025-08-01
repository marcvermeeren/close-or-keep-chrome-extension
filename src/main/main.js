// main.js - Main interface for Close or Keep extension

let processed = [];
let current = null;
let eventListenersAttached = false;

/**
 * Load the in-memory processed list
 */
const loadProcessed = (callback) => {
  chrome.runtime.sendMessage({ type: 'getProcessed' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading processed tabs:', chrome.runtime.lastError);
      processed = [];
    } else {
      processed = response.processed || [];
    }
    callback();
  });
};

/**
 * Fetch next unseen HTTP(S) tab, with active first on fresh open
 * Optimized to use a single query for better performance
 */
const fetchNextTab = (callback) => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('Error fetching tabs:', chrome.runtime.lastError);
      callback(null);
      return;
    }

    // Filter and sort tabs
    const pages = tabs.filter((tab) => {
      // Only include HTTP/HTTPS tabs, exclude chrome://, chrome-extension://, etc.
      return /^https?:/.test(tab.url) && !tab.url.startsWith('chrome://');
    }).sort((a, b) => b.lastAccessed - a.lastAccessed);

    // On fresh session, prioritize active tab
    if (processed.length === 0) {
      const activeTab = tabs.find(tab => tab.active);
      if (activeTab && /^https?:/.test(activeTab.url)) {
        const reorderedPages = [activeTab].concat(
          pages.filter(tab => tab.id !== activeTab.id)
        );
        callback(reorderedPages.find(tab => !processed.includes(tab.id)) || null);
        return;
      }
    }

    callback(pages.find(tab => !processed.includes(tab.id)) || null);
  });
};

/**
 * Render the next card
 */
const renderNext = () => {
  fetchNextTab((tab) => {
    const card = document.querySelector('.tab-card');
    const actions = document.querySelector('.actions');

    if (!card || !actions) {
      console.error('Required DOM elements not found');
      return;
    }

    // Clear previous content
    const imgContainer = card.querySelector('.tab-image');
    const titleEl = card.querySelector('.tab-title');
    const urlEl = card.querySelector('.tab-url');
    if (imgContainer) imgContainer.innerHTML = '';
    if (titleEl) titleEl.textContent = '';
    if (urlEl) urlEl.textContent = '';
    actions.style.display = 'flex';

    if (!tab) {
      card.className = 'tab-card empty';
      card.innerHTML = '<p>And just like that the chaos collapsed into order, your tabs now sitting quietly, like books shelved awaiting the next purge.</p>';
      
      // Replace action buttons with close extension button
      actions.innerHTML = '<button id="close-extension-btn" class="close-extension-btn">Close Extension</button>';
      actions.style.display = 'flex';
      
      // Wire up the close extension button
      document.getElementById('close-extension-btn').addEventListener('click', function() {
        window.close();
      });
      
      return;
    }

    current = tab;
    
    // Restore original action buttons if they were replaced
    if (!document.getElementById('keep-btn')) {
      actions.innerHTML = `
        <button id="remove-btn" class="action-btn" title="Close tab (R)">
          <img src="../../assets/icons/close.svg" alt="Close">
        </button>
        <button id="keep-btn" class="action-btn" title="Keep tab (K)">
          <img src="../../assets/icons/keep.svg" alt="Keep">
        </button>
      `;
      
      // Re-wire the buttons
      document.getElementById('keep-btn').addEventListener('click', keepTab);
      document.getElementById('remove-btn').addEventListener('click', removeTab);
    }
    
    // Reset button states for active tabs
    var keepBtn = document.getElementById('keep-btn');
    var removeBtn = document.getElementById('remove-btn');
    keepBtn.disabled = false;
    removeBtn.disabled = false;
    keepBtn.style.opacity = '1';
    removeBtn.style.opacity = '1';
    keepBtn.style.cursor = 'pointer';
    removeBtn.style.cursor = 'pointer';

    // Image with simple favicon fallback
    var img = document.createElement('img');
    var origin = new URL(tab.url).origin;
    var fallbackAttempts = 0;
    
    function tryNextImage() {
      fallbackAttempts++;
      
      if (fallbackAttempts === 1) {
        // First attempt: use Chrome's favicon URL if available
        img.src = tab.favIconUrl || (origin + '/favicon.ico');
      } else if (fallbackAttempts === 2) {
        // Second attempt: try origin favicon.ico
        img.src = origin + '/favicon.ico';
      } else {
        // Final fallback: use default share icon
        img.src = '../../assets/icons/share.svg';
        img.onerror = null; // Remove error handler to prevent infinite loop
      }
    }
    
    img.onerror = tryNextImage;
    tryNextImage(); // Start the first attempt
    
    imgContainer.appendChild(img);

    // Title and URL text
    titleEl.textContent = tab.title || '(no title)';
    urlEl.textContent = origin.replace(/^https?:\/\//, '');
    
    // Add click-to-navigate functionality
    card.style.cursor = 'pointer';
    card.onclick = () => {
      chrome.tabs.update(current.id, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error switching to tab:', chrome.runtime.lastError);
          return;
        }
        chrome.windows.update(current.windowId, { focused: true }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error focusing window:', chrome.runtime.lastError);
          }
        });
      });
    };
    
    // Add keyboard shortcuts display
    addKeyboardShortcuts();
  });
}

/**
 * Add keyboard shortcuts display
 */
function addKeyboardShortcuts() {
  // Remove existing shortcuts display
  var existingShortcuts = document.querySelector('.keyboard-shortcuts');
  if (existingShortcuts) existingShortcuts.remove();
  
  var shortcutsDiv = document.createElement('div');
  shortcutsDiv.className = 'keyboard-shortcuts';
  shortcutsDiv.innerHTML = `
    <div class="keyboard-icon">
      <img src="../../assets/icons/keyboard.svg" alt="Keyboard">
    </div>
    <span>R = Remove&nbsp;&nbsp;&nbsp;K = Keep</span>
  `;
  
  var actions = document.querySelector('.actions');
  actions.parentNode.insertBefore(shortcutsDiv, actions.nextSibling);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyPress(event) {
  if (!current) return;
  
  var key = event.key.toLowerCase();
  
  if (key === 'r') {
    event.preventDefault();
    removeTab();
  } else if (key === 'k') {
    event.preventDefault();
    keepTab();
  }
}

/**
 * Keep action
 */
const keepTab = () => {
  if (!current) return;
  chrome.runtime.sendMessage({
    type: 'keep',
    tabId: current.id
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error keeping tab:', chrome.runtime.lastError);
      return;
    }
    processed = response.processed;
    renderNext();
  });
};

/**
 * Remove action
 */
const removeTab = () => {
  if (!current) return;
  chrome.runtime.sendMessage({
    type: 'remove',
    tabId: current.id
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error removing tab:', chrome.runtime.lastError);
    }
  });
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  // Wire buttons
  document.getElementById('keep-btn').addEventListener('click', keepTab);
  document.getElementById('remove-btn').addEventListener('click', removeTab);

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyPress);

  // Fresh vs auto-reopen
  chrome.storage.local.get('autoReopen', function(data) {
    if (data.autoReopen) {
      chrome.storage.local.set({ autoReopen: false }, function() {
        loadProcessed(renderNext);
      });
    } else {
      chrome.runtime.sendMessage({ type: 'resetProcessed' }, function() {
        loadProcessed(renderNext);
      });
    }
  });
});
