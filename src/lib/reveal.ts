/* ============================================================
   reveal.ts — scroll-triggered entrances.

   Opt in with [data-reveal] on any element. Children of a
   [data-reveal-group] are staggered automatically so you never
   hand-write delays.

     <ul data-reveal-group="60">
       <li data-reveal>…</li>
       <li data-reveal>…</li>
     </ul>

   One observer for the whole document, and each element is
   unobserved after firing — this stays cheap on long pages.
   ============================================================ */

export function initReveal(root: ParentNode = document): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]")
  );

  if (reduced || !("IntersectionObserver" in window)) {
    for (const el of targets) el.setAttribute("data-revealed", "");
    return () => {};
  }

  // Stagger: index within the nearest group, times the group's step.
  for (const group of root.querySelectorAll<HTMLElement>(
    "[data-reveal-group]"
  )) {
    const step = Number(group.getAttribute("data-reveal-group")) || 70;
    const kids = group.querySelectorAll<HTMLElement>("[data-reveal]");
    kids.forEach((kid, i) => {
      kid.style.setProperty("--reveal-delay", `${i * step}ms`);
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  for (const el of targets) io.observe(el);

  return () => io.disconnect();
}
