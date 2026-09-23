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
/* The page's base unit. Searching in multiples of it, from a start
   that is itself snapped to it, means every drawing lands on the
   same grid as the ruler ticks instead of at an arbitrary pixel. */
const STEP = 8;

/** Ignore overlaps smaller than this on both axes. */
const TOLERANCE = 6;

/** Keep a shape at least this far inside the viewport edges. */
const EDGE_PAD = 8;

/** Fixed furniture a shape must not sit on top of — the side rails. */
const KEEPOUT = "[data-rail]";

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const hits = (a: Box, b: Box, pad = TOLERANCE) =>
  a.left < b.right - pad &&
  a.right > b.left + pad &&
  a.top < b.bottom - pad &&
  a.bottom > b.top + pad;

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

    /* The rails are fixed to the viewport edges, so a shape flush to
       the edge lands on top of them. Treat them as obstacles. */
    const keepout: Box[] = [];
    for (const el of root.querySelectorAll(KEEPOUT)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Full height: the rail runs the length of the window.
      keepout.push({ left: r.left, right: r.right, top: -1e6, bottom: 1e6 });
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

      /* Snap onto the grid — but snap the edge the shape is aligned
         to. Snapping the left edge of a right-hand drawing leaves
         its right edge wherever its own width happens to put it, so
         a column of right-hand drawings ends up with a ragged outer
         edge. Snap the outer edge and they line up with each other. */
      const alignsRight = base.left + base.width / 2 > vw / 2;
      const edge = alignsRight ? base.right : base.left;
      const snap = -(((edge % STEP) + STEP) % STEP);

      let placed = false;
      for (const [ox, dy] of OFFSETS) {
        const dx = ox + snap;
        const box: Box = {
          left: base.left + dx,
          right: base.right + dx,
          top: base.top + dy,
          bottom: base.bottom + dy,
        };
        // Whole drawing visible, or it is not worth drawing.
        if (box.left < minLeft || box.right > maxRight) continue;
        if (box.top < minTop || box.bottom > maxBottom) continue;
        // Zero tolerance against the rails: a two-pixel kiss still
        // reads as a drawing sitting on the ruler.
        if (keepout.some((k) => hits(box, k, 0))) continue;
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
