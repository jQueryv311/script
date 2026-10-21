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


(function addTNReginetMenuItems() {
  "use strict";

  if (location.hostname !== "tnreginet.gov.in") return;

  const menuItems = [
    {
      id: "9000082",
      title: "Sub-Login Creation",
      html: `<a style="cursor:pointer"
        title="Sub-Login Creation"
        onclick="loadMiddlePage(-1,'web?requestType=ApplicationRH&amp;actionVal=createSubLogin&amp;screenId=7000001&amp;menuCode=9000082&amp;auditUSFlag=true')">
        <span class="hiddenspanforlink">Go to&nbsp;</span>Sub-Login Creation<span class="hiddenspanforlink">&nbsp;page</span>
      </a>`
    },
    {
      id: "9000083",
      title: "User Profile Handling",
      html: `<a style="cursor:pointer"
        title="User Profile Handling"
        onclick="loadMiddlePage(-1,'web?requestType=ApplicationRH&amp;actionVal=viewMakerCheckerForMaster&amp;screenId=7000001&amp;menuCode=9000083&amp;auditUSFlag=true')">
        <span class="hiddenspanforlink">Go to&nbsp;</span>User Profile Handling<span class="hiddenspanforlink">&nbsp;page</span>
      </a>`
    },
    {
      id: "90006979",
      title: "MIS Report",
      html: `<a style="cursor:pointer"
        onclick="menuAct('web?requestType=ApplicationRH&amp;actionVal=viewMisReport&amp;screenId=7000001&amp;menuCode=90006979&amp;auditUSFlag=true');showProgressbar();"
        title="MIS Report" target="dataFrame">MIS Report</a>`
    }
  ];

  function addItems() {
    const home = document.getElementById("1195001");
    if (!home || !home.parentElement) return;

    const menu = home.parentElement;

    // Create or reuse the three actual menu items
    const items = menuItems.map(function (item) {
      let li = document.getElementById(item.id);

      if (!li) {
        li = document.createElement("li");
        li.id = item.id;
        li.className = "menuitem_nodrop noactive";
        li.innerHTML = item.html;
      }

      return li;
    });

    // Put them immediately after Home, before Registration
    const correct =
      home.nextElementSibling === items[0] &&
      items[0].nextElementSibling === items[1] &&
      items[1].nextElementSibling === items[2];

    if (!correct) {
      home.after(...items);
      console.log("TNREGINET: Three menu items inserted after Home.");
    }
  }

  function start() {
    addItems();

    // Retry whenever the site rebuilds the navigation menu
    const observer = new MutationObserver(function () {
      addItems();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.__stopTNReginetMenuObserver = function () {
      observer.disconnect();
      delete window.__stopTNReginetMenuObserver;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
