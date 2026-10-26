import { describe, expect, it } from "vitest";
import seed from "../data/catalog.fallback.json";
import { appNumbers, demosByApp, detectPlatform, driveId, filterApps, seedToCatalog, stats, youtubeId } from "./catalog";
import type { Seed } from "./types";

const c = seedToCatalog(seed as Seed);

describe("catalog", () => {
  // The fallback catalog is refreshed from the live site at every build: only check its shape.
  it("converts the seed into groups, apps, guides and demos", () => {
    const s = stats(c);
    expect(s.groups).toBeGreaterThan(0);
    expect(s.apps).toBe(c.groups.reduce((n, g) => n + g.apps.length, 0));
    expect(s.demos).toBe(c.demos.length);
  });
  it("only lists *.ose.vn apps", () => {
    for (const g of c.groups) for (const a of g.apps) expect(a.host.endsWith(".ose.vn")).toBe(true);
  });
  it("numbers apps 1..n in catalogue order", () => {
    const n = appNumbers(c);
    const all = c.groups.flatMap((g) => g.apps);
    expect(n[all[0].slug]).toBe(1);
    expect(n[all[all.length - 1].slug]).toBe(all.length);
  });
  it("filters by group and text", () => {
    const g = c.groups[0];
    expect(filterApps(c, g.slug, "", "vi").flatMap((x) => x.apps)).toHaveLength(g.apps.length);
    const first = g.apps[0];
    expect(filterApps(c, "all", first.name, "vi").flatMap((x) => x.apps).map((a) => a.slug)).toContain(first.slug);
    expect(filterApps(c, "all", "zzzzqqq", "vi")).toHaveLength(0);
  });
  it("detects demo platforms", () => {
    expect(detectPlatform("https://lnkd.in/p/gk3UUsWp")).toBe("linkedin");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://lnkd.in/p/x")).toBeNull();
    expect(detectPlatform("https://drive.google.com/file/d/1Vfj-hlrcZYoHwokuwr8TxeRJYJyFeegP/view?usp=sharing")).toBe("drive");
    expect(driveId("https://drive.google.com/file/d/1Vfj-hlrcZYoHwokuwr8TxeRJYJyFeegP/view?usp=sharing")).toBe("1Vfj-hlrcZYoHwokuwr8TxeRJYJyFeegP");
    expect(driveId("https://drive.google.com/drive/folders/1fFw25QlTID")).toBeNull();
  });
  it("links demo clips to known apps only", () => {
    const slugs = new Set(c.groups.flatMap((g) => g.apps.map((a) => a.slug)));
    for (const slug of Object.keys(demosByApp(c))) expect(slugs.has(slug)).toBe(true);
  });
});
