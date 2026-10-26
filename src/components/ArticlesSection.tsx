import type { ArticlesIndex, Lang } from "../lib/types";
import { forLang } from "../lib/articles";
import { articlesPath, t } from "../lib/i18n";
import ArticleCard from "./ArticleCard";
import SectionHeading from "./SectionHeading";

/** Home page: the three newest articles. Hidden while there is no article in this language. */
export default function ArticlesSection({ lang, data }: { lang: Lang; data: ArticlesIndex }) {
  const list = forLang(data.articles, lang).slice(0, 3);
  if (!list.length) return null;
  return (
    <section id="articles" className="scroll-mt-16 bg-paper py-20 sm:py-24" aria-labelledby="articles-title">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="articles" kicker={t(lang, "ar.kicker")} title={t(lang, "ar.title")} lead={t(lang, "ar.lead")} />
          <a href={articlesPath(lang)} className="reveal mb-10 inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40">
            {t(lang, "ar.all")} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => <ArticleCard key={a.slug} lang={lang} article={a} categories={data.categories} />)}
        </div>
      </div>
    </section>
  );
}
