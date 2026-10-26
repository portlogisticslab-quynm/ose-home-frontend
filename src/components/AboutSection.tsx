import type { Catalog, LinkItem, Lang } from "../lib/types";
import { hostOf, pick } from "../lib/catalog";
import { t } from "../lib/i18n";
import { IconArrowUpRight, LinkKindIcon } from "./Icons";
import SectionHeading from "./SectionHeading";

const CONTACT_KINDS = new Set(["email", "phone", "zalo"]);

/** mailto:/tel: open in the same tab (mail app / dialer); web links in a new tab. */
function linkProps(url: string) {
  return /^(mailto|tel):/i.test(url) ? {} : { target: "_blank", rel: "noopener noreferrer me" };
}

function subtitle(l: LinkItem): string {
  if (/^mailto:/i.test(l.url)) return "Email";
  if (/^tel:/i.test(l.url)) return "Hotline";
  return hostOf(l.url);
}

export default function AboutSection({ lang, catalog }: { lang: Lang; catalog: Catalog }) {
  const contacts = catalog.links.filter((l) => CONTACT_KINDS.has(l.kind));
  const others = catalog.links.filter((l) => !CONTACT_KINDS.has(l.kind));
  return (
    <section id="about" className="scroll-mt-16 bg-white py-20 sm:py-24" aria-labelledby="about-title">
      <div className="mx-auto grid max-w-page gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading id="about" kicker={t(lang, "ab.kicker")} title={t(lang, "ab.title")} />
          <div className="reveal space-y-4 text-base leading-relaxed text-ink/85">
            <p>{t(lang, "ab.p1")}</p>
            <p>{t(lang, "ab.p2")}</p>
          </div>
        </div>

        <div className="reveal space-y-8 lg:pt-14">
          {contacts.length > 0 && (
            <div id="contact" className="scroll-mt-24">
              <p className="mb-4 font-mono text-xs uppercase tracking-[.18em] text-mute">{t(lang, "ab.contact")}</p>
              <ul className="overflow-hidden rounded-xl border border-line">
                {contacts.map((l) => (
                  <li key={l.id} className="border-b border-line last:border-b-0">
                    <a href={l.url} {...linkProps(l.url)}
                      className="group flex items-center gap-4 px-4 py-3 transition hover:bg-paper">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal-100 text-signal-600">
                        <LinkKindIcon kind={l.kind} size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">{pick(l, "label", lang)}</span>
                        <span className="block font-mono text-xs text-mute">{subtitle(l)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[.18em] text-mute">{t(lang, "ab.links")}</p>
              <ul className="space-y-3">
                {others.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} {...linkProps(l.url)}
                      className="group flex items-center gap-4 rounded-xl border border-line p-4 transition hover:border-ink/30 hover:shadow-card">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white"><LinkKindIcon kind={l.kind} size={20} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">{pick(l, "label", lang)}</span>
                        <span className="block truncate font-mono text-xs text-mute">{hostOf(l.url)}</span>
                      </span>
                      <IconArrowUpRight size={18} className="text-mute transition group-hover:text-signal" />
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
