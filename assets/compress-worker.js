importScripts('compress-core.js');
self.onmessage = async function (e) {
  var d = e.data;
  try {
    var r = await self.WeryCompress.compress(d.file, d.opts);
    self.postMessage({ id: d.id, ok: true, result: r });
  } catch (err) {
    self.postMessage({ id: d.id, ok: false, error: String((err && err.message) || err) });
  }
};
