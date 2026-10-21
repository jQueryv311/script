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



(function addTNReginetTabs() {
  "use strict";

  if (location.hostname !== "tnreginet.gov.in") return;

  console.log("[AK Tabs] Script loaded");

  const ITEMS = [
    {
      id: "9000082",
      title: "Sub-Login Creation",
      action: function () {
        if (typeof window.loadMiddlePage === "function") {
          window.loadMiddlePage(
            -1,
            "web?requestType=ApplicationRH&actionVal=createSubLogin&screenId=7000001&menuCode=9000082&auditUSFlag=true"
          );
        }
      }
    },
    {
      id: "9000083",
      title: "User Profile Handling",
      action: function () {
        if (typeof window.loadMiddlePage === "function") {
          window.loadMiddlePage(
            -1,
            "web?requestType=ApplicationRH&actionVal=viewMakerCheckerForMaster&screenId=7000001&menuCode=9000083&auditUSFlag=true"
          );
        }
      }
    },
    {
      id: "90006979",
      title: "MIS Report",
      action: function () {
        if (
          typeof window.menuAct === "function" &&
          typeof window.showProgressbar === "function"
        ) {
          window.menuAct(
            "web?requestType=ApplicationRH&actionVal=viewMisReport&screenId=7000001&menuCode=90006979&auditUSFlag=true"
          );
          window.showProgressbar();
        }
      }
    }
  ];

  function insertTabs() {
    const home = document.getElementById("1195001");
    if (!home || !home.parentElement) return;

    const menu = home.parentElement;
    let next = home;

    ITEMS.forEach(function (item) {
      let li = document.getElementById(item.id);

      if (!li) {
        li = document.createElement("li");
        li.id = item.id;
        li.className = "menuitem_nodrop noactive";

        const a = document.createElement("a");
        a.href = "#";
        a.title = item.title;
        a.style.cursor = "pointer";
        a.textContent = item.title;

        a.addEventListener("click", function (e) {
          e.preventDefault();
          item.action();
        });

        li.appendChild(a);
      }

      // Ensure each item is in the Home menu, immediately after the previous item
      if (li.parentElement !== menu || li.previousElementSibling !== next) {
        next.insertAdjacentElement("afterend", li);
      }

      li.style.setProperty("display", "list-item", "important");
      li.style.setProperty("visibility", "visible", "important");

      next = li;
    });
  }

  function start() {
    insertTabs();

    const observer = new MutationObserver(function () {
      insertTabs();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.__stopTNReginetTabs = function () {
      observer.disconnect();
      delete window.__stopTNReginetTabs;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
