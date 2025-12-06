// remote.js - KeyBridge client
// Reads worker URL (?u=...) and token (?t=...) from the script src query.
// Host this file publicly (GitHub) and reference via jsDelivr in the bookmarklet.

(function _KeyBridge(){
  if (window.__KeyBridgeLoaded) return;
  window.__KeyBridgeLoaded = true;

  function getThisScript(){
    if (document.currentScript) return document.currentScript;
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }

  const thisScript = getThisScript();
  const src = (thisScript && thisScript.src) || "";
  const qs = src.split('?')[1] || "";
  const params = new URLSearchParams(qs);
  const WORKER_ENDPOINT = params.get('u') || "";
  const TOKEN = params.get('t') || "";

  if (!WORKER_ENDPOINT) {
    console.error("KeyBridge: missing worker endpoint (pass ?u=WORKER_URL in script src)");
    return;
  }
  if (!TOKEN) {
    console.error("KeyBridge: missing token (pass ?t=TOKEN in script src)");
    return;
  }

  const ALLOWED_KEYS = new Set(["!","@","#","$","%","^","&","*","(",")","_","+","~",
                                "1","2","3","4","5","6","7","8","9","0","-","=","`","\\","/"]);

  let enabled = false; // start disabled

  // tiny status indicator
  function makeDot(){
    const d = document.createElement("div");
    d.id = "__KeyBridgeDot";
    d.title = "KeyBridge: inactive (press \\ to toggle)";
    d.style.position = "fixed";
    d.style.right = "8px";
    d.style.bottom = "8px";
    d.style.zIndex = 2147483647;
    d.style.padding = "6px";
    d.style.borderRadius = "6px";
    d.style.fontSize = "11px";
    d.style.fontFamily = "sans-serif";
    d.style.background = "rgba(0,0,0,0.6)";
    d.style.color = "white";
    d.style.opacity = "0.75";
    d.style.pointerEvents = "none";
    d.innerText = "KB ⛔";
    document.documentElement.appendChild(d);
    return d;
  }
  const dot = makeDot();
  function setDot(on){
    if(!dot) return;
    dot.innerText = on ? "KB ✅" : "KB ⛔";
    dot.title = on ? "KeyBridge: active (press \\ to toggle)" : "KeyBridge: inactive (press \\ to toggle)";
  }

  async function fetchSnippetForKey(ch) {
    try {
      const res = await fetch(WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: TOKEN, key: ch })
      });
      if (!res.ok) {
        let body = {};
        try { body = await res.json(); } catch(e){}
        console.warn("KeyBridge server error", res.status, body);
        return null;
      }
      const j = await res.json();
      if (j && j.ok && j.code) return j.code;
      console.warn("KeyBridge: unexpected response", j);
      return null;
    } catch (err) {
      console.warn("KeyBridge fetch error", err);
      return null;
    }
  }

  function execSnippet(code) {
    try {
      const fn = new Function(code);
      fn();
    } catch (e) {
      console.warn("KeyBridge exec error:", e);
    }
  }

  async function onKey(e) {
    const ch = e.key;
    if (!ALLOWED_KEYS.has(ch)) return;

    // toggle activation on backslash
    if (ch === "\\") {
      enabled = !enabled;
      setDot(enabled);
      return;
    }

    if (!enabled) return;

    // avoid typing interference
    const t = e.target;
    const tag = t && t.tagName && t.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || t.isContentEditable) return;

    const snippet = await fetchSnippetForKey(ch);
    if (snippet) execSnippet(snippet);
  }

  window.addEventListener("keydown", onKey, true);

  // allow unload
  window.__unloadKeyBridge = function(){
    window.removeEventListener("keydown", onKey, true);
    const el = document.getElementById("__KeyBridgeDot");
    if (el) el.remove();
    delete window.__KeyBridgeLoaded;
  };

})();
