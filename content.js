function onPageLoadContent() {
  replicateUIContent();
  observeDOMChangesContent();
}

function replicateUIContent() {
  // This function currently does nothing.  Future implementations should 
  // inject replica UI elements here.  For the MVP, the core logic is handled
  // in the background script.
}

function observeDOMChangesContent() {
  // This function currently does nothing. Future implementations might observe for
  // dynamic changes and update the replica UI accordingly.  For the MVP,
  // changes are not handled in the content script.
}

function sendMessageToBackgroundContent(message) {
  chrome.runtime.sendMessage({ message: message });
}

function handleReplicaEventsContent(event) {
  // Placeholder for handling events related to the replica UI.
  // Not directly needed for the MVP as UI is primarily handled by
  // capturing and zipping the existing webpage.
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "capturePage") {
      capturePageAndSendToBackground();
    }
  }
);

function capturePageAndSendToBackground() {
  // Use fetch to get the page's HTML content
  fetch(window.location.href)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      sendMessageToBackgroundContent({
        message: "pageContentCaptured",
        html: html
      });
    })
    .catch(error => {
      console.error("Error fetching page content:", error);
      sendMessageToBackgroundContent({
        message: "pageCaptureFailed",
        error: error.message
      });

      // Specific CORS error handling
      if (error.message.includes("CORS")) {
          sendMessageToBackgroundContent({
              message: "pageCaptureFailed",
              error: "CORS error: The webpage may be blocking cross-origin requests."
          });
      }
    });
}


// Initial execution when the page loads
onPageLoadContent();