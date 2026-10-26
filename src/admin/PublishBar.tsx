import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import { SITE_URL } from "../lib/share";
import type { Session } from "./AdminApp";
import { btn } from "./ui";

interface Status {
  configured: boolean; pending: boolean; pending_since: string | null; debounce_seconds: number;
  last_triggered: string | null; last_status: string;
}

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "");

/**
 * Status of the public static site. Every change in the admin schedules a Cloudflare Pages build
 * (PAGES_DEPLOY_HOOK); the public pages update about 2 minutes after the build starts.
 */
export default function PublishBar({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try { setSt(await apiFetch<Status>("/api/v1/admin/publish", { token: session.token })); }
    catch (e) { onAuthError(e); }
  }, [session.token, onAuthError]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 20000);
    return () => window.clearInterval(id);
  }, [load]);

  const publish = async () => {
    setBusy(true); setMsg("");
    try {
      setSt(await apiFetch<Status>("/api/v1/admin/publish", { method: "POST", token: session.token, timeoutMs: 30000 }));
      setMsg("Đã yêu cầu cập nhật. Trang công khai đổi sau khoảng 2 phút.");
    } catch (e) { onAuthError(e); setMsg(e instanceof ApiError ? e.message : "Không gửi được yêu cầu."); }
    finally { setBusy(false); }
  };

  if (!st) return null;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
      st.configured ? "border-line bg-white" : "border-signal/40 bg-signal-100/50"}`}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink">
        <span className={`h-2 w-2 rounded-full ${!st.configured ? "bg-signal" : st.pending ? "bg-amber-500 animate-pulse" : "bg-sonar"}`} />
        {!st.configured ? (
          <span>Trang công khai <b>{host}</b> chưa tự cập nhật: đặt <code className="font-mono">PAGES_DEPLOY_HOOK</code> trong file <code className="font-mono">.env</code> của backend.</span>
        ) : st.pending ? (
          <span>Có thay đổi mới — trang <b>{host}</b> sẽ tự build lại sau {st.debounce_seconds} giây kể từ lần sửa cuối.</span>
        ) : (
          <span>Trang <b>{host}</b> tự cập nhật sau mỗi thay đổi.{st.last_triggered && <> Lần build gần nhất: {time(st.last_triggered)} ({st.last_status}).</>}</span>
        )}
        {msg && <span className="text-mute">{msg}</span>}
      </p>
      {st.configured && (
        <button className={btn.ghost} onClick={publish} disabled={busy}>{busy ? "Đang gửi…" : "Cập nhật trang công khai ngay"}</button>
      )}
    </div>
  );
}
