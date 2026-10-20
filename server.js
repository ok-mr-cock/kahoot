// Kdo má pravdu? – soutěžní server (bez závislostí, jen vestavěné moduly Node.js)
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = process.env.PORT || 3000;
const PASS = process.env.TEACHER_PASSWORD || "ucitel";
const TASKS = JSON.parse(fs.readFileSync(path.join(__dirname, "tasks.json"), "utf8"));
const HTML = fs.readFileSync(
  [path.join(__dirname, "public", "index.html"), path.join(__dirname, "index.html")].find((f) => fs.existsSync(f))
);

let S = { phase: "lobby", idx: 0, t0: 0 };      // lobby | question | reveal | end
const players = new Map();                       // id -> {name, answers:{idx:{c,ms}}, pts:{idx:n}}
const clients = new Map();                       // SSE odpověď -> id žáka (nebo "")
const tot = (p) => Object.values(p.pts).reduce((a, b) => a + b, 0);

function snap(id) {
  const t = TASKS[S.idx], rev = S.phase === "reveal";
  const dist = { A: 0, B: 0, AB: 0, N: 0 };
  if (rev) players.forEach((p) => { const a = p.answers[S.idx]; if (a) dist[a.c]++; });
  const p = players.get(id);
  return {
    phase: S.phase, idx: S.idx,
    players: [...players].map(([i, q]) => ({ id: i, name: q.name, s: tot(q), a: !!q.answers[S.idx] })),
    dist: rev ? dist : null,
    reveal: rev ? { ans: t.ans, res: t.res, who: t.who, tip: t.tip } : null,
    mine: p ? { name: p.name, answer: p.answers[S.idx] ? p.answers[S.idx].c : null, pts: p.pts[S.idx], total: tot(p) } : null,
  };
}
let queued = false;
function broadcast() {
  if (queued) return;
  queued = true;
  setTimeout(() => {
    queued = false;
    for (const [res, id] of clients) res.write("data: " + JSON.stringify(snap(id)) + "\n\n");
  }, 120);
}
function reveal() {
  const t = TASKS[S.idx];
  players.forEach((p) => {
    const a = p.answers[S.idx];
    p.pts[S.idx] = a && a.c === t.ans ? 1000 - Math.round(Math.min(a.ms, 30000) / 30000 * 500) : 0;
  });
  S.phase = "reveal";
}
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

function handle(url, b, res) {
  if (url === "/api/join") {
    const id = String(b.id || ""), name = String(b.name || "").trim().slice(0, 20);
    if (id.length < 8 || id.length > 64 || !name) return send(res, 400, { ok: false });
    const old = players.get(id);
    players.set(id, { name, answers: old ? old.answers : {}, pts: old ? old.pts : {} });
    broadcast(); return send(res, 200, { ok: true });
  }
  if (url === "/api/answer") {
    const p = players.get(String(b.id || ""));
    if (!p || S.phase !== "question" || !["A", "B", "AB", "N"].includes(b.c) || p.answers[S.idx]) return send(res, 400, { ok: false });
    p.answers[S.idx] = { c: b.c, ms: Date.now() - S.t0 };
    broadcast(); return send(res, 200, { ok: true });
  }
  if (url === "/api/teacher") {
    if (!same(String(b.password || ""), PASS)) return send(res, 403, { ok: false });
    const a = b.action;
    if (a === "start") S = { phase: "question", idx: 0, t0: Date.now() };
    else if (a === "reveal" && S.phase === "question") reveal();
    else if (a === "next" && S.phase === "reveal" && S.idx + 1 < TASKS.length) S = { phase: "question", idx: S.idx + 1, t0: Date.now() };
    else if (a === "end") S.phase = "end";
    else if (a === "reset") { players.clear(); S = { phase: "lobby", idx: 0, t0: 0 }; }
    broadcast(); return send(res, 200, { ok: true });
  }
  send(res, 404, { ok: false });
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "GET" && u.pathname === "/api/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    const id = u.searchParams.get("id") || "";
    clients.set(res, id);
    res.write("data: " + JSON.stringify(snap(id)) + "\n\n");
    const ping = setInterval(() => res.write(": ping\n\n"), 20000);
    req.on("close", () => { clearInterval(ping); clients.delete(res); });
    return;
  }
  if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/ucitel")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(HTML);
  }
  if (req.method === "POST") {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 4000) req.destroy(); });
    req.on("end", () => { let b = {}; try { b = JSON.parse(data); } catch (e) {} handle(u.pathname, b, res); });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log("Server běží na portu " + PORT));
