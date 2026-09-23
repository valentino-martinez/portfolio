/* ============================================================
   scramble.ts — text that resolves out of noise.

   <a data-scramble>Projects</a>            → on hover
   <h2 data-scramble="enter">Ceramics</h2>  → once, when scrolled to

   Width is locked to the final string before animating (we only
   ever substitute characters, never change length), so nothing
   around it reflows while it runs.
   ============================================================ */

const GLYPHS = "▓▒░#%&@*+=-<>/\\|[]{}()01";

interface ScrambleState {
  raf: number;
  running: boolean;
}

const states = new WeakMap<HTMLElement, ScrambleState>();

export function scramble(el: HTMLElement, duration = 420): void {
  const final = el.dataset.scrambleText ?? el.textContent ?? "";
  if (!final.trim()) return;

  const prev = states.get(el);
  if (prev?.running) cancelAnimationFrame(prev.raf);

  // Remember the real text once, so repeated runs can't drift.
  if (el.dataset.scrambleText === undefined) el.dataset.scrambleText = final;

  const chars = Array.from(final);
  // Each character gets its own settle time, left to right with jitter.
  const settle = chars.map((_, i) => {
    const base = (i / Math.max(1, chars.length)) * 0.65;
    return base + Math.random() * 0.35;
  });

  const t0 = performance.now();
  const state: ScrambleState = { raf: 0, running: true };
  states.set(el, state);

  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    let out = "";
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]!;
      if (c === " " || t >= settle[i]!) out += c;
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;

    if (t < 1) {
      state.raf = requestAnimationFrame(tick);
    } else {
      el.textContent = final;
      state.running = false;
    }
  };
  state.raf = requestAnimationFrame(tick);
}

export function initScramble(root: ParentNode = document): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  for (const el of root.querySelectorAll<HTMLElement>("[data-scramble]")) {
    const mode = el.getAttribute("data-scramble") || "hover";
    // Lock the box so substituting glyphs can't shift the layout.
    el.style.display ||= "inline-block";

    if (mode === "enter" || mode === "both") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            io.unobserve(e.target);
            scramble(el, 600);
          }
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }

    if (mode === "hover" || mode === "both") {
      const onEnter = () => scramble(el);
      const target = el.closest("a, button") ?? el;
      target.addEventListener("pointerenter", onEnter);
      target.addEventListener("focus", onEnter);
      cleanups.push(() => {
        target.removeEventListener("pointerenter", onEnter);
        target.removeEventListener("focus", onEnter);
      });
    }
  }

  return () => cleanups.forEach((fn) => fn());
}
