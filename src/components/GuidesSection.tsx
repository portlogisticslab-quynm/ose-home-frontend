import type { Catalog, Lang } from "../lib/types";
import { appNumbers, pick } from "../lib/catalog";
import { t } from "../lib/i18n";
import { IconFilePdf } from "./Icons";
import SectionHeading from "./SectionHeading";
import { track, urlKey } from "../lib/track";

export default function GuidesSection({ lang, catalog }: { lang: Lang; catalog: Catalog }) {
  const numbers = appNumbers(catalog);
  return (
    <section id="guides" className="scroll-mt-16 bg-white py-20 sm:py-24" aria-labelledby="guides-title">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <SectionHeading id="guides" kicker={t(lang, "gd.kicker")} title={t(lang, "gd.title")} lead={t(lang, "gd.lead")} />

        <div className="grid gap-6 lg:grid-cols-2">
          {catalog.groups.map((g) => (
            <div key={g.slug} className="reveal overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-3">
                <span className="font-mono text-xs font-medium text-signal">{g.code}</span>
                <h3 className="text-sm font-semibold text-ink">{pick(g, "name", lang)}</h3>
              </div>
              <ul className="divide-y divide-line">
                {g.apps.map((a) => (
                  <li key={a.slug} className="grid grid-cols-[2.25rem_1fr] gap-x-2 px-4 py-3">
                    <span className="pt-0.5 font-mono text-xs text-mute">{String(numbers[a.slug]).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <a href={`#app-${a.slug}`} className="text-sm font-medium text-ink hover:text-sonar">{a.name}</a>
                      {a.guides.length > 0 ? (
                        a.guides.map((gd) => (
                          <a key={gd.id} href={gd.url} target="_blank" rel="noopener noreferrer" onClick={() => track("guide", a.slug, a.name, lang)}
                            className="mt-1 flex items-start gap-1.5 break-all font-mono text-[11.5px] leading-snug text-sonar hover:text-ink-700 hover:underline">
                            <IconFilePdf size={15} className="mt-px shrink-0 text-signal" />
                            {gd.title}
                          </a>
                        ))
                      ) : (
                        <span className="mt-1 inline-block rounded bg-paper px-1.5 py-0.5 text-[11px] text-mute">{t(lang, "gd.pending")}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {catalog.guides.length > 0 && (
            <div className="reveal overflow-hidden rounded-xl border border-line">
              <div className="border-b border-line bg-paper px-4 py-3"><h3 className="text-sm font-semibold text-ink">{t(lang, "gd.other")}</h3></div>
              <ul className="divide-y divide-line">
                {catalog.guides.map((gd) => (
                  <li key={gd.id} className="px-4 py-3">
                    <a href={gd.url} target="_blank" rel="noopener noreferrer" onClick={() => track("guide", urlKey("guide", gd.url), gd.title, lang)} className="flex items-start gap-1.5 break-all font-mono text-[11.5px] text-sonar hover:underline">
                      <IconFilePdf size={15} className="shrink-0 text-signal" /> {gd.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
