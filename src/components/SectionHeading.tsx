export default function SectionHeading({ id, kicker, title, lead, dark }: {
  id: string; kicker: string; title: string; lead?: string; dark?: boolean;
}) {
  return (
    <div className="reveal mb-10 max-w-2xl">
      <p className={`font-mono text-xs uppercase tracking-[.18em] ${dark ? "text-sonar-300" : "text-signal"}`}>{kicker}</p>
      <h2 id={`${id}-title`} className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
      {lead && <p className={`mt-3 text-base leading-relaxed ${dark ? "text-white/70" : "text-mute"}`}>{lead}</p>}
    </div>
  );
}
