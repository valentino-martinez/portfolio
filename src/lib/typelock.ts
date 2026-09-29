/* ============================================================
   typelock.ts — the page stops, the sentence types, the page goes.

   Mark an element with data-typelock. When it reaches the middle
   of the screen the page is held still, the text writes itself in,
   and scrolling resumes. Once only, on the way down.

   Holding someone's scroll is a rude thing to do, so every exit is
   built in before the effect itself:

   - Any input releases it early — wheel, touch, a key, a click.
     The text finishes instantly rather than being abandoned
     half-written.
   - A hard timeout releases it regardless, so a stalled frame or a
     backgrounded tab can never strand the page.
   - prefers-reduced-motion skips the whole thing: text present,
     no lock.
   - No JavaScript, no lock: the text is simply there.

   The hold cancels scroll input rather than pinning the body.
   Pinning means setting position:fixed on <body>, which changes
   the containing block for anything sticky on the page — and this
   very paragraph is sticky — so it would jump at the moment the
   hold began. Cancelling input mutates no layout at all.

   One consequence, and it is a good one: the same gesture that
   would have scrolled instead completes the text, and the next
   gesture scrolls normally. Nobody has to wait through it.
   ============================================================ */

/** Milliseconds per character. ~180 chars lands near two seconds. */
const SPEED = 11;

/** Nothing may hold the page longer than this, whatever happens. */
const MAX_HOLD = 4000;

export function initTypelock(root: ParentNode = document): () => void {
  const found = root.querySelector<HTMLElement>("[data-typelock]");
  if (!found) return () => {};
  // Bound once so the closures below keep the non-null narrowing.
  const el: HTMLElement = found;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return () => {};

  const full = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (!full) return () => {};

  /* Both halves stay in the DOM the whole time and the untyped half
     is merely transparent, so the line breaks never change and the
     paragraph cannot reflow mid-type — which would shift the page
     we are busy holding still. */
  const done = document.createElement("span");
  const rest = document.createElement("span");
  rest.className = "typelock__rest";
  rest.textContent = full;
  el.textContent = "";
  el.append(done, rest);
  el.setAttribute("data-typelock-ready", "");

  let started = false;
  let finished = false;
  let raf = 0;
  let timeout = 0;
  let release: (() => void) | null = null;

  /* Swallow anything that would scroll. Not passive: the whole
     point is to be able to cancel it. */
  function onScrollAttempt(e: Event) {
    if (e.cancelable) e.preventDefault();
    finish();
  }

  const SCROLL_KEYS = new Set([
    "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ",
  ]);

  function onKey(e: KeyboardEvent) {
    if (SCROLL_KEYS.has(e.key) && e.cancelable) e.preventDefault();
    finish();
  }

  function hold(): () => void {
    document.documentElement.setAttribute("data-typelocked", "");
    window.addEventListener("wheel", onScrollAttempt, { passive: false });
    window.addEventListener("touchmove", onScrollAttempt, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", finish);
    return () => {
      document.documentElement.removeAttribute("data-typelocked");
      window.removeEventListener("wheel", onScrollAttempt);
      window.removeEventListener("touchmove", onScrollAttempt);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", finish);
    };
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(timeout);
    done.textContent = full;
    rest.textContent = "";
    el.setAttribute("data-typelock-done", "");
    release?.();
    release = null;
  }

  function start() {
    if (started) return;
    started = true;

    release = hold();
    /* setTimeout still fires in a backgrounded tab, throttled, so
       this also covers the case where the reader switches away
       mid-type and rAF stops dead. */
    timeout = window.setTimeout(finish, MAX_HOLD);

    const t0 = performance.now();
    const step = (now: number) => {
      if (finished) return;
      const n = Math.min(full.length, Math.floor((now - t0) / SPEED));
      done.textContent = full.slice(0, n);
      rest.textContent = full.slice(n);
      if (n >= full.length) finish();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* Fire when the paragraph is properly on screen rather than as
     its first pixel appears, so the hold does not feel arbitrary. */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        start();
      }
    },
    { threshold: 0.9 }
  );
  io.observe(el);

  return () => {
    io.disconnect();
    finish();
  };
}
