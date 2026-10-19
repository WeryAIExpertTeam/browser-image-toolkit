/* WeryAI Image Toolkit · compression engine.
   Runs in a Web Worker (via importScripts) or on the main thread. */
(function (g) {
  'use strict';

  var QUALITY = { balanced: 0.8, quality: 0.9, small: 0.62 };

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function encode(canvas, type, q) {
    if (canvas.convertToBlob) return canvas.convertToBlob({ type: type, quality: q });
    return new Promise(function (res, rej) {
      canvas.toBlob(function (b) { b ? res(b) : rej(new Error('Encoding failed')); }, type, q);
    });
  }

  function hasAlpha(ctx, w, h) {
    var d = ctx.getImageData(0, 0, w, h).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  }

  function render(bmp, w, h, background) {
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    return { canvas: c, ctx: ctx };
  }

  function candidateTypes(srcType, alpha, format) {
    if (format && format !== 'auto') return [format];
    if (srcType === 'image/png') return alpha ? ['image/webp'] : ['image/webp', 'image/jpeg'];
    if (srcType === 'image/webp') return ['image/webp'];
    return ['image/jpeg'];
  }

  // Lower quality until the file fits targetKB; shrink the image if quality alone is not enough.
  async function fitTarget(bmp, w, h, type, targetBytes, bg) {
    var scale = 1, best = null;
    for (var round = 0; round < 6; round++) {
      var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
      var c = render(bmp, cw, ch, bg).canvas;
      var lo = 0.2, hi = 0.95, fit = null, smallest = null;
      for (var i = 0; i < 7; i++) {
        var q = (lo + hi) / 2;
        var b = await encode(c, type, q);
        if (!smallest || b.size < smallest.blob.size) smallest = { blob: b, w: cw, h: ch };
        if (b.size <= targetBytes) { fit = { blob: b, w: cw, h: ch }; lo = q; } else hi = q;
      }
      if (fit) return fit;
      best = smallest;
      scale *= 0.82;
    }
    return best;
  }

  /**
   * opts: { mode: 'balanced'|'quality'|'small', format: 'auto'|'image/jpeg'|'image/webp'|'image/png',
   *         maxSide: number (0 = keep), targetKB: number (0 = off) }
   * Returns { blob, type, width, height, kept } — kept=true means the original was already smaller.
   */
  async function compress(file, opts) {
    opts = opts || {};
    var original = opts.originalFile || file;
    var originalType = original.type || (/\.heif$/i.test(original.name || '') ? 'image/heif' : /\.heic$/i.test(original.name || '') ? 'image/heic' : file.type);
    var bmp = await createImageBitmap(file);
    var originalWidth = bmp.width, originalHeight = bmp.height;
    var w = bmp.width, h = bmp.height, resized = false;
    if (opts.maxSide > 0 && Math.max(w, h) > opts.maxSide) {
      var s = opts.maxSide / Math.max(w, h);
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      resized = true;
    }
    var base = render(bmp, w, h);
    var alpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif' ? hasAlpha(base.ctx, w, h) : false;
    var types = candidateTypes(file.type, alpha, opts.format);
    var q = QUALITY[opts.mode] || QUALITY.balanced;
    var best = null;

    for (var t = 0; t < types.length; t++) {
      var type = types[t];
      var bg = type === 'image/jpeg' && alpha ? '#ffffff' : null;
      var out;
      if (opts.targetKB > 0 && type !== 'image/png') {
        out = await fitTarget(bmp, w, h, type, opts.targetKB * 1024, bg);
      } else {
        var c = bg ? render(bmp, w, h, bg).canvas : base.canvas;
        out = { blob: await encode(c, type, q), w: w, h: h };
      }
      if (!best || out.blob.size < best.blob.size) best = out;
    }
    if (bmp.close) bmp.close();

    var forced = opts.format && opts.format !== 'auto';
    if (best.blob.size >= original.size) {
      return { blob: original, type: originalType, width: originalWidth, height: originalHeight, kept: true,
        constraintsSkipped: !!(resized || forced || original !== file),
        targetMet: !(opts.targetKB > 0) || original.size <= opts.targetKB * 1024 };
    }
    return { blob: best.blob, type: best.blob.type, width: best.w, height: best.h, kept: false,
      targetMet: !(opts.targetKB > 0) || best.blob.size <= opts.targetKB * 1024 };
  }

  g.WeryCompress = { compress: compress };
})(typeof self !== 'undefined' ? self : this);
