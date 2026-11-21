import { passageUrl, webPage, withoutDirective } from "./core.js";

async function matchingTab(id, url, windowId) {
  try {
    const tab = await chrome.tabs.get(id);
    // A tab ID can now contain unrelated work. Only reuse a verified page.
    if (tab.windowId === windowId && webPage(tab.url) && withoutDirective(tab.url) === url) return tab;
  } catch {
    // A closed tab will be reopened.
  }
  return null;
}

async function resume(windowId) {
  const { checkpoint } = await chrome.storage.local.get("checkpoint");
  if (!checkpoint || !webPage(checkpoint.source.url)) return false;
  const { previousRestore } = await chrome.storage.session.get("previousRestore");
  const known = previousRestore?.key === checkpoint.key ? previousRestore.tabs : {};
  const tabs = {};
  for (const source of checkpoint.related) {
    if (!webPage(source.url)) continue;
    const existing = await matchingTab(known[source.url] ?? source.id, source.url, windowId);
    const restored = existing || await chrome.tabs.create({ url: source.url, active: false, windowId });
    tabs[source.url] = restored.id;
  }
  const source = checkpoint.source;
  const existing = await matchingTab(known[source.url] ?? source.id, source.url, windowId);
  const url = passageUrl(source.url, checkpoint.passage, checkpoint.prefix, checkpoint.suffix);
  const restored = existing
    ? await chrome.tabs.update(existing.id, { url, active: true })
    : await chrome.tabs.create({ url, active: true, windowId });
  tabs[source.url] = restored.id;
  await chrome.storage.session.set({ previousRestore: { key: checkpoint.key, tabs } });
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.type !== "resume" || !Number.isInteger(message.windowId) || sender.url !== chrome.runtime.getURL("popup.html")) return;
  resume(message.windowId).then(ok => reply({ ok }), () => reply({ ok: false }));
  return true;
});
