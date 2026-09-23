/* ============================================================
   collide.ts — find each background shape a home.

   The first version only pushed shapes outward until they stopped
   touching text, which satisfied the letter of "don't hit the
   text" and broke the spirit of it: every drawing ended up half
   off the screen. A cropped drawing is worse than no drawing.

   So this searches instead of shoving. For each shape it tries
   candidate offsets in both axes, nearest first, and takes the
   first placement that is BOTH clear of every text box AND fully
   inside the viewport. Whitespace inside the content column — the
   empty half of a short heading row, the gap under a section head
   — is fair game, which is where the room actually is. If nothing
   fits, the shape is hidden rather than cropped.

   Runs after layout, after fonts, and on resize. Never on scroll.
   ============================================================ */

const TEXT = "p, h1, h2, h3, h4, li, a, figcaption, dt, dd, code, .label, .title";

/** Horizontal and vertical search range, in px. */
const RANGE_X = 560;
const RANGE_Y = 340;
const STEP = 20;

/** Ignore overlaps smaller than this on both axes. */
const TOLERANCE = 6;

/** Keep a shape at least this far inside the viewport edges. */
const EDGE_PAD = 4;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const hits = (a: Box, b: Box) =>
  a.left < b.right - TOLERANCE &&
  a.right > b.left + TOLERANCE &&
  a.top < b.bottom - TOLERANCE &&
  a.bottom > b.top + TOLERANCE;

/** Offsets ordered by distance, so the shape barely moves if it can. */
function candidates(): [number, number][] {
  const out: [number, number][] = [];
  for (let dx = -RANGE_X; dx <= RANGE_X; dx += STEP) {
    for (let dy = -RANGE_Y; dy <= RANGE_Y; dy += STEP) {
      out.push([dx, dy]);
    }
  }
  out.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
  return out;
}
const OFFSETS = candidates();

export function initCollide(root: ParentNode = document): () => void {
  const shapes = Array.from(root.querySelectorAll<HTMLElement>("[data-avoid]"));
  if (!shapes.length) return () => {};

  function run() {
    for (const s of shapes) {
      s.style.removeProperty("--avoid-x");
      s.style.removeProperty("--avoid-y");
      s.removeAttribute("data-clash");
    }

    const texts: Box[] = [];
    for (const el of root.querySelectorAll(TEXT)) {
      if (el.closest("[data-avoid]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      texts.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }

    const vw = window.innerWidth;

    /* Shapes already given a home become obstacles for the ones
       after them, so two drawings cannot end up stacked on the same
       patch of whitespace. */
    const taken: Box[] = [];

    for (const shape of shapes) {
      const base = shape.getBoundingClientRect();
      if (base.width === 0 || base.height === 0) continue;

      // A shape wider than the window can never be shown whole.
      if (base.width > vw - EDGE_PAD * 2) {
        shape.setAttribute("data-clash", "");
        continue;
      }

      /* If an ancestor actually clips, a placement outside its box
         is cropped just as surely as one off the edge of the window.
         Only constrain when something really does clip — treating
         every positioned parent as a boundary rejects placements
         that would have been perfectly visible. */
      let clipEl: HTMLElement | null = shape.parentElement;
      let clip: DOMRect | undefined;
      while (clipEl && clipEl !== document.body) {
        const o = getComputedStyle(clipEl);
        if (
          o.overflow !== "visible" ||
          o.overflowX !== "visible" ||
          o.overflowY !== "visible"
        ) {
          clip = clipEl.getBoundingClientRect();
          break;
        }
        clipEl = clipEl.parentElement;
      }
      const minLeft = Math.max(EDGE_PAD, clip ? clip.left : EDGE_PAD);
      const maxRight = Math.min(vw - EDGE_PAD, clip ? clip.right : vw - EDGE_PAD);
      const minTop = clip ? clip.top : -Infinity;
      const maxBottom = clip ? clip.bottom : Infinity;

      if (base.width > maxRight - minLeft) {
        shape.setAttribute("data-clash", "");
        continue;
      }

      let placed = false;
      for (const [dx, dy] of OFFSETS) {
        const box: Box = {
          left: base.left + dx,
          right: base.right + dx,
          top: base.top + dy,
          bottom: base.bottom + dy,
        };
        // Whole drawing visible, or it is not worth drawing.
        if (box.left < minLeft || box.right > maxRight) continue;
        if (box.top < minTop || box.bottom > maxBottom) continue;
        if (texts.some((t) => hits(box, t))) continue;
        if (taken.some((o) => hits(box, o))) continue;

        if (dx) shape.style.setProperty("--avoid-x", `${dx}px`);
        if (dy) shape.style.setProperty("--avoid-y", `${dy}px`);
        taken.push(box);
        placed = true;
        break;
      }

      if (!placed) shape.setAttribute("data-clash", "");
    }
  }

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  };

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
