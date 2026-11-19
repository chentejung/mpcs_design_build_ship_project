#!/usr/bin/env node
// Usage: node serve.mjs <engagement-folder>
//
// Serves one engagement folder read-only on 127.0.0.1, so the status page (and the files it links
// to) can be opened in a browser, including through VS Code Remote's port forwarding. Tries ports
// 8740-8759 so the address stays stable, records { pid, port } in <folder>/.status-server.json, and
// exits after two hours without a request. Started in the background by status.mjs --open.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "");
if (!process.argv[2] || !fs.existsSync(root)) {
  console.error("Usage: node serve.mjs <engagement-folder>");
  process.exit(1);
}
const stateFile = path.join(root, ".status-server.json");
const IDLE_MS = 2 * 60 * 60 * 1000;
const TYPES = { ".html": "text/html; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".json": "application/json; charset=utf-8", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

let idle;
const touch = () => {
  clearTimeout(idle);
  idle = setTimeout(shutdown, IDLE_MS);
};

const server = http.createServer((req, res) => {
  touch();
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = path.resolve(root, "." + (rel === "/" ? "/status.html" : rel));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile() || path.basename(file).startsWith(".")) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(file).pipe(res);
  });
});

function shutdown() {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    if (s.pid === process.pid) fs.unlinkSync(stateFile);
  } catch {
    /* already gone */
  }
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

let port = 8740;
server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && port < 8759) {
    port += 1;
    server.listen(port, "127.0.0.1");
  } else {
    console.error(e.message);
    process.exit(1);
  }
});
server.on("listening", () => {
  fs.writeFileSync(stateFile, JSON.stringify({ pid: process.pid, port }) + "\n");
  touch();
});
server.listen(port, "127.0.0.1");
