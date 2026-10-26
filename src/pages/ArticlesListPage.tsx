import { useEffect, useMemo, useState } from "react";
import type { ArticlesIndex, Catalog, Lang } from "../lib/types";
import { categoryName, fold, forLang, summary, title } from "../lib/articles";
import { articlesPath, homePath, t } from "../lib/i18n";
import { apiFetch } from "../lib/api";
import { useReveal } from "../lib/useReveal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ArticleCard from "../components/ArticleCard";
import { IconSearch } from "../components/Icons";

interface Props { lang: Lang; data: ArticlesIndex; catalog: Catalog }

/**
 * /bai-viet/ and /en/articles/. Filters live in the query string (?cm=<category>&tag=<tag>&q=<text>)
 * and are applied after hydration, so the prerendered HTML lists every article.
 */
export default function ArticlesListPage({ lang, data: initial, catalog }: Props) {
  const [data, setData] = useState(initial);
  const [cat, setCat] = useState("");
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  useReveal();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setCat(p.get("cm") || "");
    setTag(p.get("tag") || "");
    setQ(p.get("q") || "");
    // Articles published after the last static build appear too (when the API is reachable).
    apiFetch<ArticlesIndex>("/api/v1/articles", { timeoutMs: 5000 })
      .then((d) => { if (d?.articles && d.articles.length >= initial.articles.length) setData(d); })
      .catch(() => {});
  }, [initial.articles.length]);

  // Keep the address bar in sync (shareable filtered lists) without reloading.
  useEffect(() => {
    const p = new URLSearchParams();
    if (cat) p.set("cm", cat);
    if (tag) p.set("tag", tag);
    if (q.trim()) p.set("q", q.trim());
    const qs = p.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [cat, tag, q]);

  const all = useMemo(() => forLang(data.articles, lang), [data, lang]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((a) => a.category && m.set(a.category, (m.get(a.category) ?? 0) + 1));
    return m;
  }, [all]);
  const shown = useMemo(() => {
    const needle = fold(q.trim());
    return all.filter((a) =>
      (!cat || a.category === cat) &&
      (!tag || a.tags.some((x) => fold(x) === fold(tag))) &&
      (!needle || fold(`${title(a, lang)} ${summary(a, lang)} ${a.tags.join(" ")}`).includes(needle)));
  }, [all, cat, tag, q, lang]);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
      active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"}`;
  const other: Lang = lang === "vi" ? "en" : "vi";

  return (
    <>
      <Header lang={lang} page="articles" altHref={articlesPath(other)} />
      <main className="min-h-[70vh] bg-paper pb-20 pt-16">
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-page px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
            <nav className="mb-4 text-sm text-mute" aria-label="Breadcrumb">
              <a href={homePath(lang)} className="hover:text-ink">{t(lang, "ar.home")}</a>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-ink">{t(lang, "ar.listTitle")}</span>
            </nav>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t(lang, "ar.listTitle")}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-mute">{t(lang, "ar.listLead")}</p>

            <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label={t(lang, "ar.listTitle")}>
                <button type="button" className={chip(!cat)} aria-pressed={!cat} onClick={() => setCat("")}>
                  {t(lang, "ar.allCats")} <span className="font-mono text-xs opacity-70">{all.length}</span>
                </button>
                {data.categories.map((c) => (
                  <button key={c.slug} type="button" className={chip(cat === c.slug)} aria-pressed={cat === c.slug}
                    onClick={() => setCat(cat === c.slug ? "" : c.slug)}>
                    {categoryName(c, lang)} <span className="font-mono text-xs opacity-70">{counts.get(c.slug) ?? 0}</span>
                  </button>
                ))}
              </div>
              <label className="relative block w-full lg:w-72">
                <span className="sr-only">{t(lang, "ar.search")}</span>
                <IconSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "ar.search")}
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sonar focus:ring-2 focus:ring-sonar/20" />
              </label>
            </div>
            {tag && (
              <p className="mt-4 text-sm text-mute">
                {t(lang, "ar.tag")}: <span className="rounded bg-sonar-100 px-1.5 py-0.5 font-medium text-ink">#{tag}</span>{" "}
                <button type="button" onClick={() => setTag("")} className="ml-1 underline hover:text-ink">{t(lang, "ar.clearTag")}</button>
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-page px-4 pt-10 sm:px-6">
          {shown.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a, i) => (
                <ArticleCard key={a.slug} lang={lang} article={a} categories={data.categories}
                  wide={i === 0 && !cat && !tag && !q && shown.length > 2} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-mute">
              {all.length ? t(lang, "ar.noMatch") : t(lang, "ar.empty")}
            </p>
          )}
        </div>
      </main>
      <Footer lang={lang} catalog={catalog} offline={false} />
    </>
  );
}
