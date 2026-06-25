// Inspect Point — usability-test results server.
// Three jobs, one tiny zero-dependency Node app:
//   1. POST /api/results  → accept a finished test session (open, for anonymous participants)
//   2. GET  /api/results  → return all results as {headers, rows} (internal, Basic Auth)
//   3. GET  /             → serve the internal dashboard (internal, Basic Auth)
//
// Storage: one JSON object per line in DATA_FILE (append-only), kept on a Fly volume so it
// survives restarts. Config via env: PORT, DATA_FILE, DASH_USER, DASH_PASS.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "results.jsonl");
const DASH_USER = process.env.DASH_USER || "admin";
const DASH_PASS = process.env.DASH_PASS || "changeme";
const MAX_BODY = 256 * 1024; // 256 KB per submission, plenty

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function readBody(req, cb) {
  let body = "", tooBig = false;
  req.on("data", (c) => { body += c; if (body.length > MAX_BODY) { tooBig = true; req.destroy(); } });
  req.on("end", () => { if (!tooBig) cb(null, body); });
  req.on("error", (e) => cb(e));
}

function authed(req) {
  const h = req.headers["authorization"] || "";
  if (!h.startsWith("Basic ")) return false;
  const [u, p] = Buffer.from(h.slice(6), "base64").toString("utf8").split(":");
  return u === DASH_USER && p === DASH_PASS;
}

function requireAuth(res) {
  res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Usability results"', "Content-Type": "text/plain" });
  res.end("Authentication required");
}

// Each session reports multiple times (start, per-task, finish/abandon). Keep only the
// latest record per session id, so one participant = one row reflecting their final state.
function dedupe(sessions) {
  const byId = new Map();
  sessions.forEach((s) => { byId.set(s.sessionId || s.participant || JSON.stringify(s), s); });
  return Array.from(byId.values());
}

// Flatten stored sessions into the {headers, rows} shape the dashboard expects.
function flatten(allSessions) {
  const sessions = dedupe(allSessions);
  const rows = sessions.map((s) => {
    const row = {
      "Recorded at": s.finishedAt || s.startedAt || "",
      "Test": s.test || "",
      "Name": s.participantName || "",
      "PID": s.pid || "",
      "Status": s.status || (s.finishedAt ? "completed" : "in-progress"),
      "Last task reached": s.lastTaskReached || "",
      "Started at": s.startedAt || "",
      "Finished at": s.finishedAt || "",
    };
    (s.tasks || []).forEach((t, i) => {
      const n = i + 1;
      row["Task " + n + " name"] = t.id || "";
      row["Task " + n + " completed"] = t.completed ? "Yes" : "No";
      row["Task " + n + " seconds"] = t.seconds || "";
      row["Task " + n + " clicks"] = t.clicks || "";
      row["Task " + n + " click path"] = (t.path || []).join(" > ");
    });
    const sv = s.survey || {};
    Object.keys(sv).forEach((k) => { row["Q: " + k] = sv[k] === undefined ? "" : sv[k]; });
    row["Session"] = s.sessionId || s.participant || "";
    row["Device"] = s.userAgent || "";
    return row;
  });
  const headers = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (headers.indexOf(k) < 0) headers.push(k); }));
  return { headers, rows };
}

function loadSessions() {
  let text = "";
  try { text = fs.readFileSync(DATA_FILE, "utf8"); } catch (e) { return []; }
  return text.split("\n").filter(Boolean).map((line) => { try { return JSON.parse(line); } catch (e) { return null; } }).filter(Boolean);
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];

  if (req.method === "OPTIONS" && (url === "/api/results" || url === "/api/check")) {
    res.writeHead(204, CORS); res.end(); return;
  }

  // Has this participant (test + pid) already completed? Public + CORS so the test page
  // can check on load. Returns only a boolean — no other data is exposed.
  if (req.method === "GET" && url === "/api/check") {
    const q = (req.url.split("?")[1] || "");
    const params = new URLSearchParams(q);
    const test = params.get("test") || "", pid = params.get("pid") || "";
    let done = false;
    if (pid) {
      done = dedupe(loadSessions()).some(function (s) {
        return (s.test || "") === test && (s.pid || "") === pid && (s.status === "completed" || !!s.finishedAt);
      });
    }
    res.writeHead(200, Object.assign({ "Content-Type": "application/json" }, CORS));
    res.end(JSON.stringify({ completed: done }));
    return;
  }

  // 1. Accept a submission — open, so anonymous participants can post.
  if (req.method === "POST" && url === "/api/results") {
    readBody(req, (err, body) => {
      if (err) { res.writeHead(400, CORS); res.end("bad request"); return; }
      let data;
      try { data = JSON.parse(body); } catch (e) { res.writeHead(400, CORS); res.end("invalid json"); return; }
      try {
        fs.appendFileSync(DATA_FILE, JSON.stringify(data) + "\n");
      } catch (e) {
        res.writeHead(500, CORS); res.end("store error"); return;
      }
      res.writeHead(200, { ...CORS, "Content-Type": "text/plain" }); res.end("ok");
    });
    return;
  }

  // health check (no auth) for Fly
  if (req.method === "GET" && url === "/healthz") { res.writeHead(200); res.end("ok"); return; }

  // 2. Results JSON — internal only.
  if (req.method === "GET" && url === "/api/results") {
    if (!authed(req)) return requireAuth(res);
    const out = flatten(loadSessions());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(out));
    return;
  }

  // 3. Dashboard — internal only.
  if (req.method === "GET" && (url === "/" || url === "/index.html" || url === "/dashboard")) {
    if (!authed(req)) return requireAuth(res);
    let html;
    try { html = fs.readFileSync(path.join(__dirname, "dashboard.html"), "utf8"); }
    catch (e) { res.writeHead(500); res.end("dashboard missing"); return; }
    // Embed the data directly so the page needs no second (authenticated) request.
    const payload = JSON.stringify(flatten(loadSessions())).replace(/</g, "\\u003c");
    html = html.replace("<!--RESULTS_DATA-->", "<script>window.__RESULTS__ = " + payload + ";</script>");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found");
});

server.listen(PORT, () => console.log("usability results server on :" + PORT + " (data: " + DATA_FILE + ")"));
