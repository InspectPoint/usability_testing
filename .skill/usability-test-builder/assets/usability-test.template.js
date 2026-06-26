/* usability-test.js — self-contained unmoderated usability-test harness (TEMPLATE).
   Layers a task panel, click/time/success logging, and an end survey on TOP of an
   existing interactive prototype WITHOUT modifying the prototype's own code.

   IDENTITY + ABANDONMENT
   ----------------------
   - Each participant gets a unique link with ?pid=<their-id> — the harness records it so
     you can map a result back to the person you sent that link to.
   - The intro also asks for a name (set COLLECT_NAME=false to skip).
   - Progress is reported as it happens (start → each task → finish) PLUS a "leaving" beacon
     if they close the tab, so abandoned sessions are captured with a status and the last
     task they reached — not lost. The server keeps the latest state per session.

   HOW TO USE: edit the CONFIG block (RESULTS_ENDPOINT, TEST_NAME, BRAND, TASKS, SURVEY),
   then add <script src="usability-test.js"></script> as the LAST script in a COPY of the
   prototype's HTML named "<Prototype> — Test.html". Never edit the original prototype. */
(function () {
  "use strict";

  /* ─────────────────────────── CONFIG — EDIT THIS ─────────────────────────── */

  var RESULTS_ENDPOINT = "https://inspectpoint-usability-results.fly.dev/api/results";
  var TEST_NAME = "Untitled test";   // labels every result row; keep stable across reruns
  var COLLECT_NAME = true;           // ask the participant's name on the intro screen
  var BRAND = { primary: "#3D1B9D", accent: "#EA6952", appName: "Inspect Point" };
  var SUCCESS_TOAST_SELECTOR = ".qmb-ui-toast--success"; // for success type "toast"

  var TASKS = [
    { id: "task1", label: "Task 1", scenario: "Scenario in the participant's words. <b>No button names.</b>", hint: "", success: { type: "manual" } },
    { id: "task2", label: "Task 2", scenario: "Second scenario.", hint: "", success: { type: "manual" } }
  ];

  var SURVEY = [
    { name: "ease", type: "scale", label: "Overall, how easy or hard was it to do those tasks?", low: "Very hard", high: "Very easy" },
    { name: "comprehension", type: "text", label: "In your own words, what was this screen for / how did the main pieces relate?" },
    { name: "unexpected", type: "text", label: "Did anything work differently than you expected? If so, what?" },
    { name: "confidence", type: "scale", label: "How confident are you that you did the tasks correctly?", low: "Not at all", high: "Very confident" }
  ];

  /* ──────────────────────── END CONFIG — engine below ─────────────────────── */

  var PURPLE = BRAND.primary, CORAL = BRAND.accent;
  function qparam(k) { try { return new URLSearchParams(window.location.search).get(k) || ""; } catch (e) { return ""; } }

  var session = {
    sessionId: "s-" + Date.now() + "-" + Math.floor(Math.random() * 1e6),
    pid: qparam("pid"),
    participantName: "",
    test: TEST_NAME,
    status: "in-progress",
    lastTaskReached: "",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    userAgent: navigator.userAgent,
    tasks: [],
    survey: {}
  };
  var current = -1, taskStart = 0, finished = false;
  function rec() { return session.tasks[current]; }

  // ── send current snapshot to the server ──
  function send(status, useBeacon) {
    if (!RESULTS_ENDPOINT) return;
    session.status = status;
    var body = JSON.stringify(session);
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(RESULTS_ENDPOINT, new Blob([body], { type: "text/plain;charset=utf-8" }));
      } else {
        fetch(RESULTS_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body, keepalive: true });
      }
    } catch (e) {}
  }
  // if they leave before finishing, record it as abandoned with how far they got
  function onLeave() { if (!finished && current >= 0) send("abandoned", true); }
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") onLeave(); });

  // ── click logging ──
  function ownText(node) {
    var t = ""; for (var i = 0; i < node.childNodes.length; i++) { var c = node.childNodes[i]; if (c.nodeType === 3) t += c.textContent; }
    return t.replace(/\s+/g, " ").trim();
  }
  function labelFor(el) {
    var node = el.closest("[data-track], button, a, [role=button], [class*=tab], [class*=inline-edit], input, select, textarea, li");
    if (!node) return null;
    // explicit signal wins: data-track set in the design, else aria-label/title
    var lab = node.getAttribute("data-track") || node.getAttribute("aria-label") || node.getAttribute("title");
    if (lab) return lab.replace(/\s+/g, " ").trim().slice(0, 60);
    var tag = node.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      return (node.getAttribute("placeholder") || node.value || node.getAttribute("name") || tag).toString().replace(/\s+/g, " ").trim().slice(0, 40) || tag;
    }
    // prefer a primary name/title child over concatenated descendant text (skips blurbs/option lists)
    var primary = node.querySelector('[class*="__name"], [class*="__title"], [class*="-heading"], [class*="__label"]');
    var txt = ((primary ? primary.textContent : ownText(node)) || node.textContent || "").replace(/\s+/g, " ").trim();
    // If a tagged dropdown/control is open and this click is choosing its value (an option in a
    // popup), attribute it to that control so the path reads "control = value" — not a bare value.
    var openCtl = document.querySelector('[data-track][aria-expanded="true"]');
    if (openCtl && openCtl !== node && !el.closest('[aria-expanded="true"]') && txt) {
      return (openCtl.getAttribute("data-track") + " = " + txt).slice(0, 70);
    }
    return txt.slice(0, 50) || tag;
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("#iput-root")) return;
    var r = rec(); if (!r || r.done) return;
    var l = labelFor(e.target); r.clicks++; if (l) r.path.push(l);
  }, true);

  // ── success detection ──
  function matches(rule, node) {
    if (!rule) return false;
    if (rule.type === "toast") {
      var t = node.matches && node.matches(SUCCESS_TOAST_SELECTOR) ? node : node.querySelector && node.querySelector(SUCCESS_TOAST_SELECTOR);
      if (!t) return false;
      return rule.match ? rule.match.test((t.textContent || "").trim()) : true;
    }
    if (rule.type === "selector") return (node.matches && node.matches(rule.match)) || (node.querySelector && !!node.querySelector(rule.match));
    if (rule.type === "text") return (document.body.innerText || "").indexOf(rule.match) !== -1;
    return false;
  }
  var observer = new MutationObserver(function (muts) {
    var r = rec(); if (!r || r.done) return;
    var rule = TASKS[current].success; if (rule.type === "manual") return;
    for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) {
      var n = muts[i].addedNodes[j];
      if (n.nodeType === 1 && matches(rule, n)) { completeTask(true, rule.type); return; }
    }
  });

  // ── DOM helpers ──
  function el(tag, attrs, html) { var n = document.createElement(tag); if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]); if (html != null) n.innerHTML = html; return n; }
  function root() { var r = document.getElementById("iput-root"); if (!r) { r = el("div", { id: "iput-root" }); document.body.appendChild(r); } return r; }
  function clearOverlay() { var o = document.getElementById("iput-overlay"); if (o) o.remove(); }
  function overlay(inner) { clearOverlay(); var o = el("div", { id: "iput-overlay", class: "iput-overlay" }); var c = el("div", { class: "iput-card" }); c.appendChild(inner); o.appendChild(c); root().appendChild(o); return o; }

  // ── task banner ──
  var banner;
  // The bar is DOCKED at the bottom: keep --iput-bar synced to its height so the app
  // and any fixed overlays reserve space and nothing is hidden behind the bar.
  function syncBarHeight() {
    var h = (banner && banner.isConnected) ? banner.offsetHeight : 0;
    document.documentElement.style.setProperty("--iput-bar", h + "px");
  }
  var barRO = window.ResizeObserver ? new ResizeObserver(syncBarHeight) : null;
  function showBanner() {
    if (banner) banner.remove();
    var t = TASKS[current], manual = t.success.type === "manual";
    banner = el("div", { id: "iput-banner", class: "iput-banner" });
    banner.innerHTML =
      '<div class="iput-banner__tag">' + t.label + "</div>" +
      '<div class="iput-banner__body"><div class="iput-banner__scenario">' + t.scenario + "</div>" +
      (t.hint ? '<div class="iput-banner__hint">' + t.hint + "</div>" : "") + "</div>" +
      (manual ? '<button class="iput-banner__done" id="iput-done">I’ve finished this step</button>' : "") +
      '<button class="iput-banner__skip" id="iput-skip">I can’t&nbsp;complete&nbsp;this</button>';
    root().appendChild(banner);
    if (barRO) { try { barRO.disconnect(); barRO.observe(banner); } catch (e) {} }
    syncBarHeight();
    if (manual) document.getElementById("iput-done").onclick = function () { completeTask(true, "manual"); };
    document.getElementById("iput-skip").onclick = function () { if (confirm("Mark this task as not completed and move on?")) completeTask(false, "skipped"); };
  }

  // ── flow ──
  function startTask(i) {
    current = i; taskStart = Date.now();
    session.tasks[i] = { id: TASKS[i].id, completed: false, done: false, skipped: false, seconds: 0, clicks: 0, path: [] };
    session.lastTaskReached = TASKS[i].label;
    send("in-progress");
    clearOverlay(); showBanner();
  }
  function completeTask(success, how) {
    var r = rec(); if (!r || r.done) return;
    r.done = true; r.completed = success; r.skipped = !success;
    r.seconds = Math.max(1, Math.round((Date.now() - taskStart) / 1000)); r.endVia = how || "";
    send("in-progress");
    if (banner) banner.remove();
    document.documentElement.style.setProperty("--iput-bar", "0px");
    var inner = el("div", { class: "iput-interstitial" });
    inner.innerHTML = '<div class="iput-check ' + (success ? "ok" : "skip") + '">' + (success ? "✓" : "→") + "</div>" +
      "<h2>" + (success ? "Nice — task complete" : "No problem — moving on") + "</h2>" +
      "<p>" + (current + 1 < TASKS.length ? "Here comes the next task." : "Just a couple of quick questions to finish.") + "</p>";
    overlay(inner);
    setTimeout(function () { if (current + 1 < TASKS.length) startTask(current + 1); else showSurvey(); }, 1500);
  }

  // ── intro ──
  function showIntro() {
    var inner = el("div");
    inner.innerHTML =
      '<div class="iput-brand">🔥 ' + BRAND.appName + "</div>" +
      "<h1>Thanks for helping us test</h1>" +
      "<p>You’ll see a real screen and <b>" + TASKS.length + " short tasks</b>, one at a time. There are no right or wrong answers — we’re testing the design, not you.</p>" +
      (COLLECT_NAME ? '<label class="iput-lbl" for="iput-name">Your name</label><input id="iput-name" class="iput-name" type="text" placeholder="First and last name" />' : "") +
      '<p class="iput-muted">Your clicks and timing are recorded so we can learn where the design works. Nothing else about you is collected.</p>' +
      '<button class="iput-btn iput-btn--primary" id="iput-begin">Start the first task</button>' +
      '<div class="iput-err" id="iput-name-err"></div>';
    overlay(inner);
    document.getElementById("iput-begin").onclick = function () {
      if (COLLECT_NAME) {
        var v = (document.getElementById("iput-name").value || "").trim();
        if (!v) { document.getElementById("iput-name-err").textContent = "Please enter your name to begin."; return; }
        session.participantName = v;
      }
      observer.observe(document.body, { childList: true, subtree: true });
      startTask(0);
    };
  }

  // ── survey ──
  function scale(item) {
    var s = '<div class="iput-scale" data-name="' + item.name + '">';
    for (var i = 1; i <= 5; i++) s += '<button type="button" data-v="' + i + '">' + i + "</button>";
    return s + '</div><div class="iput-scale-labels"><span>' + item.low + "</span><span>" + item.high + "</span></div>";
  }
  function showSurvey() {
    var inner = el("div", { class: "iput-survey" });
    var html = "<h1>A few quick questions</h1>";
    SURVEY.forEach(function (q) {
      html += '<div class="iput-q"><label>' + q.label + "</label>";
      html += q.type === "scale" ? scale(q) : '<textarea data-name="' + q.name + '" rows="3" placeholder="Type your answer…"></textarea>';
      html += "</div>";
    });
    html += '<button class="iput-btn iput-btn--primary" id="iput-finish">Finish</button>';
    inner.innerHTML = html; overlay(inner);
    inner.querySelectorAll(".iput-scale").forEach(function (sc) {
      sc.querySelectorAll("button").forEach(function (b) {
        b.onclick = function () { sc.querySelectorAll("button").forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); session.survey[sc.getAttribute("data-name")] = parseInt(b.getAttribute("data-v"), 10); };
      });
    });
    document.getElementById("iput-finish").onclick = function () {
      inner.querySelectorAll("textarea").forEach(function (t) { session.survey[t.getAttribute("data-name")] = t.value.trim(); });
      finish();
    };
  }

  // ── finish ──
  function finish() {
    finished = true;
    session.finishedAt = new Date().toISOString();
    send("completed");
    try { localStorage.setItem("iput_" + session.sessionId, JSON.stringify(session)); localStorage.setItem(doneKey(), "1"); } catch (e) {}
    var inner = el("div");
    inner.innerHTML = '<div class="iput-check ok">✓</div><h1>All done — thank you!</h1><p>Your responses have been recorded. You can close this tab.</p>' +
      (RESULTS_ENDPOINT ? "" : '<p class="iput-muted">Facilitator: results saved in this browser. <a href="#" id="iput-dl">Download this session</a>.</p>');
    overlay(inner);
    var dl = document.getElementById("iput-dl");
    if (dl) dl.onclick = function (e) { e.preventDefault(); var a = el("a", { href: URL.createObjectURL(new Blob([JSON.stringify(session, null, 2)], { type: "application/json" })), download: session.sessionId + ".json" }); document.body.appendChild(a); a.click(); a.remove(); };
  }

  // ── styles ──
  var css =
    "#iput-root{position:relative;z-index:2147483000}" +
    ".iput-overlay{position:fixed;inset:0;background:rgba(20,16,40,.55);display:flex;align-items:center;justify-content:center;z-index:2147483600;padding:24px}" +
    ".iput-card{background:#fff;border-radius:16px;max-width:520px;width:100%;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,.25);font-family:system-ui,sans-serif;max-height:90vh;overflow:auto}" +
    ".iput-card h1{font-size:24px;margin:0 0 12px;color:#23232D;font-weight:600}.iput-card h2{font-size:20px;margin:0 0 8px;color:#23232D;font-weight:600}" +
    ".iput-card p{font-size:15px;line-height:1.6;color:#46465A;margin:0 0 14px}.iput-muted{color:#8F8FA8;font-size:13px}.iput-muted a{color:" + PURPLE + "}" +
    ".iput-brand{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:" + PURPLE + ";margin-bottom:16px}" +
    ".iput-lbl{display:block;font-size:13px;font-weight:600;color:#23232D;margin:0 0 6px}" +
    ".iput-name{width:100%;border:1px solid #DBDBE4;border-radius:10px;padding:11px 13px;font-size:15px;font-family:inherit;box-sizing:border-box;margin-bottom:14px}" +
    ".iput-name:focus{outline:none;border-color:" + PURPLE + "}" +
    ".iput-err{color:#DB2B39;font-size:13px;margin-top:8px;min-height:16px}" +
    ".iput-btn{border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}" +
    ".iput-btn--primary{background:" + PURPLE + ";color:#fff;margin-top:4px}" +
    // DOCKED bottom bar — full width, anchored; app + overlays reserve --iput-bar of space.
    ".iput-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483500;background:#fff;border-top:3px solid " + PURPLE + ";box-shadow:0 -6px 20px rgba(0,0,0,.12);display:flex;gap:16px;align-items:flex-start;padding:14px 18px;font-family:system-ui,sans-serif}" +
    ":root{--iput-bar:0px}" +
    ".app{height:calc(100vh - var(--iput-bar))!important}" +
    "#root>*{max-height:calc(100vh - var(--iput-bar))!important}" +
    ".qmb-ui-brushaway{top:0!important;bottom:var(--iput-bar)!important;height:auto!important}" +
    ".qmb-ui-modal-wrapper,.qmb-ui-modal-overlay{bottom:var(--iput-bar)!important;height:auto!important}" +
    ".qmb-ui-toast{bottom:calc(var(--iput-bar) + 16px)!important}" +
    ".ai-trigger-button{bottom:calc(var(--iput-bar) + 20px)!important}" +
    ".iput-banner__tag{flex:0 0 auto;background:#F0E2F3;color:" + PURPLE + ";font-weight:600;font-size:12px;padding:4px 10px;border-radius:20px;margin-top:2px}" +
    ".iput-banner__body{flex:1 1 auto;min-width:0}.iput-banner__scenario{font-size:14px;line-height:1.5;color:#23232D}.iput-banner__hint{font-size:12px;color:#8F8FA8;margin-top:5px}" +
    ".iput-banner__done{flex:0 0 auto;background:" + PURPLE + ";border:0;color:#fff;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;font-family:inherit}" +
    ".iput-banner__skip{flex:0 0 auto;background:transparent;border:1px solid #DBDBE4;color:#585870;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;font-family:inherit}" +
    ".iput-interstitial,.iput-survey{text-align:center}.iput-survey{text-align:left}" +
    ".iput-check{font-size:44px;margin-bottom:8px;font-weight:700}.iput-check.ok{color:#019064}.iput-check.skip{color:" + CORAL + "}" +
    ".iput-q{margin:0 0 22px}.iput-q label{display:block;font-size:15px;font-weight:600;color:#23232D;margin-bottom:10px;line-height:1.4}" +
    ".iput-q textarea{width:100%;border:1px solid #DBDBE4;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box}" +
    ".iput-scale{display:flex;gap:8px}.iput-scale button{flex:1;aspect-ratio:1;border:1px solid #DBDBE4;background:#fff;border-radius:10px;font-size:16px;font-weight:600;color:#46465A;cursor:pointer;font-family:inherit}" +
    ".iput-scale button.sel{background:" + PURPLE + ";color:#fff;border-color:" + PURPLE + "}" +
    ".iput-scale-labels{display:flex;justify-content:space-between;font-size:11px;color:#8F8FA8;margin-top:6px}";
  document.head.appendChild(el("style", null, css));

  // ── one-completion gate (stops retakes) ──
  function doneKey() { return "iput_done_" + TEST_NAME + "_" + (session.pid || ""); }
  function showAlreadyDone() {
    var inner = el("div");
    inner.innerHTML = '<div class="iput-brand">🔥 ' + BRAND.appName + "</div>" +
      '<div class="iput-check ok">✓</div><h1>You’ve already completed this</h1>' +
      "<p>Thanks — our records show this test was already finished with your link, so there’s nothing more to do. You can close this tab.</p>";
    overlay(inner);
  }
  function gate() {
    var localDone = false;
    try { localDone = localStorage.getItem(doneKey()) === "1"; } catch (e) {}
    if (localDone) { showAlreadyDone(); return; }
    if (session.pid && RESULTS_ENDPOINT) {
      var checkUrl = RESULTS_ENDPOINT.replace(/\/api\/results$/, "/api/check") +
        "?test=" + encodeURIComponent(TEST_NAME) + "&pid=" + encodeURIComponent(session.pid);
      fetch(checkUrl).then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.completed) showAlreadyDone(); else showIntro(); })
        .catch(function () { showIntro(); }); // fail open — don't block real participants on a network hiccup
    } else { showIntro(); }
  }

  // ── boot ──
  (function boot() {
    var r = document.getElementById("root") || document.body;
    if (document.body && (r.children.length || document.body.children.length > 1)) gate();
    else setTimeout(boot, 200);
  })();
})();
