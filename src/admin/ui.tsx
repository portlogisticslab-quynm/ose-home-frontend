import type { ReactNode } from "react";

export const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-sonar focus:ring-2 focus:ring-sonar/20";
export const btn = {
  primary: "inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50",
  ghost: "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink hover:border-ink/40",
  danger: "inline-flex items-center gap-1.5 rounded-lg border border-signal/40 bg-white px-3 py-2 text-sm text-signal-600 hover:bg-signal-100",
};

export function Panel({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Notice({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"}
      className={`mb-4 rounded-lg px-3 py-2 text-sm ${kind === "error" ? "bg-signal-100 text-signal-600" : "bg-sonar-100 text-ink"}`}>
      {children}
    </p>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={title}
      onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-mute hover:text-ink" aria-label="Đóng">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
