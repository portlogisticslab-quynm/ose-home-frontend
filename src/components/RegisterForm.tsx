import { type FormEvent, useState } from "react";
import type { Catalog, Lang } from "../lib/types";
import { pick } from "../lib/catalog";
import { apiFetch, ApiError } from "../lib/api";
import { t } from "../lib/i18n";
import { IconCheck, LinkKindIcon } from "./Icons";

const EMAIL_RE = /^[^@\s<>]+@[^@\s<>]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9 .()-]{6,18}[0-9]$/;

interface Props { lang: Lang; catalog: Catalog; course: string; onCourseChange: (v: string) => void }

type State = "idle" | "sending" | "ok" | "error";

const empty = { full_name: "", email: "", phone: "", occupation: "", message: "", consent: false, website: "" };

/** Course registration form. Sends to POST /api/v1/registrations; the admin reviews it in Admin › Đăng ký khoá học. */
export default function RegisterForm({ lang, catalog, course, onCourseChange }: Props) {
  const [f, setF] = useState(empty);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof empty, v: string | boolean) => {
    setF((cur) => ({ ...cur, [k]: v }));
    if (state === "error") setState("idle");
  };
  const contacts = catalog.links.filter((l) => ["email", "phone", "zalo"].includes(l.kind));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.full_name.trim() || !f.email.trim() || !f.phone.trim() || !course.trim()) { setState("error"); setMsg(t(lang, "rg.required")); return; }
    if (!EMAIL_RE.test(f.email.trim())) { setState("error"); setMsg(t(lang, "rg.badEmail")); return; }
    if (!PHONE_RE.test(f.phone.trim())) { setState("error"); setMsg(t(lang, "rg.badPhone")); return; }
    if (!f.consent) { setState("error"); setMsg(t(lang, "rg.needConsent")); return; }
    setState("sending"); setMsg("");
    try {
      await apiFetch("/api/v1/registrations", {
        method: "POST", timeoutMs: 15000,
        body: JSON.stringify({ ...f, course: course.trim(), lang }),
      });
      setState("ok");
      setF(empty);
      onCourseChange("");
    } catch (err) {
      setState("error");
      setMsg(err instanceof ApiError && err.status && err.status < 500 ? err.message : t(lang, "rg.err"));
    }
  };

  const input = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-mute/70 focus:border-sonar focus:ring-2 focus:ring-sonar/20";
  const label = "block text-sm font-medium text-ink";
  const star = <span className="text-signal"> *</span>;

  if (state === "ok") {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center shadow-card" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sonar-100 text-sonar"><IconCheck size={24} /></span>
        <p className="mt-4 font-semibold text-ink">{t(lang, "rg.ok")}</p>
        <button type="button" onClick={() => setState("idle")} className="mt-5 text-sm font-medium text-sonar hover:text-ink">{t(lang, "rg.again")}</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>{t(lang, "rg.name")}{star}
          <input className={input} autoComplete="name" maxLength={120} value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </label>
        <label className={label}>{t(lang, "rg.email")}{star}
          <input className={input} type="email" autoComplete="email" maxLength={200} value={f.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className={label}>{t(lang, "rg.phone")}{star}
          <input className={input} type="tel" autoComplete="tel" maxLength={30} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className={label}>{t(lang, "rg.occupation")}
          <input className={input} autoComplete="organization-title" maxLength={120} placeholder={t(lang, "rg.occupationPh")} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </label>
        <label className={`${label} sm:col-span-2`}>{t(lang, "rg.course")}{star}
          <input className={input} list="course-options" maxLength={200} placeholder={t(lang, "rg.coursePh")} value={course} onChange={(e) => onCourseChange(e.target.value)} />
          <datalist id="course-options">
            {catalog.courses.map((c) => <option key={c.id} value={pick(c, "title", lang)} />)}
          </datalist>
        </label>
        <label className={`${label} sm:col-span-2`}>{t(lang, "rg.message")} <span className="font-normal text-mute">{t(lang, "rg.optional")}</span>
          <textarea className={input} rows={3} maxLength={2000} value={f.message} onChange={(e) => set("message", e.target.value)} />
        </label>
        {/* Honeypot: hidden from people, bots fill it in */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden"
          value={f.website} onChange={(e) => set("website", e.target.value)} />
        <label className="flex items-start gap-3 text-sm text-ink/85 sm:col-span-2">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
          <span>{t(lang, "rg.consent")}{star}</span>
        </label>
      </div>

      {state === "error" && msg && (
        <div className="mt-4 rounded-lg bg-signal-100 px-3 py-2 text-sm text-signal-600" role="alert">
          {msg}
          {msg === t(lang, "rg.err") && contacts.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {contacts.map((l) => (
                <a key={l.id} href={l.url} className="inline-flex items-center gap-1 font-medium underline">
                  <LinkKindIcon kind={l.kind} size={14} /> {pick(l, "label", lang)}
                </a>
              ))}
            </span>
          )}
        </div>
      )}

      <button type="submit" disabled={state === "sending"}
        className="mt-5 w-full rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-signal-600 disabled:opacity-60 sm:w-auto">
        {state === "sending" ? t(lang, "rg.sending") : t(lang, "rg.submit")}
      </button>
    </form>
  );
}
