/* ============================================================
   dither.ts — a real 1-bit image processor.

   Everything here is pure: give it pixels, get back pixels.
   No DOM, no globals, so it is trivially testable and could be
   moved into a Worker later without changing a line.
   ============================================================ */

export type DitherAlgorithm =
  | "floyd-steinberg"
  | "atkinson"
  | "jarvis"
  | "burkes"
  | "sierra-lite"
  | "bayer2"
  | "bayer4"
  | "bayer8"
  | "threshold"
  | "noise";

export interface DitherOptions {
  algorithm: DitherAlgorithm;
  /** Output tones. 2 = pure 1-bit. 3–6 gives posterised "more ink" looks. */
  levels: number;
  /** -1..1. Shifts the whole image toward paper (-) or ink (+). */
  brightness: number;
  /** -1..1. Pushes midtones apart before quantising. */
  contrast: number;
  /** 0.1..4. <1 opens shadows, >1 crushes them. */
  gamma: number;
  /** 0..1 cut point for `threshold`/`noise`, and a bias for the rest. */
  threshold: number;
  /** Swap ink and paper. */
  invert: boolean;
  /** Alternate scan direction each row. Kills diagonal artefacts. */
  serpentine: boolean;
  /** RGB written for the dark tone. */
  ink: [number, number, number];
  /** RGB written for the light tone. */
  paper: [number, number, number];
  /** Make the paper tone fully transparent instead of opaque. */
  transparentPaper: boolean;
  /**
   * 0–1. Fades the image toward paper away from `focus`, so a subject
   * lifts out of a background instead of the whole frame going to ink.
   * Photographs with a dark, busy background — foliage, interiors —
   * otherwise dither to a solid block at about 80% coverage.
   */
  vignette: number;
  /** Centre of the fade, in 0–1 image coordinates. */
  focus: [number, number];
  /** How far the untouched area reaches, as a fraction of half-width. */
  focusRadius: number;
  /** How gradually the fade arrives. Small = a hard edge. */
  focusFeather: number;
}

export const DEFAULTS: DitherOptions = {
  algorithm: "atkinson",
  levels: 2,
  brightness: 0,
  contrast: 0,
  gamma: 1,
  threshold: 0.5,
  invert: false,
  serpentine: true,
  ink: [0, 0, 0],
  paper: [255, 255, 255],
  transparentPaper: false,
  vignette: 0,
  focus: [0.5, 0.5],
  focusRadius: 0.55,
  focusFeather: 0.55,
};

/* ------------------------------------------------------------
   Error-diffusion kernels.
   Each point is [dx, dy, weight]; weights are divided by `div`.
   ------------------------------------------------------------ */

type Kernel = { div: number; points: readonly (readonly [number, number, number])[] };

const KERNELS: Record<string, Kernel> = {
  "floyd-steinberg": {
    div: 16,
    points: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
  },
  // Atkinson only propagates 6/8 of the error, so highlights blow out
  // and shadows block up. That "lost ink" is exactly the early-Mac look.
  atkinson: {
    div: 8,
    points: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
  },
  jarvis: {
    div: 48,
    points: [
      [1, 0, 7], [2, 0, 5],
      [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
      [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1],
    ],
  },
  burkes: {
    div: 32,
    points: [
      [1, 0, 8], [2, 0, 4],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
    ],
  },
  "sierra-lite": {
    div: 4,
    points: [
      [1, 0, 2],
      [-1, 1, 1], [0, 1, 1],
    ],
  },
};

/* ------------------------------------------------------------
   Ordered (Bayer) matrices, generated rather than hardcoded.
   M(2n) = [[4M, 4M+2], [4M+3, 4M+1]]
   ------------------------------------------------------------ */

const bayerCache = new Map<number, Float32Array>();

/** Returns an n×n matrix of thresholds normalised to (0,1), row-major. */
export function bayerMatrix(n: number): Float32Array {
  const cached = bayerCache.get(n);
  if (cached) return cached;

  let m: number[][] = [[0]];
  while (m.length < n) {
    const size = m.length;
    const next: number[][] = Array.from({ length: size * 2 }, () =>
      new Array<number>(size * 2).fill(0)
    );
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = m[y]![x]! * 4;
        next[y]![x] = v;
        next[y]![x + size] = v + 2;
        next[y + size]![x] = v + 3;
        next[y + size]![x + size] = v + 1;
      }
    }
    m = next;
  }

  const total = n * n;
  const out = new Float32Array(total);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // +0.5 centres each threshold in its bucket, so a flat 50% grey
      // dithers to an even checker instead of drifting dark.
      out[y * n + x] = (m[y]![x]! + 0.5) / total;
    }
  }
  bayerCache.set(n, out);
  return out;
}

