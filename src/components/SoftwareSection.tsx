import { useMemo, useState } from "react";
import type { Catalog, Lang } from "../lib/types";
import { appNumbers, demosByApp, filterApps, pick } from "../lib/catalog";
import { t } from "../lib/i18n";
import AppCard from "./AppCard";
import { GroupIcon, IconSearch } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function SoftwareSection({ lang, catalog, focus }: { lang: Lang; catalog: Catalog; focus: string | null }) {
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const numbers = useMemo(() => appNumbers(catalog), [catalog]);
  const demos = useMemo(() => demosByApp(catalog), [catalog]);
  const groups = useMemo(() => filterApps(catalog, group, query, lang), [catalog, group, query, lang]);
  const total = catalog.groups.reduce((n, g) => n + g.apps.length, 0);

  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
      active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"}`;

  return (
    <section id="software" className="scroll-mt-16 bg-paper py-20 sm:py-24" aria-labelledby="software-title">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <SectionHeading id="software" kicker={t(lang, "sw.kicker")} title={t(lang, "sw.title")} lead={t(lang, "sw.lead")} />

        <div className="reveal mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t(lang, "sw.title")}>
            <button type="button" role="tab" aria-selected={group === "all"} className={chip(group === "all")} onClick={() => setGroup("all")}>
              {t(lang, "sw.all")} <span className="font-mono text-xs opacity-60">{total}</span>
            </button>
            {catalog.groups.map((g) => (
              <button key={g.slug} type="button" role="tab" aria-selected={group === g.slug} className={chip(group === g.slug)}
                onClick={() => setGroup(g.slug)}>
                <GroupIcon name={g.icon} size={16} />
                {pick(g, "name", lang)} <span className="font-mono text-xs opacity-60">{g.apps.length}</span>
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:w-72">
            <span className="sr-only">{t(lang, "sw.search")}</span>
            <IconSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(lang, "sw.search")}
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-mute focus:border-sonar focus:ring-2 focus:ring-sonar/20" />
          </label>
        </div>

        {groups.length === 0 && <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-mute">{t(lang, "sw.empty")}</p>}

        <div className="space-y-14">
          {groups.map((g) => (
            <div key={g.slug} id={`group-${g.slug}`} className="scroll-mt-24">
              <div className="reveal mb-5 flex items-baseline gap-4 border-b border-line pb-3">
                <span className="font-mono text-sm font-medium text-signal">{g.code}</span>
                <div>
                  <h3 className="text-xl font-semibold text-ink">{pick(g, "name", lang)}</h3>
                  <p className="mt-0.5 text-sm text-mute">{pick(g, "desc", lang)}</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.apps.map((a) => (
                  <AppCard key={a.slug} lang={lang} app={a} group={g} no={numbers[a.slug]} highlighted={focus === a.slug} demo={demos[a.slug]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
