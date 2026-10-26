import { useEffect } from "react";

/**
 * Light scroll-in animation. Elements with class `.reveal` fade/slide in once.
 * CSS only hides them when <html> has class `js` (set inline in index.html), so
 * crawlers and no-JS visitors always see the content.
 */
export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const show = (el: Element) => el.classList.add("is-visible");
    if (reduce || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(show);
      const mo = new MutationObserver(() => document.querySelectorAll(".reveal:not(.is-visible)").forEach(show));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const scan = () => document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
    scan();
    // Cards appear/disappear when filtering — watch for new .reveal nodes.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}