/* ------------------------------------------------------------
   Tone mapping
   ------------------------------------------------------------ */

/** sRGB luminance, then brightness → contrast → gamma. Returns 0..1. */
export function toGrayscale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: Pick<
    DitherOptions,
    | "brightness"
    | "contrast"
    | "gamma"
    | "invert"
    | "vignette"
    | "focus"
    | "focusRadius"
    | "focusFeather"
  >
): Float32Array {
  const out = new Float32Array(width * height);
  // Standard contrast curve; +1 => hard, -1 => flat.
  const c = Math.max(-0.99, Math.min(0.99, opts.contrast));
  const cf = (1.015 * (c + 1)) / (1.0 * (1.015 - c));
  const invGamma = 1 / Math.max(0.01, opts.gamma);

  const vig = Math.max(0, Math.min(1, opts.vignette ?? 0));
  const [fx, fy] = opts.focus ?? [0.5, 0.5];
  const radius = Math.max(0.01, opts.focusRadius ?? 0.55);
  const feather = Math.max(0.01, opts.focusFeather ?? 0.55);
  // Keep the falloff circular rather than stretched with the frame.
  const aspect = height / Math.max(1, width);

  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    const r = data[p]! / 255;
    const g = data[p + 1]! / 255;
    const b = data[p + 2]! / 255;
    const a = data[p + 3]! / 255;

    let v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Composite onto paper so PNG transparency doesn't dither to noise.
    v = v * a + (1 - a);

    v += opts.brightness;
    v = (v - 0.5) * cf + 0.5;
    v = Math.pow(Math.max(0, Math.min(1, v)), invGamma);

    if (vig > 0) {
      const x = (i % width) / width;
      const y = Math.floor(i / width) / height;
      const dx = x - fx;
      const dy = (y - fy) * aspect;
      const d = Math.sqrt(dx * dx + dy * dy);
      // 0 inside the focus, ramping to 1 across the feather.
      const t = Math.max(0, Math.min(1, (d - radius) / feather));
      // smoothstep, so the edge of the fade has no visible ring
      const fade = t * t * (3 - 2 * t) * vig;
      v = v + (1 - v) * fade;
    }

    if (opts.invert) v = 1 - v;

    out[i] = v;
  }
  return out;
}

/* ------------------------------------------------------------
   The main event
   ------------------------------------------------------------ */

/** Quantise 0..1 to the nearest of `levels` evenly spaced tones. */
function quantize(v: number, levels: number): number {
  if (levels <= 2) return v < 0.5 ? 0 : 1;
  const steps = levels - 1;
  return Math.round(Math.max(0, Math.min(1, v)) * steps) / steps;
}

/**
 * Dither in place. `imageData` is mutated and returned.
 * Cost is O(width × height × kernel), ~8ms for a 800×600 image.
 */
export function dither(
  imageData: ImageData,
  options: Partial<DitherOptions> = {}
): ImageData {
  const o: DitherOptions = { ...DEFAULTS, ...options };
  const { width, height, data } = imageData;
  const gray = toGrayscale(data, width, height, o);

  const algo = o.algorithm;

  if (algo.startsWith("bayer")) {
    const n = Number(algo.slice(5)) || 4;
    const m = bayerMatrix(n);
    const bias = o.threshold - 0.5;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const t = m[(y % n) * n + (x % n)]!;
        // Nudge the pixel by how far the matrix threshold sits from mid,
        // then quantise normally. Works for levels > 2 as well.
        const spread = 1 / Math.max(1, o.levels - 1);
        gray[i] = quantize(gray[i]! + (t - 0.5) * spread - bias, o.levels);
      }
    }
  } else if (algo === "threshold" || algo === "noise") {
    const jitter = algo === "noise" ? 1 : 0;
    for (let i = 0; i < gray.length; i++) {
      const t = o.threshold + (jitter ? (Math.random() - 0.5) * 0.7 : 0);
      gray[i] = gray[i]! < t ? 0 : 1;
    }
  } else {
    const kernel = KERNELS[algo] ?? KERNELS["atkinson"]!;
    const { div, points } = kernel;
    const bias = o.threshold - 0.5;

    for (let y = 0; y < height; y++) {
      const leftToRight = !o.serpentine || y % 2 === 0;
      const xStart = leftToRight ? 0 : width - 1;
      const xEnd = leftToRight ? width : -1;
      const xStep = leftToRight ? 1 : -1;

      for (let x = xStart; x !== xEnd; x += xStep) {
        const i = y * width + x;
        const old = gray[i]!;
        const next = quantize(old - bias, o.levels);
        gray[i] = next;
        const err = old - next;
        if (err === 0) continue;

        for (const [dx0, dy, w] of points) {
          const dx = leftToRight ? dx0 : -dx0;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny >= height) continue;
          gray[ny * width + nx]! += (err * w) / div;
        }
      }
    }
  }

  // Write the two (or few) tones back out.
  const [ir, ig, ib] = o.ink;
  const [pr, pg, pb] = o.paper;
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const v = Math.max(0, Math.min(1, gray[i]!));
    data[p] = ir + (pr - ir) * v;
    data[p + 1] = ig + (pg - ig) * v;
    data[p + 2] = ib + (pb - ib) * v;
    data[p + 3] = o.transparentPaper ? Math.round((1 - v) * 255) : 255;
  }

  return imageData;
}

