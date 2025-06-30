let replicaElements = [];

function onPageLoad() {
  console.log("Page loaded. Starting UI replication.");
  replicateUI();
  observeDOMChanges();
}

function replicateUI() {
  // Target specific UI elements for replication
  const targetElements = document.querySelectorAll('body > *'); // Adjust selector as needed

  targetElements.forEach(element => {
    replicaElements.push(element.cloneNode(true));
  });

  // Create a hidden container for the cloned elements
  const container = document.createElement('div');
  container.id = 'replica-container';
  container.style.display = 'none';
  replicaElements.forEach(element => container.appendChild(element));
  document.body.appendChild(container);
}

function observeDOMChanges() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // Only replicate changed elements, not the entire UI
        console.log('DOM changed. Replicating changed elements.');
        replicateChangedElements(mutation);
      }
    });
  });

  const config = { childList: true, subtree: true, attributes: true };
  observer.observe(document.body, config);
}

function replicateChangedElements(mutation) {
  if (mutation.type === 'childList') {
    mutation.addedNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        replicaElements.push(node.cloneNode(true));
        const container = document.getElementById('replica-container');
        if(container) {
            container.appendChild(node.cloneNode(true));
        }
      }
    });

    mutation.removedNodes.forEach(node => {
       //Removing from replicaElements is quite complex, skipping for now
    });
  } else if (mutation.type === 'attributes') {
    // Handle attribute changes by finding the corresponding replicated element
    let targetElement = mutation.target;
    let replicaElement = replicaElements.find(el => el === targetElement); //This isn't quite right.
    if (replicaElement) {
        const attributeName = mutation.attributeName;
        const newValue = mutation.newValue;
        replicaElement.setAttribute(attributeName, newValue);
    }
  }
}


function sendMessageToBackground(message) {
  chrome.runtime.sendMessage({ message: message });
}

function handleReplicaEvents(event) {
  // Placeholder for handling events on the replicated UI
  console.log("Replica event:", event);
}

// Listen for messages from the background script (e.g., to trigger download)
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "downloadReplica") {
      downloadReplica();
    }
  }
);


function downloadReplica() {
  const container = document.getElementById('replica-container');
  if (!container) {
    console.error("Replica container not found.");
    return;
  }

  const zip = new JSZip();
  const htmlContent = container.outerHTML;

  zip.file("index.html", htmlContent);

  zip.generateAsync({ type: "blob" })
    .then(function (blob) {
      chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename: "webpage_replica.zip",
        saveAs: true
      });
    });
}

onPageLoad();