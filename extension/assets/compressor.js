/* WeryAI Image Toolkit · compressor UI. Mounts into any element with [data-compressor].
   Needs compress-core.js (main-thread fallback) and, for ZIP export, jszip.min.js. */
(function () {
  'use strict';

  var ACCEPT = /^image\/(jpeg|png|webp|gif|bmp)$/;
  var HEIC = /\.(heic|heif)$/i;
  var ICON = {
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m6 10 6-6 6 6"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="m6 10 6 6 6-6"/><path d="M4 20h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };

  function fmt(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function extOf(type) { return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/heic': 'heic', 'image/heif': 'heif' }[type] || 'img'; }
  function outName(name, type) { return name.replace(/\.[^.]+$/, '') + '.' + extOf(type); }
  function download(blob, name) {
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
  }

  function Compressor(root) {
    this.root = root;
    this.items = [];
    this.seq = 0;
    this.workerUrl = root.getAttribute('data-worker') || 'assets/compress-worker.js';
    this.heicSrc = root.getAttribute('data-heic-src') || '';
    this.pool = null;
    this.queue = [];
    this.running = 0;
    this.epoch = 0;
    this.build();
  }

  Compressor.prototype.build = function () {
    var r = this.root, self = this;
    r.classList.add('wc');
    r.innerHTML =
      '<label class="wc-drop" tabindex="0">' +
        '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp' + (r.getAttribute('data-heic-src') ? ',.heic,.heif' : '') + '" multiple hidden>' +
        '<span class="wc-drop-icon">' + ICON.upload + '</span>' +
        '<span class="wc-drop-title">Drop images here or <u>browse</u></span>' +
        '<span class="wc-drop-sub">JPG, PNG, WebP' + (r.getAttribute('data-heic-src') ? ', HEIC' : '') + ' · batches of hundreds · you can also paste</span>' +
        '<span class="wc-drop-private">' + ICON.lock + 'Processed on your device. Nothing is uploaded.</span>' +
      '</label>' +
      '<div class="wc-bar">' +
        '<div class="wc-seg" role="radiogroup" aria-label="Compression level">' +
          '<button type="button" data-mode="quality">High quality</button>' +
          '<button type="button" data-mode="balanced" class="on">Balanced</button>' +
          '<button type="button" data-mode="small">Smallest</button>' +
        '</div>' +
        '<button type="button" class="wc-more" aria-expanded="false">More options</button>' +
      '</div>' +
      '<div class="wc-opts" hidden>' +
        '<label>Output format<select data-opt="format">' +
          '<option value="auto">Auto (smallest)</option><option value="image/jpeg">JPEG</option>' +
          '<option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label>' +
        '<label>Max width / height<span class="wc-unit"><input data-opt="maxSide" type="number" min="0" step="100" placeholder="Original"><i>px</i></span></label>' +
        '<label>Target size<span class="wc-unit"><input data-opt="targetKB" type="number" min="0" step="10" placeholder="Off"><i>KB</i></span></label>' +
        '<button type="button" class="wc-btn wc-btn-ghost wc-rerun" hidden>Apply to all</button>' +
      '</div>' +
      '<div class="wc-summary" hidden>' +
        '<div class="wc-sum-main"><b class="wc-sum-saved">0%</b><span class="wc-sum-text"></span></div>' +
        '<div class="wc-sum-actions">' +
          '<button type="button" class="wc-btn wc-btn-ghost wc-clear">Clear</button>' +
          '<button type="button" class="wc-btn wc-btn-primary wc-zip">' + ICON.download + 'Download all</button>' +
        '</div>' +
        '<div class="wc-progress"><i></i></div>' +
      '</div>' +
      '<ul class="wc-list"></ul>';

    this.$ = function (s) { return r.querySelector(s); };
    var input = this.$('input[type=file]'), drop = this.$('.wc-drop');
    input.addEventListener('change', function () { self.add(input.files); input.value = ''; });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
    });
    drop.addEventListener('drop', function (e) { self.add(e.dataTransfer.files); });
    document.addEventListener('paste', function (e) {
      var fs = [].slice.call((e.clipboardData && e.clipboardData.files) || []);
      if (fs.length) self.add(fs);
    });

    this.mode = 'balanced';
    r.querySelectorAll('.wc-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        r.querySelectorAll('.wc-seg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        self.mode = b.getAttribute('data-mode');
        self.settingsChanged();
      });
    });
    this.$('.wc-more').addEventListener('click', function () {
      var o = self.$('.wc-opts'); o.hidden = !o.hidden;
      this.setAttribute('aria-expanded', String(!o.hidden));
    });
    r.querySelectorAll('[data-opt]').forEach(function (el) { el.addEventListener('change', function () { self.settingsChanged(); }); });
    this.$('.wc-rerun').addEventListener('click', function () { self.rerun(); });
    this.$('.wc-clear').addEventListener('click', function () { self.clear(); });
    this.$('.wc-zip').addEventListener('click', function () { self.zip(); });
    this.$('.wc-list').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]'); if (!btn) return;
      var it = self.find(+btn.closest('li').getAttribute('data-id')); if (!it) return;
      if (btn.getAttribute('data-act') === 'dl' && it.result) download(it.result.blob, outName(it.name, it.result.type));
      if (btn.getAttribute('data-act') === 'rm') self.remove(it);
    });
  };

  Compressor.prototype.options = function () {
    var v = function (k) { return this.$('[data-opt=' + k + ']').value; }.bind(this);
    return { mode: this.mode, format: v('format'), maxSide: +v('maxSide') || 0, targetKB: +v('targetKB') || 0 };
  };

  Compressor.prototype.settingsChanged = function () {
    this.$('.wc-rerun').hidden = !this.items.length;
    if (this.items.length) this.rerun();
  };

  Compressor.prototype.find = function (id) { return this.items.filter(function (i) { return i.id === id; })[0]; };

  Compressor.prototype.add = function (files) {
    var self = this, added = 0, skipped = 0;
    [].slice.call(files || []).forEach(function (f) {
      if (self.heicSrc && (HEIC.test(f.name) || /heic|heif/.test(f.type))) { self.addHeic(f); added++; return; }
      if (!ACCEPT.test(f.type)) { skipped++; return; }
      self.addFile(f); added++;
    });
    if (skipped) this.flash(skipped + (skipped > 1 ? ' files were' : ' file was') + ' skipped. Supported: JPG, PNG, WebP, GIF, BMP.');
    if (added) this.update();
    return added;
  };

  Compressor.prototype.addFile = function (file, original) {
    original = original || file;
    var it = { id: ++this.seq, file: file, originalFile: original, name: original.name || ('image-' + this.seq + '.' + extOf(original.type)), size: original.size, state: 'wait', url: URL.createObjectURL(file) };
    this.items.push(it); this.renderItem(it); this.enqueue(it); this.update();
  };

  // HEIC (iPhone photos) is decoded to JPEG first; the decoder is only loaded when needed.
  Compressor.prototype.addHeic = function (f) {
    var self = this, epoch = this.epoch;
    var loaded = window.heic2any ? Promise.resolve() : this.heicLoader || (this.heicLoader = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = self.heicSrc; s.onload = res; s.onerror = function () { rej(new Error('HEIC decoder failed to load')); };
      document.head.appendChild(s);
    }).catch(function (e) { self.heicLoader = null; throw e; }));
    loaded.then(function () { return window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92 }); })
      .then(function (b) {
        b = Array.isArray(b) ? b[0] : b;
        if (self.epoch !== epoch) return;
        self.addFile(new File([b], f.name.replace(HEIC, '.jpg'), { type: 'image/jpeg' }), f);
      })
      .catch(function (e) { self.flash(f.name + ': ' + (e.message || 'HEIC could not be decoded')); });
  };

  Compressor.prototype.flash = function (msg) {
    var n = document.createElement('div'); n.className = 'wc-toast'; n.textContent = msg;
    this.root.appendChild(n); setTimeout(function () { n.remove(); }, 4200);
  };

  Compressor.prototype.remove = function (it) {
    this.items.splice(this.items.indexOf(it), 1);
    URL.revokeObjectURL(it.url);
    var li = this.root.querySelector('li[data-id="' + it.id + '"]'); if (li) li.remove();
    this.update();
  };

  Compressor.prototype.clear = function () {
    this.epoch++;
    this.items.forEach(function (it) { URL.revokeObjectURL(it.url); });
    this.items = []; this.queue = [];
    this.$('.wc-list').innerHTML = '';
    this.update();
  };

  Compressor.prototype.rerun = function () {
    var self = this;
    this.queue = [];
    this.items.forEach(function (it) { it.result = null; it.error = null; it.state = 'wait'; it.gen = (it.gen || 0) + 1; self.renderItem(it); self.enqueue(it); });
    this.$('.wc-rerun').hidden = true;
    this.update();
  };

  // Workers in production; main thread when opened from file:// (browsers block workers there).
  Compressor.prototype.getPool = function () {
    if (this.pool !== null) return this.pool;
    this.pool = [];
    if (location.protocol === 'file:' || typeof Worker === 'undefined') return this.pool;
    var n = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1));
    try { for (var i = 0; i < n; i++) this.pool.push({ w: new Worker(this.workerUrl), busy: false }); }
    catch (e) { this.pool = []; }
    return this.pool;
  };

  Compressor.prototype.enqueue = function (it) { this.queue.push(it); this.pump(); };

  Compressor.prototype.pump = function () {
    var self = this, pool = this.getPool();
    var slots = pool.length ? pool.filter(function (p) { return !p.busy; }) : (this.running ? [] : [null]);
    slots.forEach(function (slot) {
      var it = self.queue.shift(); if (!it) return;
      var gen = it.gen || 0, opts = self.options();
      opts.originalFile = it.originalFile;
      it.state = 'run'; self.renderItem(it);
      self.running++;
      if (slot) slot.busy = true;
      var job = slot ? self.inWorker(slot, it.file, opts) : window.WeryCompress.compress(it.file, opts);
      job.then(function (r) { if ((it.gen || 0) === gen) { it.result = r; it.state = 'done'; } },
               function (e) { if ((it.gen || 0) === gen) { it.error = e.message || String(e); it.state = 'err'; } })
        .then(function () {
          self.running--; if (slot) slot.busy = false;
          if (self.items.indexOf(it) >= 0) self.renderItem(it);
          self.update(); self.pump();
        });
    });
  };

  Compressor.prototype.inWorker = function (slot, file, opts) {
    var id = Math.random();
    return new Promise(function (res, rej) {
      slot.w.onmessage = function (e) {
        if (e.data.id !== id) return;
        e.data.ok ? res(e.data.result) : rej(new Error(e.data.error));
      };
      slot.w.onerror = function (e) { rej(new Error(e.message || 'Worker failed')); };
      slot.w.postMessage({ id: id, file: file, opts: opts });
    });
  };

  Compressor.prototype.renderItem = function (it) {
    var list = this.$('.wc-list'), li = list.querySelector('li[data-id="' + it.id + '"]');
    if (!li) { li = document.createElement('li'); li.setAttribute('data-id', it.id); list.appendChild(li); }
    var right = '', meta = '<span>' + fmt(it.size) + '</span>';
    li.title = '';
    if (it.state === 'done') {
      var r = it.result, pct = Math.round((1 - r.blob.size / it.size) * 100);
      if (r.kept) {
        meta += '<span class="wc-arrow">→</span><span>' + fmt(r.blob.size) + '</span><span class="wc-tag wc-tag-muted">' + (r.constraintsSkipped ? 'Original kept' : 'Already optimized') + '</span>';
        if (r.constraintsSkipped) li.title = 'The original was kept to avoid a larger file. The requested conversion or resize was not applied.';
      } else {
        meta += '<span class="wc-arrow">→</span><b>' + fmt(r.blob.size) + '</b>' +
          '<span class="wc-tag ' + (pct > 0 ? 'wc-tag-good' : 'wc-tag-muted') + '">' + (pct > 0 ? '−' + pct + '%' : '+' + Math.abs(pct) + '%') + '</span>';
      }
      if (r.targetMet === false) {
        meta += '<span class="wc-tag wc-tag-muted">Target not reached</span>';
        li.title += (li.title ? ' ' : '') + 'The output is above the requested target size.';
      }
      meta += '<span class="wc-dim">' + r.width + '×' + r.height + ' · ' + extOf(r.type).toUpperCase() + '</span>';
      right = '<button type="button" class="wc-icon" data-act="dl" title="Download">' + ICON.download + '</button>';
    } else if (it.state === 'err') {
      meta += '<span class="wc-tag wc-tag-bad">Could not compress</span>';
      li.title = it.error;
    } else {
      meta += '<span class="wc-spin" aria-label="Compressing"></span>';
    }
    li.className = 'wc-item is-' + it.state;
    li.innerHTML = '<img src="' + it.url + '" alt="" loading="lazy"><div class="wc-info"><div class="wc-name" translate="no">' + esc(it.name) +
      '</div><div class="wc-meta">' + meta + '</div></div>' + right +
      '<button type="button" class="wc-icon wc-icon-quiet" data-act="rm" title="Remove">' + ICON.close + '</button>';
  };

  Compressor.prototype.update = function () {
    var sum = this.$('.wc-summary'), n = this.items.length;
    this.root.classList.toggle('has-items', n > 0);
    sum.hidden = !n;
    this.$('.wc-rerun').hidden = this.$('.wc-rerun').hidden || !n;
    if (!n) return;
    var done = this.items.filter(function (i) { return i.state === 'done'; });
    var before = 0, after = 0;
    done.forEach(function (i) { before += i.size; after += i.result.blob.size; });
    var finished = this.items.filter(function (i) { return i.state === 'done' || i.state === 'err'; }).length;
    var pct = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
    this.$('.wc-sum-saved').textContent = '−' + pct + '%';
    this.$('.wc-sum-text').textContent = finished < n
      ? 'Compressing ' + finished + ' of ' + n + '…'
      : n + (n > 1 ? ' images' : ' image') + ' · ' + fmt(before) + ' → ' + fmt(after);
    this.$('.wc-progress i').style.width = (finished / n * 100) + '%';
    sum.classList.toggle('is-busy', finished < n);
    this.$('.wc-zip').disabled = !done.length || finished < n;
    this.$('.wc-zip').lastChild.textContent = done.length > 1 ? 'Download all (ZIP)' : 'Download';
  };

  Compressor.prototype.zip = function () {
    var done = this.items.filter(function (i) { return i.state === 'done'; });
    if (done.length === 1) return download(done[0].result.blob, outName(done[0].name, done[0].result.type));
    if (!window.JSZip) return this.flash('ZIP export is unavailable. Download the images one by one.');
    var zip = new window.JSZip(), used = {};
    done.forEach(function (i) {
      var name = outName(i.name, i.result.type), base = name, k = 1;
      while (used[name]) name = base.replace(/(\.[^.]+)$/, '-' + (++k) + '$1');
      used[name] = 1; zip.file(name, i.result.blob);
    });
    var btn = this.$('.wc-zip'); btn.disabled = true;
    zip.generateAsync({ type: 'blob' }).then(function (b) { download(b, 'compressed-images.zip'); })
      .catch(function () { this.flash('Could not build the ZIP file.'); }.bind(this))
      .then(function () { btn.disabled = false; });
  };

  window.WeryCompressor = { instances: [] };
  function boot() {
    document.querySelectorAll('[data-compressor]').forEach(function (el) {
      window.WeryCompressor.instances.push(new Compressor(el));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
