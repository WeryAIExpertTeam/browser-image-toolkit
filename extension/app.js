// Handles "Compress image" from the right-click menu: app.html?src=<image url>.
(function () {
  var src = new URLSearchParams(location.search).get('src');
  if (!src) return;
  var box = document.getElementById('from-page'), btn = document.getElementById('fp-load');
  document.getElementById('fp-url').textContent = src.startsWith('data:') ? 'Embedded image' : src;
  // Do not request the source image before the user grants site access.
  document.getElementById('fp-thumb').src = 'icons/48.png';
  box.hidden = false;

  function nameFrom(url, type) {
    var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[type] || 'jpg';
    if (!/^https?:/.test(url)) return 'image.' + ext;
    try {
      var base = decodeURIComponent(new URL(url).pathname.split('/').pop() || '').replace(/\.[^.]*$/, '');
      if (base) return base.slice(0, 80) + '.' + ext;
    } catch (e) {}
    return 'image.' + ext;
  }

  // Reading a cross-site image needs permission for that site; ask only when the user clicks.
  btn.addEventListener('click', function () {
    var needs = /^https?:/.test(src) ? [new URL(src).origin + '/*'] : [];
    var ask = needs.length ? chrome.permissions.request({ origins: needs }) : Promise.resolve(true);
    btn.disabled = true;
    ask.then(function (ok) {
      if (!ok) throw new Error('Permission was not granted, so the image could not be read. Save it and drop the file here instead.');
      return fetch(src);
    }).then(function (r) {
      if (!r.ok) throw new Error('The site returned an error (' + r.status + '). Save the image and drop the file here instead.');
      return r.blob();
    }).then(function (b) {
      var c = window.WeryCompressor.instances[0];
      if (!c.add([new File([b], nameFrom(src, b.type), { type: b.type })])) throw new Error('This image format is not supported.');
      box.hidden = true;
      history.replaceState(null, '', location.pathname);
    }).catch(function (e) {
      btn.disabled = false;
      document.getElementById('fp-url').textContent = e.message;
      box.classList.add('is-error');
    });
  });
})();
