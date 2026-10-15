async function saveFile() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  return saveCapturedTab(tab, !tab.path);
}

async function saveFileAs() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  return saveCapturedTab(tab, true);
}

async function saveCapturedTab(tab, choosePath) {
  if (tab.saving) { await showAlert('该标签正在保存，请稍后再试。'); return; }
  saveTabState(tab.id);
  const captured = { id: tab.id, revision: tab.revision, content: tab.content,
    format: { ...tab.format }, path: tab.path, sha256: tab.sha256 };
  tab.saving = true;
  try {
    if (choosePath) {
      const selected = await ipcRenderer.invoke('dialog:saveFile');
      if (selected.canceled || !selected.filePath) return;
      if (!tabs.includes(tab)) return;
      captured.path = selected.filePath;
      captured.sha256 = selected.expectedSha;
    }
    const result = await ipcRenderer.invoke('file:write', captured.path,
      captured.content, captured.format, captured.sha256);
    if (!result.success) { await showAlert('保存失败: ' + result.error); return; }
    if (!tabs.includes(tab)) return;
    tab.path = captured.path;
    tab.name = path.basename(captured.path);
    tab.sha256 = result.sha256;
    tab.format = result.format;
    // Editing during the await stays dirty. A switch never clears another tab.
    markTabModified(captured.id, tab.revision !== captured.revision);
    if (activeTabId === captured.id) updateFileStatus(tab);
  } finally { tab.saving = false; }
}

// ========== 查找替换
