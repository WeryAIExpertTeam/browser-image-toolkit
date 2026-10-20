// Sends an image to WeryAI's AI photo editor: opens the page and fills its upload box.
// Used by background.js (right-click) and app.js (after the user grants site access).
var WERY_EDITOR = 'https://www.wery.ai/en/@Zeny-Design-AI-Expert-Workspace/ai-photo-editor';

function weryToBase64(buf) {
  var bytes = new Uint8Array(buf), s = '', CH = 0x8000;
  for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}

// Runs inside the wery.ai tab. Waits for the page's file input, sets the file and
// confirms the page picked it up (a blob: preview appears); retries while the page hydrates.
function weryFillUpload(b64, name, type) {
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  var file = new File([arr], name, { type: type });
  var started = Date.now();
  return new Promise(function (resolve) {
    (function attempt() {
      var input = document.querySelector('input[type=file][accept*="image"]') || document.querySelector('input[type=file]');
      if (input) {
        var dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(function () {
        var preview = document.querySelector('img[src^="blob:"]');
        if (preview) { preview.scrollIntoView({ block: 'center', behavior: 'smooth' }); return resolve(true); }
        if (Date.now() - started > 20000) return resolve(false);
        attempt();
      }, input ? 1200 : 400);
    })();
  });
}

function weryWaitForLoad(tabId) {
  return new Promise(function (resolve) {
    chrome.tabs.get(tabId, function (t) { if (t && t.status === 'complete') resolve(); });
    chrome.tabs.onUpdated.addListener(function on(id, info) {
      if (id === tabId && info.status === 'complete') { chrome.tabs.onUpdated.removeListener(on); resolve(); }
    });
  });
}

// blob: the image; utmMedium: where the request came from (context_menu / app).
function werySendToEditor(blob, name, utmMedium) {
  var url = WERY_EDITOR + '?utm_source=chrome_extension&utm_medium=' + utmMedium + '&utm_campaign=image_compressor&utm_content=send_image';
  return blob.arrayBuffer().then(function (buf) {
    var b64 = weryToBase64(buf);
    return chrome.tabs.create({ url: url }).then(function (tab) {
      return weryWaitForLoad(tab.id).then(function () {
        return chrome.scripting.executeScript({ target: { tabId: tab.id }, func: weryFillUpload, args: [b64, name, blob.type || 'image/png'] });
      });
    });
  });
}

function weryNameFrom(url, type) {
  var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[type] || 'jpg';
  if (!/^https?:/.test(url)) return 'image.' + ext;
  try {
    var base = decodeURIComponent(new URL(url).pathname.split('/').pop() || '').replace(/\.[^.]*$/, '');
    if (base) return base.slice(0, 80) + '.' + ext;
  } catch (e) {}
  return 'image.' + ext;
}
