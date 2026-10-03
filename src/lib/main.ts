/* ============================================================
   main.ts — the single entry point.

   Progressive enhancement only: with JavaScript off the site is a
   clean, readable black-and-white document. With it on you get
   scroll-entrance reveals, the invert switch, and the hover
   scramble on links. Nothing else runs.
   ============================================================ */

import { initReveal } from "./reveal";
import { initScramble } from "./scramble";
import { initTheme } from "./theme";

function boot(): void {
  initTheme();
  initReveal();
  initScramble();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
