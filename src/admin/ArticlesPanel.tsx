import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiBase, apiFetch } from "../lib/api";
import { articlePath } from "../lib/i18n";
import { readingMinutes, slugify } from "../lib/markdown";
import { seedToCatalog } from "../lib/catalog";
import { SITE_URL } from "../lib/share";
import type { Article, ArticlesIndex, Catalog, CategoryItem, Lang, Seed } from "../lib/types";
import seed from "../data/catalog.fallback.json";
import ArticlePage from "../pages/ArticlePage";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn, inputCls } from "./ui";

/** Row as returned by GET /api/v1/admin/articles (comma-separated tags/apps, category id). */
interface Row {
  id?: number; slug: string; status: "draft" | "published"; published_at: string | null; category_id: number | null;
  title_vi: string; title_en: string; summary_vi: string; summary_en: string; body_vi: string; body_en: string;
  cover: string; tags: string; app_slugs: string; seo_title_vi: string; seo_title_en: string; author: string;
  updated_at?: string; created_at?: string;
}
interface AppRef { id: number; slug: string; name: string }

const EMPTY: Row = {
  slug: "", status: "draft", published_at: null, category_id: null, title_vi: "", title_en: "", summary_vi: "", summary_en: "",
  body_vi: "", body_en: "", cover: "", tags: "", app_slugs: "", seo_title_vi: "", seo_title_en: "", author: "",
};
const FIELDS = Object.keys(EMPTY) as Array<keyof Row>;
const MEDIA = () => `${apiBase()}/api/v1`;

