import { useRef, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn } from "./ui";

interface Preview {
  source: string; served_by: string; current_apps: number;
  incoming: { groups: number; apps: number; guides: number; demos: number; courses: number; app_names: string[] };
}

export default function DataPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pBusy, setPBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const checkPortlogistics = async () => {
    setPBusy(true); setMsg(null); setPreview(null);
    try {
      setPreview(await apiFetch<Preview>("/api/v1/admin/import-portlogistics", { token: session.token, timeoutMs: 40000 }));
    } catch (e) { onAuthError(e); setMsg({ kind: "error", text: e instanceof ApiError ? e.message : String(e) }); }
    finally { setPBusy(false); }
  };

  const runPortlogistics = async () => {
    if (!preview) return;
    if (!window.confirm(`Thay toàn bộ nhóm, phần mềm, tài liệu, demo và khoá học của ose.vn (${preview.current_apps} phần mềm) bằng danh mục của portlogistics.ose.vn (${preview.incoming.apps} phần mềm)?\n\nGiữ nguyên: bài viết, chuyên mục, liên kết liên hệ, tài khoản, đăng ký khoá học, nhật ký.\nNên tải file sao lưu trước.`)) return;
    setPBusy(true);
    try {
      const r = await apiFetch<{ imported: Record<string, number> }>("/api/v1/admin/import-portlogistics?confirm=true",
        { method: "POST", token: session.token, timeoutMs: 60000 });
      setMsg({ kind: "ok", text: `Đã nhập từ portlogistics: ${r.imported.apps} phần mềm, ${r.imported.groups} nhóm, ${r.imported.guides} tài liệu, ${r.imported.demos} demo, ${r.imported.courses} khoá học. Trang công khai tự cập nhật sau vài phút.` });
      setPreview(null);
    } catch (e) { onAuthError(e); setMsg({ kind: "error", text: e instanceof ApiError ? e.message : String(e) }); }
    finally { setPBusy(false); }
  };

  const doExport = async () => {
    try {
      const data = await apiFetch<unknown>("/api/v1/admin/export", { token: session.token });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `osevn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg({ kind: "ok", text: "Đã tải file sao lưu." });
    } catch (e) { onAuthError(e); setMsg({ kind: "error", text: e instanceof Error ? e.message : String(e) }); }
  };

  const doImport = async (file: File) => {
    let data: unknown;
    try { data = JSON.parse(await file.text()); } catch { setMsg({ kind: "error", text: "File không phải JSON hợp lệ." }); return; }
    if (!window.confirm("Khôi phục sẽ GHI ĐÈ toàn bộ nhóm, phần mềm, tài liệu, demo, khoá học và liên kết bằng nội dung trong file.\nTài khoản người dùng và nhật ký được giữ nguyên.\n\nTiếp tục?")) return;
    setBusy(true);
    try {
      const r = await apiFetch<{ imported: Record<string, number> }>("/api/v1/admin/import?confirm=true",
        { method: "POST", body: JSON.stringify(data), token: session.token, timeoutMs: 30000 });
      setMsg({ kind: "ok", text: `Đã khôi phục: ${Object.entries(r.imported).map(([k, v]) => `${v} ${k}`).join(", ")}.` });
    } catch (e) { onAuthError(e); setMsg({ kind: "error", text: e instanceof ApiError ? e.message : String(e) }); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <Panel title="Sao lưu, khôi phục và nhập danh mục">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="mb-6 rounded-xl border border-sonar/40 bg-sonar-100/40 p-5">
        <h2 className="font-semibold">Nhập danh mục từ portlogistics.ose.vn</h2>
        <p className="mt-1 text-sm text-mute">
          Lấy danh mục đang hiển thị trên portlogistics.ose.vn (nhóm, phần mềm, tài liệu, demo, khoá học) để không phải nhập hai lần.
          Bài viết, chuyên mục và liên kết liên hệ của ose.vn được giữ nguyên. Mục đang ẩn trên portlogistics không được nhập.
        </p>
        {preview && (
          <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm">
            <p>
              Sẽ nhập <b>{preview.incoming.apps}</b> phần mềm trong <b>{preview.incoming.groups}</b> nhóm, {preview.incoming.guides} tài liệu,{" "}
              {preview.incoming.demos} demo, {preview.incoming.courses} khoá học — thay cho <b>{preview.current_apps}</b> phần mềm hiện có.
            </p>
            {preview.served_by === "render" && (
              <p className="mt-2 text-signal-600">Lưu ý: portlogistics đang chạy bằng máy chủ dự phòng (Render), danh mục có thể chưa phải bản mới nhất.</p>
            )}
            <details className="mt-2"><summary className="cursor-pointer text-mute">Danh sách phần mềm</summary>
              <ol className="mt-2 list-decimal columns-1 pl-5 text-xs text-ink sm:columns-2">{preview.incoming.app_names.map((n) => <li key={n}>{n}</li>)}</ol>
            </details>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btn.ghost} disabled={pBusy} onClick={checkPortlogistics}>{pBusy && !preview ? "Đang đọc…" : "1. Kiểm tra danh mục portlogistics"}</button>
          <button className={btn.primary} disabled={pBusy || !preview} onClick={runPortlogistics}>{pBusy && preview ? "Đang nhập…" : "2. Nhập danh mục"}</button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-line p-5">
          <h2 className="font-semibold">Xuất (Export)</h2>
          <p className="mt-1 text-sm text-mute">Tải toàn bộ nội dung (kể cả mục đang ẩn) về một file JSON. Nên làm sau mỗi lần cập nhật lớn. File không gồm bài viết và ảnh — bài viết nằm trong database (sao lưu bằng docker cp).</p>
          <button className={`${btn.primary} mt-4`} onClick={doExport}>Tải file sao lưu</button>
        </div>
        <div className="rounded-xl border border-signal/30 p-5">
          <h2 className="font-semibold">Khôi phục (Import)</h2>
          <p className="mt-1 text-sm text-mute">Ghi đè nội dung bằng file JSON đã xuất (hoặc file <code className="font-mono">catalog.seed.json</code>). Dùng khi chuyển sang database mới.</p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <button className={`${btn.danger} mt-4`} disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Đang khôi phục…" : "Chọn file và khôi phục"}</button>
        </div>
      </div>
    </Panel>
  );
}
