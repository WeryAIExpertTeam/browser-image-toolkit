// Handles right-click images: app.html?src=<image url> (compress), plus &to=editor (send to WeryAI).
(function () {
  var params = new URLSearchParams(location.search);
  var src = params.get('src');
  if (!src) return;
  var toEditor = params.get('to') === 'editor';
  var box = document.getElementById('from-page'), btn = document.getElementById('fp-load');
  if (toEditor) {
    document.body.classList.add('is-editor-handoff');
    document.title = 'Send image to AI photo editor · WeryAI';
    document.querySelector('.logo-name').textContent = 'AI photo editor';
    document.getElementById('editor-intro').hidden = false;
    document.getElementById('editor-help').hidden = false;
    var sourceSite = 'the image source';
    try { sourceSite = new URL(src).hostname || sourceSite; } catch (e) {}
    document.getElementById('editor-source-site').textContent = sourceSite;
    btn.textContent = 'Send to AI photo editor';
    document.querySelector('#from-page b').textContent = 'Selected image';
    document.querySelector('.badge').textContent = 'AI editing · sends this image to WeryAI';
  }
  document.getElementById('fp-url').textContent = src.startsWith('data:') ? 'Embedded image' : src;
  // Do not request the source image before the user grants site access.
  document.getElementById('fp-thumb').src = 'icons/48.png';
  box.hidden = false;

  // Reading a cross-site image needs permission for that site; ask only when the user clicks.
  btn.addEventListener('click', function () {
    var needs = /^https?:/.test(src) ? [new URL(src).origin + '/*'] : [];
    var ask = needs.length ? chrome.permissions.request({ origins: needs }) : Promise.resolve(true);
    btn.disabled = true;
    if (toEditor) btn.textContent = 'Waiting for permission…';
    ask.then(function (ok) {
      if (!ok) throw new Error(toEditor ? 'Access was not granted. Try again, or choose a saved copy on WeryAI\'s editor.' : 'Permission was not granted, so the image could not be read. Save it and drop the file here instead.');
      if (toEditor) btn.textContent = 'Sending image…';
      return fetch(src);
    }).then(function (r) {
      if (!r.ok) throw new Error(toEditor ? 'The image source returned an error (' + r.status + '). Try again, or choose a saved copy on WeryAI\'s editor.' : 'The site returned an error (' + r.status + '). Save the image and drop the file here instead.');
      return r.blob();
    }).then(function (b) {
      if (toEditor) {
        if (!/^image\//.test(b.type)) throw new Error('This link is not an image. Save it and upload it on the editor page instead.');
        return werySendToEditor(b, weryNameFrom(src, b.type), 'app').then(function () {
          chrome.tabs.getCurrent(function (t) { if (t) chrome.tabs.remove(t.id); });
        });
      }
      var c = window.WeryCompressor.instances[0];
      if (!c.add([new File([b], weryNameFrom(src, b.type), { type: b.type })])) throw new Error('This image format is not supported.');
      box.hidden = true;
      history.replaceState(null, '', location.pathname);
    }).catch(function (e) {
      btn.disabled = false;
      if (toEditor) btn.textContent = 'Try again';
      document.getElementById('fp-url').textContent = e.message;
      box.classList.add('is-error');
    });
  });
})();
