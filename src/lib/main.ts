/* ============================================================
   main.ts — the single entry point.

   Note: the 1-bit dither engine (src/lib/dither.ts, dither-element.ts,
   components/Dither.astro) is no longer wired up — photographs are
   plain black and white now, via a CSS filter in Photo.astro. The
   files are still on disk but nothing imports them, so none of it
   reaches the browser. Delete them if you are sure.

   Everything below is progressive enhancement: with JS off the
   site is a clean, readable black-and-white document. With JS on
   it becomes a 1-bit machine.
   ============================================================ */

import { initReveal } from "./reveal";
import { initScramble } from "./scramble";
import { initCursor } from "./cursor";
import { initTheme } from "./theme";
import { initRails } from "./rail";

/* ------------------------------------------------------------
   Live readouts — the terminal-status-line furniture.
   ------------------------------------------------------------ */
function initReadouts(): void {
  const clocks = document.querySelectorAll<HTMLElement>("[data-clock]");
  if (clocks.length) {
    const tick = () => {
      const d = new Date();
      const s = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
      for (const el of clocks) el.textContent = s;
    };
    tick();
    setInterval(tick, 1000);
  }

  const bars = document.querySelectorAll<HTMLElement>("[data-scroll-readout]");
  if (bars.length) {
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      const text = `${String(pct).padStart(3, "0")}%`;
      for (const el of bars) {
        el.textContent = text;
        el.style.setProperty("--progress", `${pct}%`);
      }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
function boot(): void {
  initTheme();
  initReveal();
  initScramble();
  initCursor();
  initReadouts();
  initRails();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
