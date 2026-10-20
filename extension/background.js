// Toolbar button and right-click menu. All image work happens in app.html.
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

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'compress') {
    chrome.tabs.create({ url: APP + '?src=' + encodeURIComponent(info.srcUrl || '') });
  } else if (info.menuItemId === 'bg') {
    chrome.tabs.create({ url: WERY + 'ai-background-remover' + UTM });
  } else if (info.menuItemId === 'edit') {
    chrome.tabs.create({ url: WERY + 'ai-photo-editor' + UTM });
  }
});
