import { useMemo } from "react";
import type { Article, ArticlesIndex, Catalog, Lang } from "../lib/types";
import { categoryName, categoryOf, coverSrc, forLang, hasEn, minutes, related, summary, title } from "../lib/articles";
import { pick } from "../lib/catalog";
import { renderMarkdown } from "../lib/markdown";
import { appPath, articlePath, articlesPath, formatDate, homePath, t } from "../lib/i18n";
import { absoluteUrl } from "../lib/share";
import { useReveal } from "../lib/useReveal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ArticleCard from "../components/ArticleCard";
import ShareMenu from "../components/ShareMenu";
import { IconArrowUpRight } from "../components/Icons";

interface Props {
  lang: Lang;
  article: Article;
  index: ArticlesIndex;
  catalog: Catalog;
  /** Prefix for /media/ images (empty on the public site; the API in the admin preview). */
  mediaBase?: string;
  /** Admin preview: no header/footer. */
  preview?: boolean;
}

export function useArticleBody({ article, lang, mediaBase = "" }: { article: Article; lang: Lang; mediaBase?: string }) {
  const md = lang === "en" && hasEn(article) && article.body_en ? article.body_en : article.body_vi;
  const r = useMemo(() => renderMarkdown(md, { mediaBase }), [md, mediaBase]);
  return { ...r, element: <div className="ose-prose" dangerouslySetInnerHTML={{ __html: r.html }} /> };
}

export default function ArticlePage({ lang, article: a, index, catalog, mediaBase = "", preview }: Props) {
  useReveal();
  const body = useArticleBody({ article: a, lang, mediaBase });
  const cat = categoryOf(index.categories, a.category);
  const other: Lang = lang === "vi" ? "en" : "vi";
  const altHref = other === "en" && !hasEn(a) ? articlesPath("en") : articlePath(other, a.slug);
  const url = absoluteUrl(articlePath(lang, a.slug));
  const toc = body.headings.filter((h) => h.level <= 3);
  const apps = catalog.groups.flatMap((g) => g.apps.map((x) => ({ app: x, group: g })))
    .filter(({ app }) => a.apps.includes(app.slug));
  const more = related(forLang(index.articles, lang), a, 3);
  const cover = coverSrc(a.cover, mediaBase);

  const content = (
    <main className={preview ? "bg-white" : "bg-white pb-16 pt-16"}>
      <div className={`mx-auto grid max-w-page gap-10 px-4 sm:px-6 ${toc.length > 1 && !preview ? "lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12" : ""}`}>
        <div className="mx-auto w-full min-w-0 max-w-3xl">
      <header className="pt-10 sm:pt-14">
        {!preview && (
          <nav className="mb-5 text-sm text-mute" aria-label="Breadcrumb">
            <a href={homePath(lang)} className="hover:text-ink">{t(lang, "ar.home")}</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <a href={articlesPath(lang)} className="hover:text-ink">{t(lang, "ar.listTitle")}</a>
            {cat && <>
              <span className="mx-2" aria-hidden="true">/</span>
              <a href={`${articlesPath(lang)}?cm=${cat.slug}`} className="hover:text-ink">{categoryName(cat, lang)}</a>
            </>}
          </nav>
        )}
        {cat && <p className="font-mono text-xs uppercase tracking-[.16em] text-signal">{categoryName(cat, lang)}</p>}
        <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.6rem]">{title(a, lang)}</h1>
        {summary(a, lang) && <p className="mt-4 text-lg leading-relaxed text-mute">{summary(a, lang)}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm text-mute">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {a.author && <span className="font-medium text-ink">{a.author}</span>}
            {a.author && <span aria-hidden="true">·</span>}
            <time dateTime={a.published_at ?? undefined}>{formatDate(lang, a.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{minutes(a, lang)} {t(lang, "ar.minRead")}</span>
          </p>
          {!preview && <ShareMenu lang={lang} url={url} title={title(a, lang)} />}
        </div>
      </header>

      {cover && (
        <figure className="mt-8">
          <img src={cover} alt={title(a, lang)} className="aspect-[16/9] w-full rounded-xl object-cover" decoding="async" />
        </figure>
      )}

          <div className="mt-10">{body.element}</div>

          {a.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              <span className="mr-1 text-sm text-mute">{t(lang, "ar.tag")}:</span>
              {a.tags.map((x) => (
                <a key={x} href={`${articlesPath(lang)}?tag=${encodeURIComponent(x)}`}
                  className="rounded-full bg-paper px-3 py-1 text-sm text-ink transition hover:bg-sonar-100">#{x}</a>
              ))}
            </div>
          )}

          {apps.length > 0 && (
            <section className="mt-10" aria-labelledby="rel-apps">
              <h2 id="rel-apps" className="mb-4 text-lg font-semibold text-ink">{t(lang, "ar.relatedApps")}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {apps.map(({ app }) => (
                  <li key={app.slug} className="rounded-xl border border-line p-4">
                    <a href={appPath(lang, app.slug)} className="font-semibold text-ink hover:text-signal-600">{app.name}</a>
                    <p className="mt-1 line-clamp-2 text-sm text-mute">{pick(app, "desc", lang)}</p>
                    {app.url && (
                      <a href={app.url} target="_blank" rel="noopener"
                        className="mt-3 inline-flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700">
                        {t(lang, "ar.openApp")} <IconArrowUpRight size={14} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {toc.length > 1 && !preview && (
          <aside className="hidden lg:block" aria-label={t(lang, "ar.toc")}>
            <div className="sticky top-24 mt-14">
              <p className="mb-3 font-mono text-xs uppercase tracking-[.16em] text-mute">{t(lang, "ar.toc")}</p>
              <ol className="space-y-2 border-l border-line text-sm">
                {toc.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "pl-7" : "pl-4"}>
                    <a href={`#${h.id}`} className="-ml-px block border-l border-transparent text-mute hover:border-signal hover:text-ink">{h.text}</a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>

      {!preview && more.length > 0 && (
        <section className="mt-16 bg-paper py-14" aria-labelledby="rel-articles">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 id="rel-articles" className="text-2xl font-bold tracking-tight text-ink">{t(lang, "ar.related")}</h2>
              <a href={articlesPath(lang)} className="text-sm font-semibold text-ink hover:text-signal-600">{t(lang, "ar.back")} →</a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((x) => <ArticleCard key={x.slug} lang={lang} article={x} categories={index.categories} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );

  if (preview) return content;
  return (
    <>
      <Header lang={lang} page="articles" altHref={altHref} />
      {content}
      <Footer lang={lang} catalog={catalog} offline={false} />
    </>
  );
}
