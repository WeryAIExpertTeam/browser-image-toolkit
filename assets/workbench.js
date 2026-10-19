(function () {
  const STORAGE_PREFIX = 'weryai.image-toolkit.active.';
  const pageId = decodeURIComponent(location.pathname.split('/').pop() || document.title || 'page');

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function currentTab() {
    return $('.nav-item.active')?.dataset?.tab || null;
  }

  function rememberTab(tab) {
    if (!tab) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + pageId, tab);
    } catch {
      // Ignore localStorage restrictions for file:// or privacy modes.
    }
  }

  function restoreTab() {
    let tab = null;
    try {
      tab = localStorage.getItem(STORAGE_PREFIX + pageId);
    } catch {
      tab = null;
    }
    if (!tab) return;
    const target = $(`.nav-item[data-tab="${CSS.escape(tab)}"]`);
    if (target && !target.classList.contains('active')) target.click();
  }

  function classifyLayout(pane) {
    const layout = $('.tool-3col, .tool-wide-params, .tool-canvas-major, .qr-cols', pane);
    if (!layout) return;
    layout.classList.add('workbench-layout');

    const children = Array.from(layout.children).filter(el => el.nodeType === 1);
    if (!children.length) return;

    children[0].classList.add('workbench-controls');
    if (children[1]) children[1].classList.add('workbench-workspace');

    if (pane.id === 'tab-qr') {
      children.forEach(child => child.classList.add('workbench-workspace'));
    }
  }

  function makePanelCollapsible(panel, collapsed) {
    const title = $('.panel-title', panel);
    if (!title || title.querySelector('.workbench-collapse-btn')) return;
    panel.classList.add('workbench-advanced');
    if (collapsed) panel.classList.add('is-collapsed');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'workbench-collapse-btn';
    button.title = 'Expand / collapse';
    button.textContent = collapsed ? '+' : '-';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      panel.classList.toggle('is-collapsed');
      button.textContent = panel.classList.contains('is-collapsed') ? '+' : '-';
    });
    title.appendChild(button);
  }

  function orderPanels(pane) {
    const controls = $('.workbench-controls', pane);
    if (!controls) return;

    const stack = $('.tool-stack', controls) || controls;
    const directPanels = $$('.panel', stack).filter(panel => panel.parentElement === stack);
    if (!directPanels.length) return;

    const sourcePanels = [];
    directPanels.forEach(panel => {
      panel.style.order = '';
      const isSource = panel.matches(':has(.dropzone), :has(.compare-grid), :has(.grid-slots), :has(input[type="file"])');
      const isPrompt = pane.id === 'tab-t2i' && panel.matches(':has(#t2i-prompt)');
      const isResultsInput = pane.id === 'tab-subscribe' && panel.matches(':has(#sub-content), :has(#sub-url)');
      if (isSource || isPrompt || isResultsInput) {
        panel.classList.add('workbench-source-panel');
        sourcePanels.push(panel);
      }
    });

    // Move source/material inputs to the real first position, not only visually.
    sourcePanels.reverse().forEach(panel => {
      if (stack.firstElementChild !== panel) stack.insertBefore(panel, stack.firstElementChild);
    });

    // Keep the first two controls visible; collapse later tuning/output panels.
    const ordered = $$('.panel', stack).filter(panel => panel.parentElement === stack);
    ordered.forEach((panel, index) => {
      const shouldCollapse = index >= 2 && !panel.classList.contains('workbench-source-panel');
      if (shouldCollapse) makePanelCollapsible(panel, true);
    });
  }

  function labelWorkspace(pane) {
    const workspace = $('.workbench-workspace', pane);
    if (!workspace) return;
    const hasPreview = workspace.matches('.preview, .qr-preview, .cover-stage') || $('.preview, .qr-preview, .cover-stage, canvas, video', workspace);
    if (hasPreview) workspace.classList.add('workbench-preview-zone');
    if ($('.logs', workspace)) workspace.classList.add('workbench-task-console');
  }

  function decoratePane(pane) {
    classifyLayout(pane);
    orderPanels(pane);
    labelWorkspace(pane);
  }

  function decorateActivePane() {
    const pane = $('.tab-pane.active');
    if (!pane) return;
    decoratePane(pane);
    rememberTab(currentTab());
  }

  function bindTabs() {
    $$('.nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => {
        requestAnimationFrame(decorateActivePane);
      });
    });
  }

  function init() {
    document.body.classList.add('workbench-app');
    $$('.tab-pane').forEach(decoratePane);
    bindTabs();
    restoreTab();
    decorateActivePane();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
