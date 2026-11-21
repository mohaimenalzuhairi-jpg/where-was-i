const get = id => document.getElementById(id);
function show(checkpoint) {
  get("note").textContent = checkpoint?.note || "Open Where Was I? on a web page to save a checkpoint.";
  get("quote").textContent = checkpoint?.passage || "";
  get("quote").hidden = !checkpoint?.passage;
  get("source").textContent = checkpoint?.source?.title || "";
}
show((await chrome.storage.local.get("checkpoint")).checkpoint);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.checkpoint) show(changes.checkpoint.newValue);
});
