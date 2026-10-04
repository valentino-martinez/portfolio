import { useEffect, useRef } from "react";

/* Scroll entrance. One observer per mounted element, disconnected
   as soon as it fires — these never reverse, so there is nothing to
   keep watching.

   Honours prefers-reduced-motion by revealing immediately, and the
   CSS keeps the element visible when JavaScript never runs at all. */

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  delayMs = 0
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.dataset.reveal = "";
    if (delayMs) el.style.setProperty("--reveal-delay", `${delayMs}ms`);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) {
      el.dataset.revealed = "";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.revealed = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  return ref;
}
