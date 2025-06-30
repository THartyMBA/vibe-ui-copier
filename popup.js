function init() {
  loadSettings();
  document.getElementById('downloadButton').addEventListener('click', downloadPage);
}

function loadSettings() {
  chrome.storage.sync.get(['settings'], function(result) {
    const settings = result.settings || { };
    // Apply settings to the popup if any exist.  Currently none.
  });
}

function saveSettings(settings) {
  chrome.storage.sync.set({ settings: settings }, function() {
    console.log('Settings saved.');
  });
}

function sendMessageToBackground(message) {
  chrome.runtime.sendMessage(message);
}

function downloadPage() {
  sendMessageToBackground({ message: "downloadPage" });
  // Optional: Display a message to the user while processing.
  document.getElementById('status').textContent = 'Processing...';
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "downloadStarted") {
      document.getElementById('status').textContent = 'Download Started';
    } else if (request.message === "downloadCompleted") {
      document.getElementById('status').textContent = 'Download Completed';
    } else if (request.message === "error") {
      document.getElementById('status').textContent = "Error: " + request.error;
    }
  }
);