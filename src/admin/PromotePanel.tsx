import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { pick, seedToCatalog } from "../lib/catalog";
import { appPath, homePath } from "../lib/i18n";
import { absoluteUrl, copyText, facebookShare, linkedinShare, withUtm } from "../lib/share";
import type { Catalog, Lang, Seed } from "../lib/types";
import seed from "../data/catalog.fallback.json";
import { Panel, btn, inputCls } from "./ui";

/** Ready-to-paste post text for Facebook / YouTube descriptions / LinkedIn. */
export default function PromotePanel() {
  const [catalog, setCatalog] = useState<Catalog>(() => seedToCatalog(seed as Seed));
  const [slug, setSlug] = useState("");
  const [lang, setLang] = useState<Lang>("vi");
  const [target, setTarget] = useState<"facebook" | "youtube">("facebook");
  const [copied, setCopied] = useState(false);

  useEffect(() => { apiFetch<Catalog>("/api/v1/catalog").then(setCatalog).catch(() => {}); }, []);

  const apps = catalog.groups.flatMap((g) => g.apps.map((a) => ({ a, g })));
  const text = useMemo(() => {
    const tags = "#OSE #OpenSolutions #PortEngineering #Logistics #AI #osevn";
    if (!slug) {
      const lines = catalog.groups.map((g) => `▸ ${pick(g, "name", lang)}\n` +
        g.apps.map((a) => `   • ${a.name} — ${a.url ?? ""}`).join("\n")).join("\n\n");
      const head = lang === "vi"
        ? `🚢 OSE — Open Solutions for Engineering: ${apps.length} công cụ mở cho kỹ sư cảng và logistics`
        : `🚢 OSE — Open Solutions for Engineering: ${apps.length} open tools for port and logistics engineers`;
      const url = withUtm(absoluteUrl(homePath(lang)), target);
      return target === "youtube" ? `${head}\n\n${lines}\n\n🔗 ${url}\n\n${tags}` : `${head}\n\n👉 ${url}\n\n${tags}`;
    }
    const found = apps.find((x) => x.a.slug === slug);
    if (!found) return "";
    const { a, g } = found;
    const guide = a.guides[0];
    const url = withUtm(absoluteUrl(appPath(lang, a.slug)), target);
    return [
      `🚢 ${a.name}`,
      pick(a, "desc", lang),
      "",
      `${lang === "vi" ? "Nhóm" : "Group"}: ${pick(g, "name", lang)}`,
      `▶ ${lang === "vi" ? "Dùng thử miễn phí" : "Try it free"}: ${a.url ?? url}`,
      guide ? `📘 ${lang === "vi" ? "Hướng dẫn" : "User guide"}: ${guide.url}` : "",
      `🔗 ${lang === "vi" ? "Toàn bộ phần mềm" : "All software"}: ${url}`,
      "",
      tags,
    ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n");
  }, [slug, lang, target, catalog, apps]);

  const shareUrl = slug ? absoluteUrl(appPath(lang, slug)) : absoluteUrl(homePath(lang));

  return (
    <Panel title="Bộ công cụ quảng bá (Facebook / YouTube / LinkedIn)">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <select className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">Toàn bộ nền tảng</option>
          {apps.map(({ a, g }) => <option key={a.slug} value={a.slug}>{g.code} · {a.name}</option>)}
        </select>
        <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="vi">Tiếng Việt</option><option value="en">English</option>
        </select>
        <select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value as "facebook" | "youtube")}>
          <option value="facebook">Bài đăng Facebook / LinkedIn</option><option value="youtube">Mô tả video YouTube</option>
        </select>
      </div>
      <textarea readOnly value={text} rows={14} className={`${inputCls} font-mono text-xs`} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={btn.primary} onClick={async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>
          {copied ? "Đã sao chép ✓" : "Sao chép nội dung"}</button>
        <a className={btn.ghost} href={facebookShare(shareUrl)} target="_blank" rel="noopener noreferrer">Chia sẻ lên Facebook</a>
        <a className={btn.ghost} href={linkedinShare(shareUrl)} target="_blank" rel="noopener noreferrer">Chia sẻ lên LinkedIn</a>
      </div>
      <p className="mt-4 text-xs text-mute">
        Link dạng <code className="font-mono">/apps/&lt;slug&gt;/</code> có ảnh xem trước và mô tả riêng khi đăng Facebook. Link đã gắn UTM để thống kê nguồn truy cập.
        Sau khi thêm app mới, build lại frontend để tạo trang xem trước cho app đó.
      </p>
    </Panel>
  );
}