/* ------------------------------------------------------------
   Halftone — not a dither, a screen. Draws dots whose radius
   tracks local density, on a rotated grid like a print screen.
   ------------------------------------------------------------ */

export interface HalftoneOptions {
  /** Distance between dot centres, in pixels. */
  cell: number;
  /** Screen angle in degrees. 45 is the classic black separation. */
  angle: number;
  /** "circle" | "square" | "line" */
  shape: "circle" | "square" | "line";
  ink: string;
  paper: string;
  invert: boolean;
  gamma: number;
}

export const HALFTONE_DEFAULTS: HalftoneOptions = {
  cell: 6,
  angle: 45,
  shape: "circle",
  ink: "#000",
  paper: "#fff",
  invert: false,
  gamma: 1,
};

/** Samples `source` and paints a halftone screen into `ctx`. */
export function halftone(
  ctx: CanvasRenderingContext2D,
  source: ImageData,
  options: Partial<HalftoneOptions> = {}
): void {
  const o = { ...HALFTONE_DEFAULTS, ...options };
  const { width, height, data } = source;

  ctx.save();
  ctx.fillStyle = o.paper;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = o.ink;

  const rad = (o.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Cover the corners once the grid is rotated.
  const reach = Math.ceil((width + height) / o.cell);
  const invGamma = 1 / Math.max(0.01, o.gamma);
  const maxR = (o.cell * Math.SQRT2) / 2;

  for (let j = -reach; j < reach; j++) {
    for (let i = -reach; i < reach; i++) {
      // Grid position rotated into image space.
      const gx = i * o.cell;
      const gy = j * o.cell;
      const x = gx * cos - gy * sin + width / 2;
      const y = gx * sin + gy * cos + height / 2;
      if (x < -o.cell || y < -o.cell || x > width + o.cell || y > height + o.cell)
        continue;

      const px = Math.max(0, Math.min(width - 1, Math.round(x)));
      const py = Math.max(0, Math.min(height - 1, Math.round(y)));
      const p = (py * width + px) * 4;
      const lum =
        (0.2126 * data[p]! + 0.7152 * data[p + 1]! + 0.0722 * data[p + 2]!) / 255;

      let v = Math.pow(lum, invGamma);
      if (o.invert) v = 1 - v;
      const density = 1 - v; // 1 = solid ink
      if (density <= 0.01) continue;

      // Area, not radius, is proportional to density — otherwise
      // midtones read far too dark.
      const r = maxR * Math.sqrt(density);

      ctx.beginPath();
      if (o.shape === "circle") {
        ctx.arc(x, y, r, 0, Math.PI * 2);
      } else if (o.shape === "square") {
        ctx.rect(x - r, y - r, r * 2, r * 2);
      } else {
        ctx.rect(x - maxR, y - r, maxR * 2, r * 2);
      }
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------ */

/** Parse "#fff" / "#ffffff" / "rgb(0 0 0)" into [r,g,b]. */
export function parseColor(input: string): [number, number, number] {
  const s = input.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0]! + hex[0]!, 16),
        parseInt(hex[1]! + hex[1]!, 16),
        parseInt(hex[2]! + hex[2]!, 16),
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }
  const nums = s.match(/[\d.]+/g);
  if (nums && nums.length >= 3) {
    return [Number(nums[0]), Number(nums[1]), Number(nums[2])];
  }
  return [0, 0, 0];
}

/** Reads a CSS custom property off an element and returns RGB. */
export function cssColor(
  el: Element,
  prop: string,
  fallback: [number, number, number]
): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(prop);
  return raw ? parseColor(raw) : fallback;
}
