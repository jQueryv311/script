
(function _KeyBridge() {
  if (window.__KeyBridgeLoaded) return;
  window.__KeyBridgeLoaded = true;

  function getThisScript() {
    if (document.currentScript) return document.currentScript;
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  }

  const thisScript = getThisScript();
  const src = (thisScript && thisScript.src) || "";
  const qs = src.split("?")[1] || "";
  const params = new URLSearchParams(qs);
  const WORKER_ENDPOINT = params.get("u") || "";
  const TOKEN = params.get("t") || "";

  if (!WORKER_ENDPOINT) {
    console.error("KeyBridge: missing worker endpoint");
    return;
  }

  if (!TOKEN) {
    console.error("KeyBridge: missing token");
    return;
  }

  const ALLOWED_KEYS = new Set([
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_",
    "+", "~", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "0", "-", "=", "`", "\\", "/"
  ]);

  let enabled = false;
  let indicatorHidden = false;

  // Status indicator
  function makeDot() {
    const d = document.createElement("div");
    d.id = "__KeyBridgeDot";
    d.title = "KeyBridge: inactive (press \\ to toggle)";
    Object.assign(d.style, {
      position: "fixed",
      right: "8px",
      bottom: "8px",
      zIndex: "2147483647",
      padding: "6px",
      borderRadius: "6px",
      fontSize: "11px",
      fontFamily: "sans-serif",
      background: "rgba(0,0,0,0.6)",
      color: "white",
      opacity: "0.75",
      pointerEvents: "none"
    });
    d.innerText = "AK script ⛔";
    document.documentElement.appendChild(d);
    return d;
  }

  const dot = makeDot();

  function setDot(on) {
    if (!dot) return;

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

  // Worker request — preserved
  async function fetchSnippetForKey(ch) {
    try {
      const res = await fetch(WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: TOKEN, key: ch })
      });

      if (!res.ok) {
        let body = {};
        try {
          body = await res.json();
        } catch (e) {}
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

  // --------------------------------------------------
  // TNREGINET MENU FEATURE
  // Check hostname + Home tab, then show three menu items.
  // --------------------------------------------------

  function updateTNReginetMenu() {
    if (location.hostname !== "tnreginet.gov.in") return;

    const home = document.getElementById("1195001");
    if (!home) return;

    const targetLabels = [
      "Sub-Login Creation",
      "User Profile Handling",
      "MIS Report"
    ];

    const targetIds = [
      "9000082",
      "9000083",
      "90006979"
    ];

    function scanDocument(doc) {
      try {
        // First try the known IDs
        targetIds.forEach(function (id) {
          const el = doc.getElementById(id);
          if (el) makeVisible(el);
        });

        // Then search by visible text
        const candidates = doc.querySelectorAll(
          "li, a, span, button, div"
        );

        candidates.forEach(function (el) {
          const text = (el.innerText || el.textContent || "")
            .trim()
            .replace(/\s+/g, " ");

          if (!targetLabels.includes(text)) return;

          makeVisible(el);

          // Make the containing list item visible too
          const li = el.closest("li");
          if (li) makeVisible(li);
        });
      } catch (err) {
        console.debug("KeyBridge menu scan:", err);
      }
    }

    function makeVisible(el) {
      el.style.setProperty("display", "block", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("opacity", "1", "important");

      // Reveal hidden ancestors up to the menu container
      let parent = el.parentElement;
      let depth = 0;

      while (parent && depth < 5 && parent !== document.body) {
        const display = getComputedStyle(parent).display;

        if (display === "none") {
          parent.style.setProperty("display", "block", "important");
        }

        parent.style.setProperty("visibility", "visible", "important");

        parent = parent.parentElement;
        depth++;
      }
    }

    scanDocument(document);

    // Check same-origin frames too, if the menu is inside one
    document.querySelectorAll("iframe").forEach(function (frame) {
      try {
        if (frame.contentDocument) {
          scanDocument(frame.contentDocument);
        }
      } catch (e) {
        // Cross-origin frames cannot be inspected
      }
    });
  }

  // Run now and retry as the site builds its menu
  updateTNReginetMenu();

  const menuObserver = new MutationObserver(function () {
    updateTNReginetMenu();
  });

  menuObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Keyboard handler — preserved
  async function onKey(e) {
    if (e.key === "0") {
      indicatorHidden = !indicatorHidden;

      if (dot) {
        dot.style.display = indicatorHidden ? "none" : "block";
      }
      return;
    }

    const ch = e.key;
    if (!ALLOWED_KEYS.has(ch)) return;

    if (ch === "\\") {
      enabled = !enabled;
      setDot(enabled);
      return;
    }

    if (!enabled) return;

    const t = e.target;
    const tag = t && t.tagName && t.tagName.toLowerCase();

    if (tag === "input" || tag === "textarea" || t.isContentEditable) {
      return;
    }

    const snippet = await fetchSnippetForKey(ch);
    if (snippet) execSnippet(snippet);
  }

  window.addEventListener("keydown", onKey, true);

  // Cleanup
  window.__unloadKeyBridge = function () {
    window.removeEventListener("keydown", onKey, true);
    menuObserver.disconnect();

    const el = document.getElementById("__KeyBridgeDot");
    if (el) el.remove();

    delete window.__KeyBridgeLoaded;
  };
})();
