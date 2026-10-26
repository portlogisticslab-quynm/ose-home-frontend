import { StrictMode, type ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/index.css";
import App from "./App";
import ArticlesListPage from "./pages/ArticlesListPage";
import ArticlePage from "./pages/ArticlePage";
import seed from "./data/catalog.fallback.json";
import { seedToCatalog } from "./lib/catalog";
import { articlesIndex } from "./lib/articles";
import { apiFetch } from "./lib/api";
import type { Article, Lang, Seed } from "./lib/types";

// Language comes from the URL (/en/…), not only from <html lang>: the dev server and any
// fallback route serve the Vietnamese template for /en/ paths too.
const path = window.location.pathname;
const lang: Lang = /^\/en(\/|$)/.test(path) ? "en" : "vi";
const htmlLang = document.documentElement.lang;
document.documentElement.lang = lang;
const initial = seedToCatalog(seed as Seed);
const root = document.getElementById("root")!;

const listRe = /^\/(?:bai-viet|en\/articles)\/?$/;
const articleRe = /^\/(?:bai-viet|en\/articles)\/([a-z0-9-]+)\/?$/;

/** Article data embedded by scripts/prerender.mjs (<script id="page-data" type="application/json">). */
function embeddedArticle(): Article | null {
  const el = document.getElementById("page-data");
  if (!el?.textContent) return null;
  try { return JSON.parse(el.textContent) as Article; } catch { return null; }
}

function mount(tree: ReactElement, canHydrate: boolean) {
  const wrapped = <StrictMode>{tree}</StrictMode>;
  // Prerendered pages are hydrated; `npm run dev` (empty root) renders from scratch.
  // If the server sent the other language's HTML (a fallback route), render fresh instead.
  if (canHydrate && root.hasChildNodes() && htmlLang === lang) hydrateRoot(root, wrapped);
  else { root.innerHTML = ""; createRoot(root).render(wrapped); }
}

const m = path.match(articleRe);
if (listRe.test(path)) {
  mount(<ArticlesListPage lang={lang} data={articlesIndex} catalog={initial} />, true);
} else if (m) {
  const embedded = embeddedArticle();
  if (embedded) {
    mount(<ArticlePage lang={lang} article={embedded} index={articlesIndex} catalog={initial} />, true);
  } else {
    // Published after the last static build (or opened in `npm run dev`): read it from the API.
    apiFetch<Article>(`/api/v1/articles/${m[1]}`, { timeoutMs: 8000 })
      .then((a) => mount(<ArticlePage lang={lang} article={a} index={articlesIndex} catalog={initial} />, false))
      .catch(() => { window.location.replace(lang === "en" ? "/en/articles/" : "/bai-viet/"); });
  }
} else {
  mount(<App lang={lang} initial={initial} />, true);
}
