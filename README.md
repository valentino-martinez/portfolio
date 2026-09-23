# analog-portfolio

A one-bit personal site. Black ink, white paper, nothing in between —
every apparent shade of grey is a dither pattern your eye is averaging
for you.

Built with [Astro](https://astro.build) + TypeScript. Zero runtime
frameworks; the effects are ~10KB of hand-written vanilla TS.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # serve the build
npm run check    # astro check (types + templates)
```

---

## Change these first

| What | Where |
|---|---|
| Your name, role, email, nav, ticker words | `src/site.ts` |
| Colours, type scale, spacing, motion | `src/styles/tokens.css` |
| Display font stack | `src/styles/tokens.css` → `--font-display` |
| Display font files + licence | `public/fonts/` |
| Deploy domain | `astro.config.mjs` → `site` |
| Bio, "Now", timeline, tools | `src/pages/about.astro` |

Everything else follows from those.

---

## Writing content

Each section is a content collection: drop a markdown file in the right
folder and it appears, sorted newest-first, with its own detail page.

```
src/content/
├── blog/          → /blog/<filename>/
├── projects/      → /projects/<filename>/
├── ceramics/      → /ceramics/<filename>/
├── woodworking/   → /woodworking/<filename>/
└── interests/     → cards on /interests/ (frontmatter only, no body)
```

Frontmatter is validated at build time — a typo fails the build rather
than silently rendering nothing. The schemas live in
`src/content.config.ts`. Common fields:

```yaml
---
title: "Faceted vase"
summary: "One or two sentences. Used in listings and <meta>."
date: 2026-07-19
cover: "/media/your-photo.jpg"   # a path in public/
coverAlt: "Required whenever there is a cover"
tags: ["vessel", "thrown"]
draft: false                      # drafts show in dev, vanish in build
---
```

Plus per-collection extras: `year / role / tools / links` for projects,
`clay / glaze / firing` for ceramics, `species / joinery / finish` for
woodworking, `kind / rating / href` for interests.

**Images** go in `public/media/` and are referenced by path. They are
downsampled into a canvas and thrown away, so there is no point putting
a 4000px photo in — 1200px wide is plenty.

**Your headshot.** Drop it into `public/media/` named `portrait.jpg` (or
`.png`/`.webp`/`.avif`). That is the only step — `src/pages/index.astro`
detects it at build time and the hero swaps from an empty plate to your
photograph with no code change. See `public/media/README.md`.

**There are no placeholder images.** Anything without a real photograph
renders an empty plate — a reserved rectangle at the right aspect ratio.
Earlier versions shipped procedurally generated images that were dithered
on the client; they were a real cost on every page for pictures nobody was
going to keep. Add a `cover:` to any entry's frontmatter and that card
starts showing a dithered photograph instead; leave it off and you get the
box.

---

## The graphics engine

### `src/lib/dither.ts`

Pure functions, no DOM. `dither(imageData, options)` mutates and returns
an `ImageData`.

- **Error diffusion:** `floyd-steinberg`, `atkinson`, `jarvis`,
  `burkes`, `sierra-lite` — with optional serpentine scanning.
- **Ordered:** `bayer2`, `bayer4`, `bayer8` (matrices generated, not
  hardcoded).
- **Plain:** `threshold`, `noise`.
- **`halftone(ctx, imageData, options)`** draws a rotated dot screen
  instead — circles, squares or lines, at any angle.

`atkinson` is the default because it throws away a quarter of the
quantisation error on purpose, blowing out highlights and blocking up
shadows. That is the MacPaint look.

### `<x-dither>` — `src/lib/dither-element.ts`

```astro
<Dither
  src="/media/pot.jpg"
  alt="A thrown stoneware pot"
  algorithm="atkinson"
  scale={2}          <!-- device pixels per dither cell; 4 = chunky -->
  contrast={0.2}
  ratio="4/3"        <!-- optional: locks the box, prevents CLS -->
  develop            <!-- fades up from white on first scroll-in -->
/>
```

The `<img>` inside is both the pixel source and the no-JS fallback. The
element re-renders on resize and whenever the page flips polarity, so a
dithered image is never the wrong way round.

### Display type

Titles are set in **BigBlue Terminal** — an 8×12 console font after the
IBM EGA/VGA charset, by VileR, bundled in `public/fonts/` under CC BY-SA
4.0. Markup is plain text:

```astro
<h1 class="title title--xl">Ceramics</h1>
```

`.title` applies the face, uppercases, kills synthetic bold, and turns
**antialiasing off** so the pixel grid survives instead of being smoothed.

**Sizes are hard steps — 24 / 36 / 48 / 72 / 96 — never `clamp()`.** The
font has a native 8×12 cell and is only crisp at multiples of 12. Fluid
type would land on a fractional cell at nearly every viewport width and
soften the letterforms. `--sm` is 24, `--lg` is 36→48, `--xl` is 48→72.
If you add a size, keep it a multiple of 12.

The credit in the colophon is a licence condition of CC BY-SA, not a
courtesy — see `public/fonts/README.md`.

### `src/lib/backdrop.ts`

The faint field behind everything: a few summed sine waves ordered-dithered
through a Bayer matrix. **It is still by default** — a background that breathes
competes with the photographs, which are meant to be the loud thing on the
page. Each route gets a different phase so pages do not look identical.

If you ever want it to drift, add `data-animate` to the canvas in
`src/layouts/Base.astro`; `data-pointer="1"` additionally warps it toward the
cursor. Both are off. When animating, it shades ~40k pixels a frame (not 4
million) because the buffer is one pixel per `cell` device pixels, the
x-dependent half of each wave is precomputed per frame so the inner loop has no
`sin()`/`sqrt()`/`exp()` in it, and frame cost is sampled so the cell grows if
it misses budget.

Opacity per page via the `backdrop` prop on the layout; `0` removes it.

## Other parts

| File | Does |
|---|---|
| `src/components/Mark.astro` | The drawn objects — orbits, spirals, tick charts, targets, staircases — rasterised onto a coarse grid at build time and emitted as one `<rect>` per cell. `width` takes any CSS length; drop `grid` as you go bigger so the tiles stay countable. `type="ba"` is not generated: it is `BAexample.svg` traced cell for cell. |
| `src/pages/type.astro` | Specimen sheet at `/type`, unlinked — character set, three sizes, and a probe telling you whether the display font actually loaded. Delete it whenever. |
| `src/components/SideRail.astro` + `src/lib/rail.ts` | The vertical tick scales at the page edges. Not decoration: a tick and label per section, an index mark tracking your position, a percentage readout. Clicking a tick jumps. Sections opt in with `id` + `data-rail-label`. |
| `src/lib/reveal.ts` | `[data-reveal]` scroll entrances; `[data-reveal-group="70"]` auto-staggers children |
| `src/lib/scramble.ts` | `[data-scramble]` text resolving out of noise, on hover or `="enter"` |
| `src/lib/cursor.ts` | Registration crosshair with a live coordinate readout |
| `src/lib/theme.ts` | INVERT — swaps the two colour variables, persists to localStorage |
| `src/lib/main.ts` | Boots all of the above; the only script the pages load |

## Principles worth keeping

1. **Two colours.** If you find yourself reaching for a grey, reach for
   a dither pattern instead. `<ToneScale>` shows the vocabulary.
2. **Nothing requires JavaScript.** Turn scripts off: you get every
   word, every photograph, every heading, a clean document. Only the
   dithering, the crosshair and the rail readout need scripts, and all
   three degrade to nothing.
3. **Nothing moves on its own.** No ambient animation anywhere: the
   backdrop is a still frame, the grain does not flicker, the word
   chain does not scroll. What motion exists is a response to
   something you did — a hover, a scroll entrance — and all of it
   respects `prefers-reduced-motion`. The drawn objects sit in the
   page and scroll with it like any other element.
4. **Inverting is free.** Because "dark mode" is literally swapping
   `--ink` and `--paper`, never hardcode `#000` or `#fff` outside
   `tokens.css`.

## Deploying

Static output — anything that serves files works.

- **Netlify / Vercel:** build `npm run build`, publish `dist`.
- **GitHub Pages:** same, plus set `site` and `base` in
  `astro.config.mjs`.

Set `site` in `astro.config.mjs` to your real domain first, or canonical
URLs and the RSS feed will point at `example.com`.

## Credit

The visual language is lifted, with affection, from April Greiman's
*Design Quarterly* no. 133 (1986) — the issue she turned into a single
two-by-six-foot poster on a Macintosh that could not display grey.
