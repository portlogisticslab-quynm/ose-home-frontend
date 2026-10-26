import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

// ---- group icons ----
export const IconFoundation = (p: P) => <Svg {...p}><path d="M3 20h18" /><path d="M4 19c3 0 4.2-13 8-13s5 13 8 13" /><path d="M12 6v14" strokeDasharray="2 2" /></Svg>;
export const IconForecast = (p: P) => <Svg {...p}><path d="M3 20h18" /><path d="M4 16l4.5-4.5 3.5 3 6-7" /><path d="M15 7.5h3v3" /><path d="M18 12.5l2-2" strokeDasharray="1.5 2" /></Svg>;
export const IconLogistics = (p: P) => <Svg {...p}><circle cx="5" cy="6" r="2" /><circle cx="19" cy="7" r="2" /><circle cx="12" cy="18" r="2" /><path d="M7 6.2l10 .7M6 7.8l5 8.4M18 8.8l-5 7.5" /></Svg>;
export const IconPort = (p: P) => <Svg {...p}><path d="M2 21h20" /><path d="M5 21V4h9l5 5" /><path d="M5 4l3-1.5" /><path d="M14 4v6" /><rect x="12" y="10" width="4" height="3" /><path d="M8 21v-5h10v5" /></Svg>;
export const IconDesign = (p: P) => <Svg {...p}><rect x="3" y="7" width="18" height="4" /><path d="M6 11v9M18 11v9M3 20h18" /><path d="M7 7V4M11 7V5M15 7V4M19 7V5" /></Svg>;
export const IconManage = (p: P) => <Svg {...p}><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></Svg>;

export function GroupIcon({ name, ...p }: P & { name: string }) {
  switch (name) {
    case "forecasting": return <IconForecast {...p} />;
    case "logistics": return <IconLogistics {...p} />;
    case "port": return <IconPort {...p} />;
    case "design": return <IconDesign {...p} />;
    case "management": return <IconManage {...p} />;
    default: return <IconFoundation {...p} />;
  }
}

// ---- UI icons ----
export const IconArrowUpRight = (p: P) => <Svg {...p}><path d="M7 17L17 7M8 7h9v9" /></Svg>;
export const IconArrowDown = (p: P) => <Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>;
export const IconBook = (p: P) => <Svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></Svg>;
export const IconFilePdf = (p: P) => <Svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 15h1.5a1.5 1.5 0 0 0 0-3H8v5M13 12v5h1a2.5 2.5 0 0 0 0-5zM18 12h-2v5M16 14.5h1.5" strokeWidth={1.3} /></Svg>;
export const IconFolder = (p: P) => <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>;
export const IconPlay = (p: P) => <Svg {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></Svg>;
export const IconShare = (p: P) => <Svg {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></Svg>;
export const IconLink = (p: P) => <Svg {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Svg>;
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
export const IconShield = (p: P) => <Svg {...p}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></Svg>;
export const IconMenu = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const IconClose = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconLock = (p: P) => <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
export const IconGlobe = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>;
export const IconCheck = (p: P) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Svg>;

// ---- brand marks (simple, original glyphs; not official logos) ----
export const IconFacebook = (p: P) => <Svg {...p} stroke="none"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z" /></Svg>;
export const IconLinkedIn = (p: P) => <Svg {...p} stroke="none"><path fill="currentColor" d="M5 8.5h3V19H5zM6.5 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 8.5h2.9v1.4c.4-.8 1.4-1.6 3-1.6 3.1 0 3.6 2 3.6 4.6V19h-3v-5.4c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V19H10z" /></Svg>;
export const IconX = (p: P) => <Svg {...p} stroke="none"><path fill="currentColor" d="M4 4h4.6l3.8 5.3L17 4h3l-6.2 7 6.7 9h-4.6l-4.1-5.6L6.8 20H3.8l6.6-7.4z" /></Svg>;
export const IconYouTube = (p: P) => <Svg {...p} stroke="none"><path fill="currentColor" d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></Svg>;
export const IconResearch = (p: P) => <Svg {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 15h9" /></Svg>;

export const IconMail = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></Svg>;
export const IconPhone = (p: P) => <Svg {...p}><path d="M5 3.5h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z" /></Svg>;
/** Chat bubble with a "Z" — a plain glyph for Zalo, not the official logo. */
export const IconChatZ = (p: P) => <Svg {...p}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M9 9h6l-6 5h6" /></Svg>;

export function LinkKindIcon({ kind, ...p }: P & { kind: string }) {
  switch (kind) {
    case "linkedin": return <IconLinkedIn {...p} />;
    case "facebook": return <IconFacebook {...p} />;
    case "youtube": return <IconYouTube {...p} />;
    case "researchgate": return <IconResearch {...p} />;
    case "website": return <IconGlobe {...p} />;
    case "email": return <IconMail {...p} />;
    case "phone": return <IconPhone {...p} />;
    case "zalo": return <IconChatZ {...p} />;
    default: return <IconLink {...p} />;
  }
}

/** Platform logo mark: crane jib over a node graph. */
/** OSE mark: an open ring (Open) with a link leaving through the opening (solutions reaching out). */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0E2233" />
      <path d="M23.95 20.23A9 9 0 1 1 23.95 11.77" fill="none" stroke="#E8613A" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11.5 16H24" stroke="#79D5CB" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.5" cy="16" r="2.1" fill="#FFFFFF" />
      <circle cx="26.2" cy="16" r="2.1" fill="#79D5CB" />
    </svg>
  );
}
