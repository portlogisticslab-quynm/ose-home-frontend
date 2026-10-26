import type { ArticleSummary, CategoryItem, Lang } from "../lib/types";
import { categoryName, categoryOf, coverSrc, minutes, summary, title } from "../lib/articles";
import { articlePath, formatDate, t } from "../lib/i18n";

/** Placeholder when an article has no cover: navy panel with the category name and the OSE ring. */
function CoverPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative flex h-full w-full items-end overflow-hidden bg-ink-900 p-4">
      <svg viewBox="0 0 200 112" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="ac-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="#79D5CB" strokeOpacity=".09" />
          </pattern>
        </defs>
        <rect width="200" height="112" fill="url(#ac-grid)" />
        <path d="M171.6 74.3A30 30 0 1 1 171.6 37.7" fill="none" stroke="#E8613A" strokeWidth="5" strokeLinecap="round" opacity=".85" />
        <path d="M128 56H168" stroke="#79D5CB" strokeWidth="3" strokeLinecap="round" />
        <circle cx="128" cy="56" r="4.5" fill="#fff" />
        <circle cx="178" cy="56" r="4.5" fill="#79D5CB" />
      </svg>
      <span className="relative font-mono text-[11px] uppercase tracking-[.16em] text-sonar-300">{label}</span>
    </div>
  );
}

interface Props {
  lang: Lang;
  article: ArticleSummary;
  categories: CategoryItem[];
  /** Larger first card on the list page. */
  wide?: boolean;
  mediaBase?: string;
}

export default function ArticleCard({ lang, article: a, categories, wide, mediaBase = "" }: Props) {
  const cat = categoryOf(categories, a.category);
  const href = articlePath(lang, a.slug);
  const src = coverSrc(a.cover, mediaBase);
  return (
    <article className={`reveal group/card flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift ${
      wide ? "md:col-span-2 md:flex-row" : ""}`}>
      <a href={href} tabIndex={-1} aria-hidden="true" className={`block shrink-0 overflow-hidden bg-paper ${wide ? "aspect-[16/9] md:aspect-auto md:w-[55%]" : "aspect-[16/9]"}`}>
        {src
          ? <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.03]" />
          : <CoverPlaceholder label={categoryName(cat, lang) || "OSE"} />}
      </a>
      <div className={`flex flex-1 flex-col p-5 ${wide ? "md:p-7" : ""}`}>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mute">
          {cat && <span className="rounded bg-signal-100 px-1.5 py-0.5 font-medium text-signal-600">{categoryName(cat, lang)}</span>}
          <time dateTime={a.published_at ?? undefined}>{formatDate(lang, a.published_at)}</time>
          <span aria-hidden="true">·</span>
          <span>{minutes(a, lang)} {t(lang, "ar.minRead")}</span>
        </p>
        <h3 className={`mt-3 font-semibold leading-snug text-ink ${wide ? "text-xl md:text-2xl" : "text-[1.05rem]"}`}>
          <a href={href} className="hover:text-signal-600">{title(a, lang)}</a>
        </h3>
        {summary(a, lang) && (
          <p className={`mt-2 flex-1 text-sm leading-relaxed text-mute ${wide ? "line-clamp-4" : "line-clamp-3"}`}>{summary(a, lang)}</p>
        )}
        <a href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-signal-600">
          {t(lang, "ar.read")} <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
