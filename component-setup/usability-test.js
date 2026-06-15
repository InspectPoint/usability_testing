/* usability-test.js — self-contained unmoderated usability-test harness.
   Layers a task panel, click/time/success logging, and an end survey on top of
   the Component Setup prototype WITHOUT modifying any of the prototype's code.
   It detects task success by watching for the prototype's own success toast
   ("Component type created" / "Component type updated").

   TO MAKE RESULTS SAVE TO A GOOGLE SHEET: paste your Apps Script Web App URL
   into RESULTS_ENDPOINT below. Until then, results are saved in the browser and
   offered as a download at the end. */
(function () {
  "use strict";

  // Results post to our internal Fly.io results server; the internal dashboard reads them.
  var RESULTS_ENDPOINT = "https://inspectpoint-usability-results.fly.dev/api/results";
  var TEST_NAME = "Component Setup"; // labels every result row so the dashboard groups this test

  var PURPLE = "#3D1B9D";
  var CORAL = "#EA6952";

  // ── Tasks ──────────────────────────────────────────────────────────────────
  // successWhen() is tested against the prototype's success-toast message text.
  var TASKS = [
    {
      id: "create",
      label: "Task 1 of 2",
      scenario:
        "Your company just landed a contract that requires inspecting <b>tamper switches</b> — a component type you don’t track yet. Set up a brand-new component type called <b>“Tamper Switch”</b> so your inspectors can start logging it.",
      hint: "Everything you need is on this Settings screen.",
      successWhen: function (m) { return /created|add another/i.test(m); }
    },
    {
      id: "edit",
      label: "Task 2 of 2",
      scenario:
        "An inspector tells you the inspection questions for <b>sprinkler heads</b> need a tweak. Open the existing <b>Sprinkler head</b> component type, look at the questions attached to it, make any change you think makes sense, and save.",
      hint: "Start from the list of component types.",
      successWhen: function (m) { return /updated/i.test(m); }
    }
  ];

  // ── Session state (one row of results per participant) ───────────────────────
  var session = {
    test: TEST_NAME,
    participant: "p-" + Date.now() + "-" + Math.floor(Math.random() * 1e6),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    userAgent: navigator.userAgent,
    tasks: [],
    survey: {}
  };
  var current = -1;
  var taskStart = 0;

  function curTaskRecord() { return session.tasks[current]; }

  // ── Click + interaction logging ─────────────────────────────────────────────
  function labelFor(el) {
    var node = el.closest(
      "button, a, [role=button], .qmb-ui-tabs__option, .cfg-toc__item, .cfg-tab, .qmb-ui-inline-edit, input, select, textarea, li"
    );
    if (!node) return null;
    var txt = (node.getAttribute("aria-label") || node.textContent || node.value || "").trim();
    txt = txt.replace(/\s+/g, " ").slice(0, 60);
    return txt || node.tagName.toLowerCase();
  }
  document.addEventListener(
    "click",
    function (e) {
      if (e.target.closest("#iput-root")) return; // ignore clicks on our own UI
      var rec = curTaskRecord();
      if (!rec || rec.done) return;
      var lbl = labelFor(e.target);
      rec.clicks++;
      if (lbl) rec.path.push(lbl);
    },
    true
  );

  // ── Success detection: watch the prototype's success toast ───────────────────
  var observer = new MutationObserver(function (muts) {
    var rec = curTaskRecord();
    if (!rec || rec.done) return;
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        var toast = n.matches && n.matches(".qmb-ui-toast--success")
          ? n
          : n.querySelector && n.querySelector(".qmb-ui-toast--success");
        if (!toast) continue;
        var msgEl = toast.querySelector(".notification__message");
        var msg = (msgEl ? msgEl.textContent : toast.textContent || "").trim();
        if (TASKS[current].successWhen(msg)) completeTask(true, msg);
      }
    }
  });

  // ── UI helpers ───────────────────────────────────────────────────────────────
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function root() {
    var r = document.getElementById("iput-root");
    if (!r) { r = el("div", { id: "iput-root" }); document.body.appendChild(r); }
    return r;
  }
  function clearOverlay() {
    var o = document.getElementById("iput-overlay");
    if (o) o.remove();
  }
  function overlay(inner) {
    clearOverlay();
    var o = el("div", { id: "iput-overlay", class: "iput-overlay" });
    var card = el("div", { class: "iput-card" });
    card.appendChild(inner);
    o.appendChild(card);
    root().appendChild(o);
    return o;
  }

  // ── Task banner (fixed, bottom) ──────────────────────────────────────────────
  var banner;
  function showBanner() {
    if (banner) banner.remove();
    var t = TASKS[current];
    banner = el("div", { id: "iput-banner", class: "iput-banner" });
    banner.innerHTML =
      '<div class="iput-banner__tag">' + t.label + "</div>" +
      '<div class="iput-banner__body">' +
        '<div class="iput-banner__scenario">' + t.scenario + "</div>" +
        '<div class="iput-banner__hint"><i class="fa-light fa-circle-info"></i> ' + t.hint + "</div>" +
      "</div>" +
      '<button class="iput-banner__skip" id="iput-skip">I can’t&nbsp;complete&nbsp;this</button>';
    root().appendChild(banner);
    document.getElementById("iput-skip").onclick = function () {
      if (confirm("Mark this task as not completed and move on?")) completeTask(false, "skipped");
    };
  }

  // ── Flow ─────────────────────────────────────────────────────────────────────
  function startTask(i) {
    current = i;
    taskStart = Date.now();
    session.tasks[i] = { id: TASKS[i].id, completed: false, done: false, skipped: false, seconds: 0, clicks: 0, path: [] };
    clearOverlay();
    showBanner();
  }

  function completeTask(success, msg) {
    var rec = curTaskRecord();
    if (!rec || rec.done) return;
    rec.done = true;
    rec.completed = success;
    rec.skipped = !success;
    rec.seconds = Math.max(1, Math.round((Date.now() - taskStart) / 1000));
    rec.endMessage = msg || "";
    if (banner) banner.remove();
    // brief interstitial, then advance
    var inner = el("div", { class: "iput-interstitial" });
    inner.innerHTML =
      '<div class="iput-check ' + (success ? "ok" : "skip") + '">' +
        '<i class="fa-solid fa-' + (success ? "circle-check" : "circle-arrow-right") + '"></i></div>' +
      "<h2>" + (success ? "Nice — task complete" : "No problem — moving on") + "</h2>" +
      "<p>" + (current + 1 < TASKS.length ? "Here comes the next task." : "Just a couple of quick questions to finish.") + "</p>";
    overlay(inner);
    setTimeout(function () {
      if (current + 1 < TASKS.length) startTask(current + 1);
      else showSurvey();
    }, 1500);
  }

  // ── Intro ─────────────────────────────────────────────────────────────────────
  function showIntro() {
    var inner = el("div");
    inner.innerHTML =
      '<div class="iput-brand"><i class="fa-solid fa-fire"></i> Inspect Point</div>' +
      "<h1>Thanks for helping us test</h1>" +
      "<p>You’ll see a real settings screen and <b>2 short tasks</b>, one at a time. There are no right or wrong answers — we’re testing the design, not you.</p>" +
      "<p>Please try each task the way you naturally would. If you get stuck, that’s useful for us to know — you can mark a task as “can’t complete” and move on.</p>" +
      '<p class="iput-muted">Your clicks and the time you take are recorded so we can learn where the design works and where it doesn’t. Nothing else about you is collected.</p>' +
      '<button class="iput-btn iput-btn--primary" id="iput-begin">Start the first task</button>';
    overlay(inner);
    document.getElementById("iput-begin").onclick = function () {
      observer.observe(document.body, { childList: true, subtree: true });
      startTask(0);
    };
  }

  // ── Survey ─────────────────────────────────────────────────────────────────────
  function scale(name, lowLabel, highLabel) {
    var s = '<div class="iput-scale" data-name="' + name + '">';
    for (var i = 1; i <= 5; i++) s += '<button type="button" data-v="' + i + '">' + i + "</button>";
    s += '</div><div class="iput-scale-labels"><span>' + lowLabel + "</span><span>" + highLabel + "</span></div>";
    return s;
  }
  function showSurvey() {
    var inner = el("div", { class: "iput-survey" });
    inner.innerHTML =
      "<h1>A few quick questions</h1>" +
      '<div class="iput-q"><label>Overall, how easy or hard was it to set up and edit a component type?</label>' +
        scale("ease", "Very hard", "Very easy") + "</div>" +
      '<div class="iput-q"><label>In your own words, how would you describe the relationship between a component type and its questions?</label>' +
        '<textarea data-name="relationship" rows="3" placeholder="Type your answer…"></textarea></div>' +
      '<div class="iput-q"><label>Did anything work differently than you expected? If so, what?</label>' +
        '<textarea data-name="unexpected" rows="3" placeholder="Type your answer…"></textarea></div>' +
      '<div class="iput-q"><label>How confident are you that you set things up correctly?</label>' +
        scale("confidence", "Not at all", "Very confident") + "</div>" +
      '<button class="iput-btn iput-btn--primary" id="iput-finish">Finish</button>';
    overlay(inner);

    inner.querySelectorAll(".iput-scale").forEach(function (sc) {
      sc.querySelectorAll("button").forEach(function (b) {
        b.onclick = function () {
          sc.querySelectorAll("button").forEach(function (x) { x.classList.remove("sel"); });
          b.classList.add("sel");
          session.survey[sc.getAttribute("data-name")] = parseInt(b.getAttribute("data-v"), 10);
        };
      });
    });
    document.getElementById("iput-finish").onclick = function () {
      inner.querySelectorAll("textarea").forEach(function (t) {
        session.survey[t.getAttribute("data-name")] = t.value.trim();
      });
      finish();
    };
  }

  // ── Finish + save ────────────────────────────────────────────────────────────
  function finish() {
    session.finishedAt = new Date().toISOString();
    // tidy: strip internal flags from the saved record
    var clean = JSON.parse(JSON.stringify(session));
    clean.tasks.forEach(function (t) { delete t.done; });
    try { localStorage.setItem("iput_" + session.participant, JSON.stringify(clean)); } catch (e) {}

    var sent = false;
    if (RESULTS_ENDPOINT) {
      try {
        fetch(RESULTS_ENDPOINT, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(clean)
        });
        sent = true;
      } catch (e) {}
    }

    var inner = el("div");
    inner.innerHTML =
      '<div class="iput-check ok"><i class="fa-solid fa-circle-check"></i></div>' +
      "<h1>All done — thank you!</h1>" +
      "<p>Your responses have been recorded. You can close this tab.</p>" +
      (sent ? "" : '<p class="iput-muted">Facilitator: results are saved in this browser. <a href="#" id="iput-dl">Download this session as a file</a>.</p>');
    overlay(inner);
    var dl = document.getElementById("iput-dl");
    if (dl) dl.onclick = function (e) {
      e.preventDefault();
      var blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
      var a = el("a", { href: URL.createObjectURL(blob), download: session.participant + ".json" });
      document.body.appendChild(a); a.click(); a.remove();
    };
  }

  // ── Styles ─────────────────────────────────────────────────────────────────────
  var css =
    "#iput-root{position:relative;z-index:2147483000}" +
    ".iput-overlay{position:fixed;inset:0;background:rgba(20,16,40,.55);display:flex;align-items:center;justify-content:center;z-index:2147483600;padding:24px}" +
    ".iput-card{background:#fff;border-radius:16px;max-width:520px;width:100%;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,.25);font-family:'Hanken Grotesk',system-ui,sans-serif;max-height:90vh;overflow:auto}" +
    ".iput-card h1{font-size:24px;margin:0 0 12px;color:#23232D;font-weight:600}" +
    ".iput-card h2{font-size:20px;margin:0 0 8px;color:#23232D;font-weight:600}" +
    ".iput-card p{font-size:15px;line-height:1.6;color:#46465A;margin:0 0 14px}" +
    ".iput-muted{color:#8F8FA8;font-size:13px}" +
    ".iput-muted a{color:" + PURPLE + "}" +
    ".iput-brand{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:" + PURPLE + ";margin-bottom:16px}" +
    ".iput-brand i{color:" + CORAL + "}" +
    ".iput-btn{border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}" +
    ".iput-btn--primary{background:" + PURPLE + ";color:#fff;margin-top:8px}" +
    ".iput-btn--primary:hover{background:#54265E}" +
    ".iput-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483500;background:#fff;border:1px solid #DBDBE4;border-left:5px solid " + PURPLE + ";border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.16);display:flex;gap:16px;align-items:flex-start;padding:14px 18px;font-family:'Hanken Grotesk',system-ui,sans-serif}" +
    ".iput-banner__tag{flex:0 0 auto;background:#F0E2F3;color:" + PURPLE + ";font-weight:600;font-size:12px;padding:4px 10px;border-radius:20px;margin-top:2px}" +
    ".iput-banner__body{flex:1 1 auto;min-width:0}" +
    ".iput-banner__scenario{font-size:14px;line-height:1.5;color:#23232D}" +
    ".iput-banner__hint{font-size:12px;color:#8F8FA8;margin-top:5px}" +
    ".iput-banner__skip{flex:0 0 auto;background:transparent;border:1px solid #DBDBE4;color:#585870;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;font-family:inherit}" +
    ".iput-banner__skip:hover{background:#F7F7F9}" +
    ".iput-interstitial,.iput-survey{text-align:center}" +
    ".iput-survey{text-align:left}" +
    ".iput-check{font-size:48px;margin-bottom:8px}" +
    ".iput-check.ok{color:#019064}.iput-check.skip{color:" + CORAL + "}" +
    ".iput-q{margin:0 0 22px}" +
    ".iput-q label{display:block;font-size:15px;font-weight:600;color:#23232D;margin-bottom:10px;line-height:1.4}" +
    ".iput-q textarea{width:100%;border:1px solid #DBDBE4;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box}" +
    ".iput-scale{display:flex;gap:8px}" +
    ".iput-scale button{flex:1;aspect-ratio:1;border:1px solid #DBDBE4;background:#fff;border-radius:10px;font-size:16px;font-weight:600;color:#46465A;cursor:pointer;font-family:inherit}" +
    ".iput-scale button:hover{border-color:" + PURPLE + "}" +
    ".iput-scale button.sel{background:" + PURPLE + ";color:#fff;border-color:" + PURPLE + "}" +
    ".iput-scale-labels{display:flex;justify-content:space-between;font-size:11px;color:#8F8FA8;margin-top:6px}";
  document.head.appendChild(el("style", null, css));

  // ── Boot (wait for the prototype to render) ──────────────────────────────────
  function boot() {
    var r = document.getElementById("root");
    if (r && r.children.length) showIntro();
    else setTimeout(boot, 200);
  }
  boot();
})();
