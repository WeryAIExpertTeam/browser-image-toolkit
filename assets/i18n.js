/* English is the source language; translate UI copy, never user filenames. */
(() => {
  const pairs = Object.entries(window.TOOLKIT_TRANSLATIONS || {});
  const dictionary = Object.fromEntries(pairs.map(([zh, en]) => [en, zh]));
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const enPattern = new RegExp(Object.keys(dictionary).sort((a,b) => b.length-a.length).map(escape).join('|'), 'g');
  const originals = new WeakMap();
  const attrs = new WeakMap();
  const toggle = document.getElementById('language-toggle');
  let language = 'en';
  try { if (localStorage.getItem('weryai.toolkit.language') === 'zh-CN') language = 'zh-CN'; } catch {}

  function translate(text) {
    if (language === 'en') return text;
    return text
      .replace(/Processing (\d+)\/(\d+)/g, '处理中 $1/$2')
      .replace(/Finished with (\d+) error\(s\)/g, '处理结束，$1 个错误')
      .replace(/Added (\d+) files/g, '已添加 $1 个文件')
      .replace(/Adding (\d+) images…/g, '正在添加 $1 张图片…')
      .replace(/Compression failed: /g, '压缩失败：')
      .replace(/Done · /g, '完成 · ')
      .replace(enPattern, en => dictionary[en]);
  }
  function render() {
    observer.disconnect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement || node.parentElement.closest('script, style, textarea, [translate="no"], #language-toggle')) continue;
      const old = originals.get(node);
      const source = old && node.nodeValue === old.rendered ? old.source : node.nodeValue;
      const rendered = translate(source);
      originals.set(node, {source, rendered});
      if (node.nodeValue !== rendered) node.nodeValue = rendered;
    }
    document.querySelectorAll('[title], [placeholder], [aria-label]').forEach(el => {
      if (el === toggle || el.closest('[translate="no"]')) return;
      const saved = attrs.get(el) || {};
      ['title', 'placeholder', 'aria-label'].forEach(name => {
        if (!el.hasAttribute(name)) return;
        const value = el.getAttribute(name), old = saved[name];
        const source = old && old.rendered === value ? old.source : value;
        const rendered = translate(source);
        saved[name] = {source, rendered};
        if (value !== rendered) el.setAttribute(name, rendered);
      });
      attrs.set(el, saved);
    });
    document.documentElement.lang = language;
    toggle.textContent = language === 'en' ? '中文' : 'English';
    toggle.setAttribute('aria-label', language === 'en' ? 'Switch to Chinese' : '切换为英文');
    observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['title','placeholder','aria-label']});
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  });
  toggle.addEventListener('click', () => {
    language = language === 'en' ? 'zh-CN' : 'en';
    try { localStorage.setItem('weryai.toolkit.language', language); } catch {}
    render();
  });
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
  document.querySelectorAll('.field .lbl').forEach(label => {
    const field = label.closest('.field').querySelector('input:not([type=checkbox]), select, textarea');
    if (field?.id) label.setAttribute('for', field.id);
  });
  render();
})();
