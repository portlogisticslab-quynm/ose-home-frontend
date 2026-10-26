import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn, inputCls } from "./ui";

interface Reg {
  id: number; created_at: string; full_name: string; email: string; phone: string; occupation: string;
  course: string; message: string; lang: string; status: string; note: string;
}

const STATUS: Array<[string, string, string]> = [
  ["new", "Mới", "bg-signal-100 text-signal-600"],
  ["contacted", "Đã liên hệ", "bg-sonar-100 text-ink"],
  ["enrolled", "Đã nhập học", "bg-ink text-white"],
  ["cancelled", "Huỷ", "bg-paper text-mute"],
];

/** Course registrations sent from the landing page (personal data — handle with care). */
export default function RegistrationsPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [rows, setRows] = useState<Reg[]>([]);
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [mail, setMail] = useState<{ configured: boolean; to: string[]; from: string | null } | null>(null);
  const [testing, setTesting] = useState(false);
  const call = useCallback(<T,>(p: string, i: RequestInit & { timeoutMs?: number } = {}) => apiFetch<T>(p, { ...i, token: session.token }), [session.token]);

  const load = useCallback(async () => {
    try { setRows(await call<Reg[]>(`/api/v1/admin/registrations${filter ? `?status=${filter}` : ""}`)); setErr(""); }
    catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  }, [call, filter, onAuthError]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    call<{ configured: boolean; to: string[]; from: string | null }>("/api/v1/admin/registrations/email-status").then(setMail).catch(() => {});
  }, [call]);

  const testEmail = async () => {
    setTesting(true); setErr(""); setOk("");
    try { const r = await call<{ to: string[] }>("/api/v1/admin/registrations/test-email", { method: "POST", timeoutMs: 30000 }); setOk(`Đã gửi email thử tới ${r.to.join(", ")} — kiểm tra hộp thư (cả mục Spam).`); }
    catch (e) { onAuthError(e); setErr(e instanceof ApiError ? e.message : String(e)); }
    finally { setTesting(false); }
  };

  const patch = async (r: Reg, body: Partial<Reg>, msg: string) => {
    try { await call(`/api/v1/admin/registrations/${r.id}`, { method: "PATCH", body: JSON.stringify(body) }); setOk(msg); await load(); }
    catch (e) { onAuthError(e); setErr(e instanceof ApiError ? e.message : String(e)); }
  };

  const remove = async (r: Reg) => {
    if (!window.confirm(`Xoá đăng ký của ${r.full_name}?`)) return;
    try { await call(`/api/v1/admin/registrations/${r.id}`, { method: "DELETE" }); setOk(`Đã xoá đăng ký của ${r.full_name}`); await load(); }
    catch (e) { onAuthError(e); setErr(e instanceof ApiError ? e.message : String(e)); }
  };

  const downloadCsv = async () => {
    // fetch with the token, then save as a file
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE ?? "") + "/api/v1/admin/registrations.csv", { headers: { Authorization: `Bearer ${session.token}` } });
      if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dang-ky-khoa-hoc-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  };

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <Panel title={`Đăng ký khoá học (${rows.length}${newCount ? ` · ${newCount} mới` : ""})`} actions={<>
      <select className={`${inputCls} w-40`} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Tất cả</option>
        {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <button className={btn.ghost} onClick={load}>Tải lại</button>
      <button className={btn.primary} onClick={downloadCsv}>Tải CSV (Excel)</button></>}>
      <p className="mb-3 text-sm text-mute">Thông tin cá nhân của người đăng ký — chỉ dùng để liên hệ về khoá học, không chia sẻ ra ngoài.</p>
      {mail && (
        <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-sm ${mail.configured ? "bg-sonar-100 text-ink" : "bg-signal-100 text-signal-600"}`}>
          <span>
            {mail.configured
              ? <>Đơn mới tự gửi email tới <b>{mail.to.join(", ")}</b>{mail.from && <> (từ {mail.from})</>}.</>
              : <>Chưa bật gửi email: điền <code className="font-mono">SMTP_*</code> trong <code className="font-mono">.env</code> (xem docs/DEPLOY.md). Đơn vẫn được lưu ở đây.</>}
          </span>
          {mail.configured && session.role === "admin" && (
            <button className={`${btn.ghost} py-1.5`} disabled={testing} onClick={testEmail}>{testing ? "Đang gửi…" : "Gửi email thử"}</button>
          )}
        </div>
      )}
      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="ok">{ok}</Notice>}
      <div className="space-y-3">
        {rows.map((r) => {
          const st = STATUS.find(([v]) => v === r.status) ?? STATUS[0];
          return (
            <article key={r.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.full_name}
                    <span className={`ml-2 rounded px-1.5 py-0.5 align-middle font-mono text-[11px] ${st[2]}`}>{st[1]}</span></p>
                  <p className="mt-0.5 text-sm text-mute">
                    <a className="text-sonar hover:underline" href={`mailto:${r.email}`}>{r.email}</a> · <a className="text-sonar hover:underline" href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`}>{r.phone}</a>
                    {r.occupation && <> · {r.occupation}</>}
                  </p>
                  <p className="mt-1 text-sm"><span className="text-mute">Khoá học:</span> <b>{r.course}</b></p>
                  {r.message && <p className="mt-1 whitespace-pre-line text-sm text-ink/80">“{r.message}”</p>}
                  <p className="mt-1 font-mono text-[11px] text-mute">{new Date(r.created_at).toLocaleString("vi-VN")} · {r.lang.toUpperCase()}{r.note && ` · Ghi chú: ${r.note}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select className={`${inputCls} w-36 py-1.5`} value={r.status} onChange={(e) => patch(r, { status: e.target.value }, `Đã cập nhật ${r.full_name}`)}>
                    {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button className={`${btn.ghost} py-1.5`} onClick={() => {
                    const note = window.prompt("Ghi chú nội bộ:", r.note);
                    if (note !== null) patch(r, { note }, "Đã lưu ghi chú");
                  }}>Ghi chú</button>
                  {session.role === "admin" && <button className={`${btn.danger} py-1.5`} onClick={() => remove(r)}>Xoá</button>}
                </div>
              </div>
            </article>
          );
        })}
        {rows.length === 0 && <p className="py-8 text-center text-mute">Chưa có đăng ký nào</p>}
      </div>
    </Panel>
  );
}
