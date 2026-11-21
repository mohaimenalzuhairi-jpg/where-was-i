import { readPassage, webPage, withoutDirective } from "./core.js";

const get = id => document.getElementById(id);
let checkpoint;
let currentTab;
let capture;
let related = [];
let busy = false;

function status(message) {
  get("status").textContent = message;
}

function summarize(tab) {
  const url = withoutDirective(tab.url);
  return { id: tab.id, url, title: tab.title || new URL(url).hostname };
}

function savedView() {
  get("editor").hidden = true;
  get("saved").hidden = false;
  get("saved-note").textContent = checkpoint.note;
  get("saved-quote").textContent = checkpoint.passage;
  get("saved-quote").hidden = !checkpoint.passage;
  const count = checkpoint.related.length;
  get("saved-source").textContent = checkpoint.source.title + (count ? " · " + count + " related tab" + (count === 1 ? "" : "s") : "");
}

async function edit() {
  get("editor").hidden = false;
  get("saved").hidden = true;
  get("cancel").hidden = !checkpoint;
  get("choices").hidden = true;
  get("choice-list").replaceChildren();
  get("note").value = "";
  get("source").textContent = "";
  get("preview").textContent = "Reading the current page…";
  get("capture-label").textContent = "Current passage";
  get("save").disabled = true;
  get("choose").disabled = true;
  capture = null;
  related = [];
  status("");
  try {
    [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!webPage(currentTab?.url)) throw new Error();
    const [result] = await chrome.scripting.executeScript({ target: { tabId: currentTab.id }, func: readPassage });
    if (!result?.result) throw new Error();
    capture = result.result;
    get("preview").textContent = capture.text || "This page has no visible passage. Its link can still be saved.";
    get("capture-label").textContent = capture.kind;
    get("source").textContent = currentTab.title || new URL(currentTab.url).hostname;
    get("save").disabled = false;
    get("choose").disabled = false;
  } catch {
    get("preview").textContent = "Open a regular web page, highlight a passage, and reopen the extension.";
    get("capture-label").textContent = "Page unavailable";
  }
}

get("choose").addEventListener("click", async () => {
  try {
    const allowed = await chrome.permissions.request({ permissions: ["tabs"] });
    if (!allowed) {
      status("The checkpoint can still be saved without related tabs.");
      return;
    }
    const tabs = await chrome.tabs.query({ windowId: currentTab.windowId });
    const seen = new Set([withoutDirective(currentTab.url)]);
    related = [];
    const list = get("choice-list");
    list.replaceChildren();
    for (const tab of tabs) {
      if (!webPage(tab.url)) continue;
      const item = summarize(tab);
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      related.push(item);
      const label = document.createElement("label");
      label.className = "tab-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = String(item.id);
      label.append(input, document.createTextNode(item.title));
      list.append(label);
    }
    get("choices").hidden = !related.length;
    status(related.length ? "Only checked tabs will be saved." : "No other web pages are open in this window.");
  } catch {
    status("Chrome could not list these tabs. You can still save the current page.");
  }
});

get("editor").addEventListener("submit", async event => {
  event.preventDefault();
  const note = get("note").value.trim();
  if (!note) {
    get("note").focus();
    status("Write a short reminder of what to do next.");
    return;
  }
  if (!capture || busy) return;
  busy = true;
  get("save").disabled = true;
  const checked = new Set([...get("choice-list").querySelectorAll("input:checked")].map(input => Number(input.value)));
  const next = { key: crypto.randomUUID(), source: summarize(currentTab), passage: capture.text, prefix: capture.prefix || "", suffix: capture.suffix || "", note, related: related.filter(tab => checked.has(tab.id)) };
  try {
    await chrome.storage.local.set({ checkpoint: next });
    checkpoint = next;
    savedView();
    status("Checkpoint saved.");
  } catch {
    status("Chrome could not save the checkpoint. Your draft is still here.");
  } finally {
    busy = false;
    get("save").disabled = false;
  }
});

get("resume").addEventListener("click", async () => {
  if (busy || !checkpoint) return;
  busy = true;
  get("resume").disabled = true;
  try {
    // The worker finishes the restore even if Chrome closes this popup.
    const restore = chrome.runtime.sendMessage({ type: "resume", windowId: currentTab.windowId });
    const panel = chrome.sidePanel.open({ windowId: currentTab.windowId }).catch(() => {});
    const result = await restore;
    await panel;
    status(result?.ok ? "Checkpoint opened." : "Chrome could not open this checkpoint. Try again in a regular window.");
  } catch {
    status("Chrome could not open this checkpoint. Try again in a regular window.");
  } finally {
    busy = false;
    get("resume").disabled = false;
  }
});

get("replace").addEventListener("click", edit);
get("cancel").addEventListener("click", () => { savedView(); status(""); });
get("forget").addEventListener("click", async () => {
  try {
    await Promise.all([chrome.storage.local.remove("checkpoint"), chrome.storage.session.remove("previousRestore")]);
    checkpoint = null;
    await edit();
    status("Checkpoint deleted.");
  } catch {
    status("Chrome could not delete this checkpoint.");
  }
});

try {
  [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  ({ checkpoint } = await chrome.storage.local.get("checkpoint"));
  if (checkpoint) savedView();
  else await edit();
} catch {
  status("Chrome could not open your checkpoint. Reopen the extension to try again.");
}
