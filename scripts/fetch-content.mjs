// Runs before `vite build` (npm run build). Pulls the live content of ose.vn so the static site
// (home page, app pages, articles) is generated from the current database:
//
//   1. GET <API>/api/v1/site-content            (backend on the home server / VPS)
//   2. if the API is down: <SITE>/content/site-content.json  (snapshot published by the previous build)
//   3. if both fail: keep the files committed in src/data/  (the build never fails because of this step)
//
// Writes src/data/catalog.fallback.json, src/data/articles.index.json (no bodies, goes into the
// browser bundle), src/data/articles.full.json (bodies, used only by the prerender step),
// public/content/site-content.json (snapshot for step 2 next time) and downloads every /media/
// image used by the articles into public/media/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...x) => resolve(root, ...x);

/** Read VITE_* values from .env.production / .env (Node does not load them by itself). */
function envFile(name) {
  const out = {};
  const f = p(name);
  if (!existsSync(f)) return out;
  for (const line of readFileSync(f, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...envFile(".env"), ...envFile(".env.production"), ...process.env };
const API = (env.CONTENT_API || env.VITE_API_BASE || "").replace(/\/$/, "");
const SITE = (env.VITE_SITE_URL || "https://ose.vn").replace(/\/$/, "");
const TIMEOUT = Number(env.CONTENT_TIMEOUT_MS || 20000);

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "ose-pages-build/1", Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!d?.seed?.groups) throw new Error("unexpected content");
    return d;
  } finally { clearTimeout(timer); }
}

async function download(url, file) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "ose-pages-build/1" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    return true;
  } catch (e) {
    console.warn(`fetch-content: image ${url} not downloaded (${e.message})`);
    return false;
  } finally { clearTimeout(timer); }
}

/** Approximate word count of Markdown, for "x phút đọc". */
function minutes(md) {
  const words = String(md || "").replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`|~-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

let content = null;
let source = "";
const tried = [];
if (API) {
  try { content = await getJson(`${API}/api/v1/site-content`); source = "api"; }
  catch (e) { tried.push(`${API} (${e.message})`); }
}
if (!content) {
  try { content = await getJson(`${SITE}/content/site-content.json`); source = "snapshot"; }
  catch (e) { tried.push(`${SITE}/content/site-content.json (${e.message})`); }
}
if (!content) {
  console.warn(`fetch-content: could not read live content — ${tried.join("; ")}. Keeping src/data/*.json from the repository.`);
  process.exit(0);
}

const articles = (content.articles || []).map((a) => ({ ...a, minutes_vi: minutes(a.body_vi), minutes_en: minutes(a.body_en) }));
const summaries = articles.map(({ body_vi, body_en, ...rest }) => rest);   // eslint-disable-line no-unused-vars

writeFileSync(p("src/data/catalog.fallback.json"), JSON.stringify(content.seed, null, 2) + "\n");
writeFileSync(p("src/data/articles.index.json"), JSON.stringify({ categories: content.categories || [], articles: summaries }, null, 2) + "\n");
writeFileSync(p("src/data/articles.full.json"), JSON.stringify({ articles }, null, 2) + "\n");
mkdirSync(p("public/content"), { recursive: true });
writeFileSync(p("public/content/site-content.json"), JSON.stringify(content));

// Images: every /media/<file> referenced by a cover or inside an article body.
const names = new Set();
for (const a of articles) {
  for (const s of [a.cover, a.body_vi, a.body_en]) {
    for (const m of String(s || "").matchAll(/\/media\/([a-z0-9][a-z0-9-]{0,80}\.(?:jpg|png|webp|gif))/g)) names.add(m[1]);
  }
}
let ok = 0;
for (const n of names) {
  const file = p("public/media", n);
  if (existsSync(file)) { ok++; continue; }
  const from = source === "api" ? `${API}/api/v1/media/${n}` : `${SITE}/media/${n}`;
  if (await download(from, file)) ok++;
}

const apps = content.seed.groups.reduce((n, g) => n + g.apps.length, 0);
console.log(`fetch-content: ${source} — ${apps} apps, ${articles.length} articles, ${ok}/${names.size} images`);
