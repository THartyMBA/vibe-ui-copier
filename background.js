const zip = new JSZip();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Webpage Replica Extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capturePage") {
    const url = message.url;
    fetchDataFromURL(url)
      .then(data => {
        zip.file("index.html", data.html);

        data.css.forEach(cssUrl => {
          fetch(cssUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.text();
            })
            .then(cssText => {
              zip.file(cssUrl.split('/').pop(), cssText);
            })
            .catch(error => console.error("Error fetching CSS:", error));
        });

        data.js.forEach(jsUrl => {
          fetch(jsUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.text();
            })
            .then(jsText => {
              zip.file(jsUrl.split('/').pop(), jsText);
            })
            .catch(error => console.error("Error fetching JS:", error));
        });

        zip.generateAsync({ type: "blob" })
          .then(function (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "webpage_replica.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error("Error processing page:", error);
            sendResponse({ success: false, message: error.message });
          });
      })
      .catch(error => {
        console.error("Error processing page:", error);
        sendResponse({ success: false, message: error.message });
      });
    return true; // Indicate that you wish to send a response asynchronously
  }
});

async function fetchDataFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const cssUrls = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href);

    const jsUrls = Array.from(doc.querySelectorAll('script[src]'))
      .map(script => script.src);

    return {
      html: html,
      css: cssUrls,
      js: jsUrls
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function storeData(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

function getData(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key]);
    });
  });
}