// Toolbar button and right-click menu. Compression happens in app.html.
importScripts('handoff.js');
const APP = chrome.runtime.getURL('app.html');
const WERY = 'https://www.wery.ai/en/@Zeny-Design-AI-Expert-Workspace/';
const UTM = '?utm_source=chrome_extension&utm_medium=context_menu&utm_campaign=image_compressor';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'compress', title: 'Compress image', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'sep', type: 'separator', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'bg', title: 'Remove background with WeryAI ↗', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'edit', title: 'Edit photo with AI (WeryAI) ↗', contexts: ['image'] });
  });
});

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: APP }));

function onMenuClick(info) {
  if (info.menuItemId === 'compress') {
    chrome.tabs.create({ url: APP + '?src=' + encodeURIComponent(info.srcUrl || '') });
  } else if (info.menuItemId === 'bg') {
    chrome.tabs.create({ url: WERY + 'ai-background-remover' + UTM });
  } else if (info.menuItemId === 'edit') {
    // Try to read the image directly (works for data: URLs and CORS-enabled hosts).
    // Otherwise the app asks for access to that site, then sends the image on.
    const src = info.srcUrl || '';
    fetch(src).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    }).then((b) => {
      if (!/^image\//.test(b.type)) throw new Error('not an image');
      return b;
    }).then(
      (b) => werySendToEditor(b, weryNameFrom(src, b.type), 'context_menu'),
      () => chrome.tabs.create({ url: APP + '?src=' + encodeURIComponent(src) + '&to=editor' })
    );
  }
}
chrome.contextMenus.onClicked.addListener(onMenuClick);
