// service-worker.js - Background script for Close or Keep extension

// Constants - inline for service worker compatibility
const MESSAGE_TYPES = {
  GET_PROCESSED: 'getProcessed',
  RESET_PROCESSED: 'resetProcessed',
  KEEP_TAB: 'keep',
  REMOVE_TAB: 'remove'
};

const STORAGE_KEYS = {
  AUTO_REOPEN: 'autoReopen'
};

let processed = [];

/**
 * Safely remove a tab if it still exists
 * @param {number} tabId - ID of the tab to be removed
 * @param {Function} callback - Function to call after removal attempt
 */
function safeRemove(tabId, callback) {
  chrome.tabs.get(tabId, () => {
    if (!chrome.runtime.lastError) {
      chrome.tabs.remove(tabId, callback);
    } else {
      callback();
    }
  });
}

// Message listener for tab processing actions
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case MESSAGE_TYPES.GET_PROCESSED:
      sendResponse({ processed });
      break;

    case MESSAGE_TYPES.RESET_PROCESSED:
      processed = [];
      sendResponse({});
      break;

    case MESSAGE_TYPES.KEEP_TAB:
      processed.push(msg.tabId);
      sendResponse({ processed });
      break;

    case MESSAGE_TYPES.REMOVE_TAB:
      processed.push(msg.tabId);
      // Mark that the next popup open is an auto-reopen
      chrome.storage.local.set({ [STORAGE_KEYS.AUTO_REOPEN]: true }, () => {
        safeRemove(msg.tabId, () => {
          // Focus on the last-focused window, then reopen popup
          chrome.windows.getLastFocused({ populate: false }, (win) => {
            if (win && win.id) {
              chrome.windows.update(win.id, { focused: true }, () => {
                chrome.action.openPopup();
              });
            } else {
              chrome.action.openPopup();
            }
          });
        });
      });
      break;
  }
  return true;
});
