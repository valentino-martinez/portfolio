/* ============================================================
   collide.ts — keep the background shapes off the text.

   Decorative shapes are placed by eye in CSS, which is fine until
   a long word wraps or a window lands at an awkward width and a
   shape ends up sitting under a paragraph. Rather than tune
   breakpoints forever, the shapes declare themselves avoidable and
   this measures the actual boxes after layout:

     1. Does the shape's box intersect any text box?
     2. If so, slide it outward — toward whichever screen edge it
        is already nearest — up to a limit.
     3. Still overlapping? Hide it. A missing ornament costs
        nothing; an ornament across a sentence costs the sentence.

   Runs once after layout and again on resize, never on scroll, so
   it is a handful of measurements and not a per-frame cost.
   ============================================================ */

/** What counts as text worth protecting. */
const TEXT = "p, h1, h2, h3, h4, li, a, figcaption, dt, dd, code, .label, .title";

/**
 * How far a shape may be pushed before we give up and hide it.
 * Generous on purpose: these are edge shapes and are meant to hang
 * off the side of the page, so sliding one most of the way out of
 * view is a perfectly good outcome — better than dropping it.
 */
const MAX_NUDGE = 620;

/** Overlaps smaller than this on both axes are not worth acting on. */
const TOLERANCE = 6;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function overlaps(a: Box, b: Box): boolean {
  return (
    a.left < b.right - TOLERANCE &&
    a.right > b.left + TOLERANCE &&
    a.top < b.bottom - TOLERANCE &&
    a.bottom > b.top + TOLERANCE
  );
}

function boxOf(el: Element, dx = 0): Box {
  const r = el.getBoundingClientRect();
  return {
    left: r.left + dx,
    right: r.right + dx,
    top: r.top + window.scrollY,
    bottom: r.bottom + window.scrollY,
  };
}

export function initCollide(root: ParentNode = document): () => void {
  const shapes = Array.from(root.querySelectorAll<HTMLElement>("[data-avoid]"));
  if (!shapes.length) return () => {};

  function run() {
    // Clear previous decisions so a resize can re-admit a shape that
    // was hidden at the old width.
    for (const s of shapes) {
      s.style.removeProperty("--avoid-shift");
      s.removeAttribute("data-clash");
    }

    // Collect text boxes once. Shapes are aria-hidden and never
    // contain text, so nothing here can match a shape's own content.
    const texts: Box[] = [];
    for (const el of root.querySelectorAll(TEXT)) {
      if (el.closest("[data-avoid]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      texts.push(boxOf(el));
    }

    const vw = window.innerWidth;

    for (const shape of shapes) {
      const base = shape.getBoundingClientRect();
      if (base.width === 0 || base.height === 0) continue;

      // Push toward the nearer edge: a shape on the left goes further
      // left, one on the right goes further right. That keeps it in
      // the margin instead of dragging it across the page.
      const toLeft = base.left + base.width / 2 < vw / 2;
      const dir = toLeft ? -1 : 1;

      let placed = false;
      for (let shift = 0; shift <= MAX_NUDGE; shift += 16) {
        const candidate = boxOf(shape, dir * shift);
        if (!texts.some((t) => overlaps(candidate, t))) {
          if (shift > 0) {
            shape.style.setProperty("--avoid-shift", `${dir * shift}px`);
          }
          placed = true;
          break;
        }
      }

      if (!placed) {
        shape.setAttribute("data-clash", "");
        continue;
      }

      // If clearing the text pushed it so far that almost nothing is
      // still on screen, there is no point keeping it.
      const finalBox = shape.getBoundingClientRect();
      const visible = Math.min(finalBox.right, vw) - Math.max(finalBox.left, 0);
      if (visible < Math.min(64, finalBox.width * 0.25)) {
        shape.setAttribute("data-clash", "");
      }
    }
  }

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  };

  // Fonts and images both change layout after first paint.
  run();
  document.fonts?.ready.then(run).catch(() => {});
  window.addEventListener("load", run);
  window.addEventListener("resize", schedule, { passive: true });

  return () => {
    clearTimeout(timer);
    window.removeEventListener("load", run);
    window.removeEventListener("resize", schedule);
  };
}
