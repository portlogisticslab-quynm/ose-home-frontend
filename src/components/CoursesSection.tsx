import { useState } from "react";
import type { Catalog, Lang } from "../lib/types";
import { hostOf, pick } from "../lib/catalog";
import { t } from "../lib/i18n";
import { IconArrowUpRight, IconFolder, LinkKindIcon } from "./Icons";
import RegisterForm from "./RegisterForm";
import SectionHeading from "./SectionHeading";
import { track, urlKey } from "../lib/track";

export default function CoursesSection({ lang, catalog }: { lang: Lang; catalog: Catalog }) {
  const [course, setCourse] = useState("");
  const contacts = catalog.links.filter((l) => ["email", "phone", "zalo"].includes(l.kind));

  const registerFor = (title: string) => {
    setCourse(title);
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="courses" className="scroll-mt-16 bg-paper py-20 sm:py-24" aria-labelledby="courses-title">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <SectionHeading id="courses" kicker={t(lang, "cs.kicker")} title={t(lang, "cs.title")} lead={t(lang, "cs.lead")} />
        {catalog.courses.length === 0 && <p className="text-mute">{t(lang, "cs.empty")}</p>}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {catalog.courses.map((c, i) => {
            const title = pick(c, "title", lang);
            return (
              <article key={c.id} className="reveal flex gap-5 rounded-xl border border-line bg-white p-6 shadow-card">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-signal-100 text-signal-600">
                  <IconFolder size={22} />
                  <span className="mt-0.5 font-mono text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-mute">{pick(c, "desc", lang)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" title={hostOf(c.url)}
                      onClick={() => track("course", urlKey("course", c.url + "|" + pick(c, "title", "vi")), pick(c, "title", "vi"), lang)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition hover:border-ink/40 hover:bg-paper">
                      {t(lang, "cs.open")} <IconArrowUpRight size={14} />
                    </a>
                    <button type="button" onClick={() => registerFor(title)}
                      className="inline-flex items-center whitespace-nowrap rounded-md bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-700">
                      {t(lang, "rg.cta")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div id="register" className="mt-16 grid scroll-mt-24 gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="reveal">
            <h3 className="text-2xl font-bold tracking-tight text-ink">{t(lang, "rg.title")}</h3>
            <p className="mt-3 text-base leading-relaxed text-mute">{t(lang, "rg.lead")}</p>
            {contacts.length > 0 && (
              <ul className="mt-6 space-y-2">
                {contacts.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} {...(/^(mailto|tel):/i.test(l.url) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className="inline-flex items-center gap-2.5 text-sm font-medium text-ink hover:text-sonar">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-signal-600 shadow-card"><LinkKindIcon kind={l.kind} size={16} /></span>
                      {pick(l, "label", lang)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="reveal">
            <RegisterForm lang={lang} catalog={catalog} course={course} onCourseChange={setCourse} />
          </div>
        </div>
      </div>
    </section>
  );
}
