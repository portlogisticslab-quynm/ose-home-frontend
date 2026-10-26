import { useEffect, useRef, useState } from "react";
import type { Lang } from "../lib/types";
import { t } from "../lib/i18n";
import { copyText, facebookShare, linkedinShare, xShare } from "../lib/share";
import { IconCheck, IconFacebook, IconLink, IconLinkedIn, IconShare, IconX } from "./Icons";

interface Props { lang: Lang; url: string; title: string; dark?: boolean; compact?: boolean }

export default function ShareMenu({ lang, url, title, dark, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const onCopy = async () => {
    if (await copyText(url)) { setCopied(true); setTimeout(() => setCopied(false), 1600); }
  };

  const item = "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-paper";
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        title={t(lang, "share.label")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm transition ${
          dark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-mute hover:bg-paper hover:text-ink"}`}>
        <IconShare size={16} />{!compact && <span>{t(lang, "share.label")}</span>}
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full right-0 z-30 mb-2 w-52 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lift">
          <a role="menuitem" className={item} href={facebookShare(url)} target="_blank" rel="noopener noreferrer"><IconFacebook size={16} /> Facebook</a>
          <a role="menuitem" className={item} href={linkedinShare(url)} target="_blank" rel="noopener noreferrer"><IconLinkedIn size={16} /> LinkedIn</a>
          <a role="menuitem" className={item} href={xShare(url, title)} target="_blank" rel="noopener noreferrer"><IconX size={15} /> X</a>
          <button role="menuitem" type="button" className={item} onClick={onCopy}>
            {copied ? <IconCheck size={16} className="text-sonar" /> : <IconLink size={16} />}
            {copied ? t(lang, "share.copied") : t(lang, "share.copy")}
          </button>
        </div>
      )}
    </div>
  );
}
