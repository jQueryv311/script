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
  let indicatorHidden = false;
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
    d.innerText = "AK script ⛔";
    document.documentElement.appendChild(d);
    return d;
  }

  const dot = makeDot();
  function setDot(on){
  if(!dot) return;

  if (indicatorHidden) {
    dot.style.display = "none";
    return;
  }

  dot.style.display = "block";
  dot.innerText = on ? "AK script ✅" : "AK script ⛔";
  dot.title = on
    ? "KeyBridge: active (press \\ to toggle)"
    : "KeyBridge: inactive (press \\ to toggle)";
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
    // Toggle KB indicator visibility with "0"
      if (e.key === "0") {
        indicatorHidden = !indicatorHidden;
      
        if (dot) {
          dot.style.display = indicatorHidden ? "none" : "block";
        }
        return;
      }

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

(function () {
  "use strict";

  if (location.hostname !== "tnreginet.gov.in") return;

  const MENU_ID = "akQuickMenu";

  function createQuickMenu() {
    // Wait until Home tab exists
    if (!document.getElementById("1195001")) return;

    // Avoid duplicate buttons
    if (document.getElementById(MENU_ID)) return;

    if (!document.body) return;

    if (!document.getElementById("akQuickMenuStyle")) {
      const style = document.createElement("style");
      style.id = "akQuickMenuStyle";
      style.textContent = `
        #akQuickMenu {
          position: fixed;
          right: 18px;
          top: 100px;
          z-index: 2147483646;
          font: 14px Arial, sans-serif;
        }
        #akQuickMenuToggle {
          padding: 12px 16px;
          background: #174ea6;
          color: white;
          border: 0;
          border-radius: 7px;
          cursor: pointer;
        }
        #akQuickMenuPanel {
          display: none;
          margin-top: 8px;
          padding: 10px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 7px;
          box-shadow: 0 4px 12px #0003;
          min-width: 210px;
        }
        #akQuickMenuPanel button {
          display: block;
          width: 100%;
          margin: 5px 0;
          padding: 10px;
          text-align: left;
          background: #f2f5fa;
          border: 1px solid #d5dce8;
          border-radius: 5px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    const box = document.createElement("div");
    box.id = MENU_ID;

    const toggle = document.createElement("button");
    toggle.id = "akQuickMenuToggle";
    toggle.type = "button";
    toggle.textContent = "Quick Menu ☰";

    const panel = document.createElement("div");
    panel.id = "akQuickMenuPanel";

    [
      "Sub-Login Creation",
      "User Profile Handling",
      "MIS Report"
    ].forEach(function (label) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;

      button.addEventListener("click", function () {
        alert(
          label +
          ": button created. The actual page destination " +
          "has not been configured."
        );
      });

      panel.appendChild(button);
    });

    toggle.addEventListener("click", function () {
      panel.style.display =
        panel.style.display === "block" ? "none" : "block";
    });

    box.append(toggle, panel);
    document.body.appendChild(box);

    console.log("KeyBridge: Quick Menu displayed");
  }

  function ensureQuickMenu() {
    if (document.readyState === "loading" || !document.body) return;
    createQuickMenu();
  }

  // Initial display
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureQuickMenu);
  } else {
    ensureQuickMenu();
  }

  // Recreate it when the site replaces page elements
  const observer = new MutationObserver(function () {
    ensureQuickMenu();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Optional cleanup for your existing KeyBridge unload function
  window.__unloadQuickMenuObserver = function () {
    observer.disconnect();
    document.getElementById(MENU_ID)?.remove();
    document.getElementById("akQuickMenuStyle")?.remove();
    delete window.__unloadQuickMenuObserver;
  };
})();
