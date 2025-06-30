chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    if (message.action === "downloadPage") {
      const url = message.url;
      fetchDataFromURL(url)
        .then(data => {
          createZipArchive(data)
            .then(zip => {
              downloadZip(zip);
              sendResponse({ success: true });
            })
            .catch(error => {
              console.error("Error creating zip archive:", error);
              sendResponse({ success: false, message: error.message });
            });
        })
        .catch(error => {
          console.error("Error downloading page:", error);
          sendResponse({ success: false, message: error.message });
        });
      return true; // Indicate you wish to send a response asynchronously
    }
  }
);

async function fetchDataFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw {message: `HTTP error! status: ${response.status}`};
    }
    const html = await response.text();
    const cssUrls = extractCssUrls(html);
    const jsUrls = extractJsUrls(html);
    const inlineCss = extractInlineCss(html);
    const inlineJs = extractInlineJs(html);

    const cssPromises = cssUrls.map(cssUrl => fetch(cssUrl).then(cssResponse => cssResponse.text()));
    const jsPromises = jsUrls.map(jsUrl => fetch(jsUrl).then(jsResponse => jsResponse.text()));

    const [cssContents, jsContents] = await Promise.all([...cssPromises, ...jsPromises]);

    return {
      html: html,
      css: cssContents.join('\n'),
      js: jsContents.join('\n'),
      inlineCss: inlineCss,
      inlineJs: inlineJs
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function extractCssUrls(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.getElementsByTagName('link');
  const cssUrls = [];

  for (let i = 0; i < links.length; i++) {
    if (links[i].rel === 'stylesheet') {
      cssUrls.push(links[i].href);
    }
  }
  return cssUrls;
}

function extractJsUrls(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.getElementsByTagName('script');
  const jsUrls = [];

  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src) {
      jsUrls.push(scripts[i].src);
    }
  }
  return jsUrls;
}

function extractInlineCss(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const styles = doc.getElementsByTagName('style');
  let inlineCss = '';
  for (let i = 0; i < styles.length; i++) {
    inlineCss += styles[i].textContent + '\n';
  }
  return inlineCss;
}

function extractInlineJs(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.getElementsByTagName('script');
  let inlineJs = '';
  for (let i = 0; i < scripts.length; i++) {
    if (!scripts[i].src) {
      inlineJs += scripts[i].textContent + '\n';
    }
  }
  return inlineJs;
}

async function createZipArchive(data) {
  const JSZip = await import('jszip');
  const zip = new JSZip.Zip();

  zip.file("index.html", data.html);
  zip.file("style.css", data.css + data.inlineCss);
  zip.file("script.js", data.js + data.inlineJs);

  return zip;
}

function downloadZip(zip) {
  zip.generateAsync({ type: "blob" })
    .then(function (blob) {
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: "webpage_replica.zip"
      }, function(downloadId) {
        if (downloadId === undefined) {
          console.error("Download failed");
        }
      });
      URL.revokeObjectURL(url);
    });
}