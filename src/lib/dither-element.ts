/* ============================================================
   <x-dither> — the DOM wrapper around dither.ts.

   Usage (the <img> is the no-JS fallback and the pixel source):

     <x-dither algorithm="atkinson" scale="2" develop>
       <img src="/media/pot.jpg" alt="A thrown stoneware pot" />
     </x-dither>

   It re-renders on resize and whenever the page flips ink/paper,
   so a dithered image is never the wrong polarity.
   ============================================================ */

import {
  dither,
  halftone,
  cssColor,
  type DitherAlgorithm,
  type DitherOptions,
  type HalftoneOptions,
} from "./dither";

const REDUCED = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function attrNum(el: Element, name: string, fallback: number): number {
  const raw = el.getAttribute(name);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export class DitherElement extends HTMLElement {
  private img: HTMLImageElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private work: HTMLCanvasElement | null = null;
  private ready = false;
  private queued = false;
  /** Set once the element has scrolled into view and wants to develop. */
  private wantDevelop = false;
  private developed = false;
  private raf = 0;
  private lastWidth = -1;
  private ro: ResizeObserver | null = null;
  private io: IntersectionObserver | null = null;
  private themeObserver: MutationObserver | null = null;

  static get observedAttributes() {
    return [
      "algorithm",
      "scale",
      "levels",
      "brightness",
      "contrast",
      "gamma",
      "threshold",
      "invert",
      "vignette",
      "focus-x",
      "focus-y",
      "focus-radius",
      "focus-feather",
      "mode",
      "cell",
      "angle",
      "shape",
      "transparent",
    ];
  }

  connectedCallback() {
    this.img = this.querySelector("img");
    if (!this.img) return;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "dither";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", this.img.alt || "");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!this.ctx) return;

    this.work = document.createElement("canvas");
    this.appendChild(this.canvas);

    const start = () => {
      this.ready = true;
      // The develop pass may have already run against an unloaded
      // image, which would have poisoned lastWidth. Force a redraw.
      this.lastWidth = -1;
      this.render();
      if (this.wantDevelop) this.develop();
    };
    if (this.img.complete && this.img.naturalWidth > 0) start();
    else {
      this.img.addEventListener("load", start, { once: true });
      this.img.addEventListener(
        "error",
        () => this.removeAttribute("data-active"),
        { once: true }
      );
    }

    // Re-render at new widths, but only when the width actually changed —
    // ResizeObserver also fires on height changes we caused ourselves.
    this.ro = new ResizeObserver(() => this.schedule());
    this.ro.observe(this);

    // Flip with the theme.
    this.themeObserver = new MutationObserver(() => this.schedule(true));
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-invert"],
    });

    if (this.hasAttribute("develop") && !REDUCED()) {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            this.io?.disconnect();
            this.io = null;
            this.wantDevelop = true;
            // Only meaningful once there are pixels to develop.
            if (this.ready) this.develop();
          }
        },
        { rootMargin: "0px 0px -10% 0px" }
      );
      this.io.observe(this);
    }
  }

  disconnectedCallback() {
    this.ro?.disconnect();
    this.io?.disconnect();
    this.themeObserver?.disconnect();
    cancelAnimationFrame(this.raf);
  }

  attributeChangedCallback() {
    if (this.ready) this.schedule(true);
  }

  private options(): Partial<DitherOptions> {
    const root = document.documentElement;
    return {
      algorithm: (this.getAttribute("algorithm") ||
        "atkinson") as DitherAlgorithm,
      levels: attrNum(this, "levels", 2),
      brightness: attrNum(this, "brightness", 0),
      contrast: attrNum(this, "contrast", 0),
      gamma: attrNum(this, "gamma", 1),
      threshold: attrNum(this, "threshold", 0.5),
      invert: this.hasAttribute("invert"),
      ink: cssColor(root, "--ink", [0, 0, 0]),
      paper: cssColor(root, "--paper", [255, 255, 255]),
      transparentPaper: this.hasAttribute("transparent"),
      vignette: attrNum(this, "vignette", 0),
      focus: [attrNum(this, "focus-x", 0.5), attrNum(this, "focus-y", 0.5)],
      focusRadius: attrNum(this, "focus-radius", 0.55),
      focusFeather: attrNum(this, "focus-feather", 0.55),
    };
  }

  /** Coalesce bursts of resize/attribute changes into one render. */
  schedule(force = false) {
    if (!this.ready) return;
    if (force) this.lastWidth = -1;
    if (this.queued) return;
    this.queued = true;
    this.raf = requestAnimationFrame(() => {
      this.queued = false;
      this.render();
    });
  }

  /** Full pipeline: downsample → dither → blit. */
  render(overrides: Partial<DitherOptions> = {}) {
    const { img, canvas, ctx, work } = this;
    if (!img || !canvas || !ctx || !work || !img.naturalWidth) return;

    const cssWidth = this.clientWidth || img.naturalWidth;
    if (cssWidth <= 0) return;

    const pixel = Math.max(1, attrNum(this, "scale", 2));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const aspect = img.naturalHeight / img.naturalWidth;

    // Target buffer size: one buffer pixel per `scale` device pixels.
    const w = Math.max(8, Math.round((cssWidth * dpr) / pixel));
    const h = Math.max(8, Math.round(w * aspect));

    if (w === this.lastWidth && !Object.keys(overrides).length) return;
    this.lastWidth = w;

    const wctx = work.getContext("2d", { willReadFrequently: true });
    if (!wctx) return;
    work.width = w;
    work.height = h;
    wctx.imageSmoothingEnabled = true;
    wctx.imageSmoothingQuality = "high";
    wctx.drawImage(img, 0, 0, w, h);

    canvas.width = w;
    canvas.height = h;

    if (this.getAttribute("mode") === "halftone") {
      const ink = cssVar("--ink", "#000");
      const paper = cssVar("--paper", "#fff");
      halftone(ctx, wctx.getImageData(0, 0, w, h), {
        cell: attrNum(this, "cell", 6),
        angle: attrNum(this, "angle", 45),
        shape:
          (this.getAttribute("shape") as HalftoneOptions["shape"]) || "circle",
        gamma: attrNum(this, "gamma", 1),
        invert: this.hasAttribute("invert"),
        ink,
        paper,
      });
    } else {
      const data = wctx.getImageData(0, 0, w, h);
      dither(data, { ...this.options(), ...overrides });
      ctx.putImageData(data, 0, 0);
    }

    // Only now is it safe to take the <img> out of flow. Doing this at
    // connect time collapsed the host to zero height while lazy images
    // were still pending.
    this.setAttribute("data-active", "");
  }

  /**
   * "Develop" the image the way a print comes up in a tray: start
   * blown out to paper, then walk the exposure down to the real value.
   */
  private develop(duration = 900) {
    if (this.developed) return;
    this.developed = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      // easeOutCubic
      const e = 1 - Math.pow(1 - t, 3);
      const target = attrNum(this, "brightness", 0);
      this.render({ brightness: (1 - e) + target * e });
      if (t < 1) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.lastWidth = -1;
        this.render();
        this.setAttribute("data-developed", "");
      }
    };
    this.raf = requestAnimationFrame(step);
  }
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : fallback;
}

export function registerDither() {
  if (!customElements.get("x-dither")) {
    customElements.define("x-dither", DitherElement);
  }
}