const asUtc = (iso: string | null) => (iso && !/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? `${iso}Z` : iso);
const isFuture = (iso: string | null) => !!iso && new Date(asUtc(iso)!).getTime() > Date.now();
const fmt = (iso: string | null | undefined) => (iso ? new Date(asUtc(iso)!).toLocaleString("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
/** ISO -> value for <input type="datetime-local"> (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(asUtc(iso)!);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function statusOf(r: Row): { label: string; cls: string } {
  if (r.status === "draft") return { label: "Nháp", cls: "bg-paper text-mute" };
  if (isFuture(r.published_at)) return { label: "Hẹn giờ", cls: "bg-amber-100 text-amber-800" };
  return { label: "Đã đăng", cls: "bg-sonar-100 text-ink" };
}

// ---------------------------------------------------------------- Markdown toolbar
type Tool = [label: string, title: string, before: string, after: string, placeholder: string, block?: boolean];
const TOOLS: Tool[] = [
  ["B", "Chữ đậm", "**", "**", "chữ đậm"],
  ["I", "Chữ nghiêng", "*", "*", "chữ nghiêng"],
  ["H2", "Tiêu đề mục", "## ", "", "Tiêu đề mục", true],
  ["H3", "Tiêu đề nhỏ", "### ", "", "Tiêu đề nhỏ", true],
  ["• List", "Danh sách", "- ", "", "Mục 1", true],
  ["1. List", "Danh sách đánh số", "1. ", "", "Bước 1", true],
  ["❝", "Trích dẫn", "> ", "", "Trích dẫn", true],
  ["Link", "Liên kết", "[", "](https://)", "chữ hiển thị"],
  ["Bảng", "Bảng", "| Cột 1 | Cột 2 |\n|---|---|\n| ", " |  |", "giá trị", true],
  ["Code", "Đoạn mã", "```\n", "\n```", "code", true],
];

function MarkdownEditor({ value, onChange, onUpload, label }: {
  value: string; onChange: (v: string) => void; onUpload: (f: File) => Promise<string | null>; label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const insert = (before: string, after = "", placeholder = "", block = false) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || placeholder;
    const needNl = block && s > 0 && value[s - 1] !== "\n" ? "\n\n" : "";
    const text = `${needNl}${before}${sel}${after}`;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const start = s + needNl.length + before.length;
      ta.setSelectionRange(start, start + sel.length);
    });
  };

  const upload = async (f: File) => {
    setUploading(true);
    const url = await onUpload(f);
    setUploading(false);
    if (url) insert(`![${f.name.replace(/\.[^.]+$/, "")}](${url})`, "", "", true);
  };

  return (
    <div className="rounded-lg border border-line bg-white focus-within:border-sonar focus-within:ring-2 focus-within:ring-sonar/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        {TOOLS.map(([lab, title, b, a, ph, block]) => (
          <button key={lab} type="button" title={title} onClick={() => insert(b, a, ph, block)}
            className="rounded px-2 py-1 font-mono text-xs text-ink hover:bg-paper">{lab}</button>
        ))}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="rounded px-2 py-1 text-xs font-medium text-sonar hover:bg-paper">{uploading ? "Đang tải ảnh…" : "+ Ảnh"}</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
        <span className="ml-auto pr-1 text-[11px] text-mute">Markdown · dán link YouTube trên một dòng để nhúng video</span>
      </div>
      <textarea ref={ref} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} spellCheck
        className="block min-h-[26rem] w-full resize-y rounded-b-lg bg-white px-3 py-3 font-mono text-[13px] leading-relaxed outline-none"
        onPaste={(e) => {
          const f = Array.from(e.clipboardData.files as FileList).find((x) => x.type.startsWith("image/"));
          if (f) { e.preventDefault(); void upload(f); }
        }}
        onDrop={(e) => {
          const f = Array.from(e.dataTransfer.files as FileList).find((x) => x.type.startsWith("image/"));
          if (f) { e.preventDefault(); void upload(f); }
        }} />
    </div>
  );
}

// ---------------------------------------------------------------- editor
function Editor({ session, onAuthError, initial, categories, apps, onClose, onSaved }: {
  session: Session; onAuthError: (e: unknown) => void; initial: Row; categories: CategoryItem[]; apps: AppRef[];
  onClose: () => void; onSaved: (r: Row) => void;
}) {
  const [row, setRow] = useState<Row>(initial);
  const [orig, setOrig] = useState<Row>(initial);
  const [lang, setLang] = useState<Lang>("vi");
  const [view, setView] = useState<"split" | "write" | "preview">("split");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [appQ, setAppQ] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const dirty = FIELDS.some((k) => (row[k] ?? "") !== (orig[k] ?? ""));
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Row>(k: K, v: Row[K]) => setRow((r) => ({ ...r, [k]: v }));
  const setTitleVi = (v: string) => setRow((r) => ({ ...r, title_vi: v, slug: slugTouched ? r.slug : slugify(v) }));

  const upload = useCallback(async (f: File): Promise<string | null> => {
    setErr("");
    try {
      const r = await apiFetch<{ url: string }>(`/api/v1/admin/media?filename=${encodeURIComponent(f.name)}`, {
        method: "POST", body: f, token: session.token, timeoutMs: 60000,
        headers: { "Content-Type": f.type || "application/octet-stream" },
      });
      return r.url;
    } catch (e) { onAuthError(e); setErr(e instanceof ApiError ? e.message : "Không tải được ảnh."); return null; }
  }, [session.token, onAuthError]);

  const selectedApps = useMemo(() => row.app_slugs.split(",").map((x) => x.trim()).filter(Boolean), [row.app_slugs]);
  const toggleApp = (slug: string) => {
    const next = selectedApps.includes(slug) ? selectedApps.filter((x) => x !== slug) : [...selectedApps, slug];
    set("app_slugs", next.join(", "));
  };

  const save = async (status?: Row["status"]) => {
    setErr(""); setOk("");
    const next = { ...row, ...(status ? { status } : {}) };
    if (!next.title_vi.trim()) { setErr("Cần có tiêu đề tiếng Việt."); setLang("vi"); return; }
    if (!next.slug.trim()) { setErr("Cần có slug (đường dẫn)."); return; }
    const payload: Partial<Row> = {};
    for (const k of FIELDS) {
      if (!orig.id || (next[k] ?? "") !== (orig[k] ?? "")) (payload as Record<string, unknown>)[k] = next[k];
    }
    setSaving(true);
    try {
      const saved = orig.id
        ? await apiFetch<Row>(`/api/v1/admin/articles/${orig.id}`, { method: "PATCH", body: JSON.stringify(payload), token: session.token })
        : await apiFetch<Row>("/api/v1/admin/articles", { method: "POST", body: JSON.stringify(payload), token: session.token });
      setRow(saved); setOrig(saved); setSlugTouched(true);
      setOk(saved.status === "published"
        ? (isFuture(saved.published_at) ? `Đã lưu. Bài sẽ hiện lúc ${fmt(saved.published_at)} (sau lần build kế tiếp).`
          : "Đã lưu. Trang công khai cập nhật sau khoảng 2–3 phút.")
        : "Đã lưu nháp.");
      onSaved(saved);
    } catch (e) {
      onAuthError(e);
      setErr(e instanceof ApiError ? e.message : "Lỗi kết nối");
    } finally { setSaving(false); }
  };

  const close = () => { if (!dirty || window.confirm("Bài viết có thay đổi chưa lưu. Thoát không lưu?")) onClose(); };

  // Preview data in the public page format
  const preview: Article = useMemo(() => {
    const cat = categories.find((c) => c.id === row.category_id);
    return {
      id: row.id ?? 0, slug: row.slug || "xem-truoc", published_at: asUtc(row.published_at) ?? new Date().toISOString(),
      updated_at: null, category: cat?.slug ?? null, title_vi: row.title_vi || "(Chưa có tiêu đề)", title_en: row.title_en,
      summary_vi: row.summary_vi, summary_en: row.summary_en, body_vi: row.body_vi, body_en: row.body_en, cover: row.cover,
      tags: row.tags.split(",").map((x) => x.trim()).filter(Boolean), apps: selectedApps,
      seo_title_vi: row.seo_title_vi, seo_title_en: row.seo_title_en, author: row.author || session.username,
      minutes_vi: readingMinutes(row.body_vi), minutes_en: readingMinutes(row.body_en),
    };
  }, [row, categories, selectedApps, session.username]);
  const catalog: Catalog = useMemo(() => seedToCatalog(seed as Seed), []);
  const index: ArticlesIndex = useMemo(() => ({ categories, articles: [] }), [categories]);

  const live = orig.id && orig.status === "published" && !isFuture(orig.published_at);
  const k = (f: "title" | "summary" | "body" | "seo_title") => `${f}_${lang}` as keyof Row;
  const label = "mb-1 block text-sm font-medium text-ink";
  const st = statusOf(orig.id ? orig : row);

  return (
    <Panel title={orig.id ? `Sửa bài viết #${orig.id}` : "Bài viết mới"} actions={<>
      <span className={`rounded px-2 py-1 text-xs font-medium ${st.cls}`}>{orig.id ? st.label : "Chưa lưu"}</span>
      {live && <a className={btn.ghost} href={SITE_URL + articlePath("vi", orig.slug)} target="_blank" rel="noopener noreferrer">Xem trên web ↗</a>}
      <button className={btn.ghost} onClick={close}>← Danh sách</button>
      <button className={btn.ghost} disabled={saving} onClick={() => save("draft")}>Lưu nháp</button>
      <button className={btn.primary} disabled={saving} onClick={() => save("published")}>
        {saving ? "Đang lưu…" : orig.status === "published" ? "Cập nhật bài" : "Đăng bài"}</button></>}>
      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="ok">{ok}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---------- main column ---------- */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-line p-0.5" role="tablist" aria-label="Ngôn ngữ">
              {(["vi", "en"] as Lang[]).map((l) => (
                <button key={l} role="tab" aria-selected={lang === l} onClick={() => setLang(l)}
                  className={`rounded-md px-3 py-1.5 text-sm ${lang === l ? "bg-ink text-white" : "text-ink hover:bg-paper"}`}>
                  {l === "vi" ? "Tiếng Việt" : "English"}{l === "en" && !row.title_en && <span className="ml-1 text-xs opacity-60">(chưa dịch)</span>}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-line p-0.5">
              {([["write", "Soạn"], ["split", "Soạn + xem"], ["preview", "Xem trước"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-sm ${view === v ? "bg-paper font-medium text-ink" : "text-mute hover:text-ink"}`}>{l}</button>
              ))}
            </div>
          </div>

          {lang === "en" && (
            <p className="mb-3 rounded-lg bg-paper px-3 py-2 text-xs text-mute">
              Bản tiếng Anh là tuỳ chọn. Có tiêu đề tiếng Anh thì bài mới hiện trên trang /en/articles/; để trống thì bài chỉ có bản tiếng Việt.
            </p>
          )}

          {view !== "preview" && (
            <div className="space-y-4">
              <label className="block">
                <span className={label}>Tiêu đề ({lang.toUpperCase()}){lang === "vi" && <span className="text-signal"> *</span>}</span>
                <input className={`${inputCls} text-base font-semibold`} maxLength={200} value={String(row[k("title")] ?? "")}
                  onChange={(e) => (lang === "vi" ? setTitleVi(e.target.value) : set("title_en", e.target.value))} />
              </label>
              <label className="block">
                <span className={label}>Tóm tắt ({lang.toUpperCase()}) <span className="font-normal text-mute">— hiện trên thẻ bài viết và khi chia sẻ Facebook/Zalo</span></span>
                <textarea rows={2} maxLength={600} className={inputCls} value={String(row[k("summary")] ?? "")}
                  onChange={(e) => set(k("summary"), e.target.value as never)} />
              </label>
            </div>
          )}

          <div className={`mt-4 grid gap-4 ${view === "split" ? "2xl:grid-cols-2" : ""}`}>
            {view !== "preview" && (
              <div>
                <span className={label}>Nội dung ({lang.toUpperCase()})</span>
                <MarkdownEditor key={lang} label={`Nội dung ${lang}`} value={String(row[k("body")] ?? "")}
                  onChange={(v) => set(k("body"), v as never)} onUpload={upload} />
              </div>
            )}
            {view !== "write" && (
              <div className="min-w-0">
                <span className={label}>Xem trước ({lang.toUpperCase()})</span>
                <div className="max-h-[48rem] overflow-y-auto rounded-lg border border-line">
                  <ArticlePage lang={lang} article={preview} index={index} catalog={catalog} mediaBase={MEDIA()} preview />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- sidebar ---------- */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Đăng bài</p>
            <label className="block text-sm">
              <span className={label}>Ngày đăng</span>
              <input type="datetime-local" className={inputCls} value={toLocalInput(row.published_at)}
                onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              <span className="mt-1 block text-xs text-mute">Để trống = lúc bấm “Đăng bài”. Chọn ngày tương lai để hẹn giờ.</span>
            </label>
            <label className="mt-3 block text-sm">
              <span className={label}>Đường dẫn (slug) <span className="text-signal">*</span></span>
              <input className={`${inputCls} font-mono text-xs`} value={row.slug} maxLength={120}
                onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} />
              <span className="mt-1 block break-all font-mono text-[11px] text-mute">{SITE_URL.replace(/^https?:\/\//, "")}{articlePath("vi", row.slug || "…")}</span>
            </label>
            <label className="mt-3 block text-sm">
              <span className={label}>Tác giả</span>
              <input className={inputCls} value={row.author} maxLength={120} placeholder={session.username}
                onChange={(e) => set("author", e.target.value)} />
            </label>
          </div>

          <div className="rounded-xl border border-line p-4">
            <label className="block text-sm">
              <span className={label}>Chuyên mục</span>
              <select className={inputCls} value={row.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Không chọn —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_vi}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-sm">
              <span className={label}>Thẻ</span>
              <input className={inputCls} value={row.tags} maxLength={400} placeholder="AI, luồng tàu, mô phỏng"
                onChange={(e) => set("tags", e.target.value)} />
              <span className="mt-1 block text-xs text-mute">Cách nhau bằng dấu phẩy, tối đa 12 thẻ.</span>
            </label>
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className={label}>Ảnh bìa</p>
            {row.cover ? (
              <img src={row.cover.startsWith("/media/") ? MEDIA() + row.cover : row.cover} alt=""
                className="mb-2 aspect-[16/9] w-full rounded-lg border border-line object-cover" />
            ) : (
              <div className="mb-2 flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-line text-xs text-mute">Chưa có ảnh bìa</div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.ghost} onClick={() => coverRef.current?.click()}>Tải ảnh lên</button>
              {row.cover && <button type="button" className={btn.ghost} onClick={() => set("cover", "")}>Bỏ ảnh</button>}
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { const u = await upload(f); if (u) set("cover", u); } }} />
            <input className={`${inputCls} mt-2 font-mono text-xs`} placeholder="hoặc dán link https://…" value={row.cover}
              onChange={(e) => set("cover", e.target.value.trim())} />
            <span className="mt-1 block text-xs text-mute">Nên dùng ảnh ngang 1200×630, dưới 5 MB. Ảnh này cũng là ảnh khi chia sẻ link.</span>
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className={label}>Phần mềm liên quan <span className="font-normal text-mute">({selectedApps.length})</span></p>
            <input type="search" className={`${inputCls} mb-2`} placeholder="Tìm phần mềm…" value={appQ} onChange={(e) => setAppQ(e.target.value)} />
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1 text-sm">
              {apps.filter((a) => !appQ || a.name.toLowerCase().includes(appQ.toLowerCase()) || selectedApps.includes(a.slug))
                .map((a) => (
                  <li key={a.slug}>
                    <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-paper">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={selectedApps.includes(a.slug)} onChange={() => toggleApp(a.slug)} />
                      <span>{a.name}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-xl border border-line p-4">
            <p className={label}>SEO <span className="font-normal text-mute">(tuỳ chọn)</span></p>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-mute">Tiêu đề trên Google (VI) — để trống dùng tiêu đề bài</span>
              <input className={inputCls} maxLength={200} value={row.seo_title_vi} onChange={(e) => set("seo_title_vi", e.target.value)} />
            </label>
            <label className="mt-2 block text-sm">
              <span className="mb-1 block text-xs text-mute">Tiêu đề trên Google (EN)</span>
              <input className={inputCls} maxLength={200} value={row.seo_title_en} onChange={(e) => set("seo_title_en", e.target.value)} />
            </label>
          </div>
        </aside>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- list
export default function ArticlesPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [apps, setApps] = useState<AppRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [a, c, p] = await Promise.all([
        apiFetch<Row[]>("/api/v1/admin/articles", { token: session.token }),
        apiFetch<CategoryItem[]>("/api/v1/admin/categories", { token: session.token }),
        apiFetch<AppRef[]>("/api/v1/admin/apps", { token: session.token }),
      ]);
      setRows(a); setCats(c); setApps([...p].sort((x, y) => x.name.localeCompare(y.name)));
    } catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [session.token, onAuthError]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => [...rows]
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !q || `${r.title_vi} ${r.title_en} ${r.tags} ${r.slug}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.published_at ?? b.updated_at ?? "").localeCompare(a.published_at ?? a.updated_at ?? "") || (b.id ?? 0) - (a.id ?? 0)),
  [rows, filter, q]);

  const remove = async (r: Row) => {
    if (!window.confirm(`Xoá bài "${r.title_vi}"?\nẢnh đã tải lên vẫn được giữ. Thao tác ghi vào nhật ký nhưng không tự hoàn tác.`)) return;
    try { await apiFetch(`/api/v1/admin/articles/${r.id}`, { method: "DELETE", token: session.token }); await load(); }
    catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  };

  if (editing) {
    return <Editor session={session} onAuthError={onAuthError} initial={editing} categories={cats} apps={apps}
      onClose={() => { setEditing(null); void load(); }} onSaved={() => {}} />;
  }

  const catName = (id: number | null) => cats.find((c) => c.id === id)?.name_vi ?? "—";
  return (
    <Panel title={`Bài viết (${rows.length})`} actions={<>
      <select className={`${inputCls} w-36`} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
        <option value="all">Tất cả</option><option value="published">Đã đăng</option><option value="draft">Nháp</option>
      </select>
      <input type="search" placeholder="Tìm…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} w-44`} />
      <button className={btn.ghost} onClick={load}>Tải lại</button>
      <button className={btn.primary} onClick={() => setEditing({ ...EMPTY, author: session.username })}>+ Bài viết mới</button></>}>
      {err && <Notice kind="error">{err}</Notice>}
      {loading ? <p className="text-sm text-mute">Đang tải…</p> : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-2 font-medium">Bài viết</th>
              <th className="px-3 py-2 font-medium">Chuyên mục</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Ngày đăng</th>
              <th className="px-3 py-2 font-medium">EN</th>
              <th className="px-5 py-2 text-right font-medium">Thao tác</th></tr></thead>
            <tbody>
              {shown.map((r) => {
                const s = statusOf(r);
                return (
                  <tr key={r.id} className="border-b border-line/70 align-top hover:bg-paper/60">
                    <td className="max-w-md px-5 py-3">
                      <button className="text-left font-medium text-ink hover:text-signal-600" onClick={() => setEditing(r)}>{r.title_vi}</button>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-mute">/bai-viet/{r.slug}/</p>
                    </td>
                    <td className="px-3 py-3">{catName(r.category_id)}</td>
                    <td className="px-3 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-mute">{fmt(r.published_at)}</td>
                    <td className="px-3 py-3">{r.title_en ? "✓" : "—"}</td>
                    <td className="whitespace-nowrap px-5 py-2 text-right">
                      {r.status === "published" && !isFuture(r.published_at) && (
                        <a className={`${btn.ghost} mr-2 py-1.5`} href={SITE_URL + articlePath("vi", r.slug)} target="_blank" rel="noopener noreferrer">Xem</a>
                      )}
                      <button className={`${btn.ghost} mr-2 py-1.5`} onClick={() => setEditing(r)}>Sửa</button>
                      <button className={`${btn.danger} py-1.5`} onClick={() => remove(r)}>Xoá</button>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-mute">
                  {rows.length ? "Không có bài phù hợp." : "Chưa có bài viết. Bấm “+ Bài viết mới” để viết bài đầu tiên."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
