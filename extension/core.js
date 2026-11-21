export function webPage(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function withoutDirective(url) {
  return url.split(":~:")[0].replace(/#$/, "");
}

export function passageUrl(url, passage, prefix = "", suffix = "") {
  if (!webPage(url)) throw new Error("Unsupported source");
  const base = withoutDirective(url);
  if (!passage) return base;
  const encode = value => encodeURIComponent(value).replace(/-/g, "%2D");
  const words = passage.split(/\s+/u);
  const directive = words.length > 22
    ? encode(words.slice(0, 10).join(" ")) + "," + encode(words.slice(-10).join(" "))
    : encode(passage);
  return base + (base.includes("#") ? "" : "#") + ":~:text=" + (prefix ? encode(prefix) + "-," : "") + directive + (suffix ? ",-" + encode(suffix) : "");
}

// Chrome serializes this function for an isolated execution on the active page.
export function readPassage() {
  const clean = text => text.replace(/\s+/gu, " ").trim();
  const compact = text => {
    if (text.length <= 800) return text;
    return text.slice(0, 800).replace(/\s+\S*$/u, "");
  };
  if (document.contentType !== "text/html" && document.contentType !== "application/xhtml+xml") return null;
  const selection = window.getSelection();
  const selected = selection && !selection.isCollapsed ? clean(selection.toString()) : "";
  if (selected) {
    const range = selection.getRangeAt(0);
    const blockFor = node => (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest("p,li,blockquote,figcaption,h1,h2,h3,td");
    const startBlock = blockFor(range.startContainer);
    const endBlock = blockFor(range.endContainer);
    let prefix = "";
    let suffix = "";
    if (startBlock) {
      const before = range.cloneRange();
      before.selectNodeContents(startBlock);
      before.setEnd(range.startContainer, range.startOffset);
      prefix = clean(before.toString()).split(" ").slice(-4).join(" ").slice(-160);
    }
    const text = compact(selected);
    if (endBlock && text === selected) {
      const after = range.cloneRange();
      after.selectNodeContents(endBlock);
      after.setStart(range.endContainer, range.endOffset);
      suffix = clean(after.toString()).split(" ").slice(0, 4).join(" ").slice(0, 160);
    }
    return { text, prefix, suffix, kind: "Selected passage" };
  }
  // Pick the first readable block currently visible, favoring article text.
  const selectors = ["p,li,blockquote,figcaption", "h1,h2,h3,dt,td"];
  for (const selector of selectors) {
    const blocks = [...document.querySelectorAll(selector)].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth && rect.width > 20 && rect.height > 0 &&
        !element.closest('nav,header,footer,aside,[aria-hidden="true"],[hidden]') &&
        getComputedStyle(element).visibility === "visible" && (element.textContent || "").trim().length >= 6;
    });
    // Prefer the block whose text begins nearest the top of the viewport.
    blocks.sort((a, b) => Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top));
    const block = blocks[0];
    if (block) {
      const text = clean(block.innerText || "");
      if (text) return { text: text.split(" ").slice(0, 25).join(" ").slice(0, 800), kind: "Visible passage" };
    }
  }
  return { text: "", kind: "Page checkpoint" };
}
