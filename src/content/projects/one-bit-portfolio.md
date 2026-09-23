---
title: "One-bit portfolio"
summary: "This site. A black-and-white publishing system with a real dithering engine running in the browser."
date: 2026-09-01
year: 2026
role: "Design & build"
context: "Personal"
tools: ["Astro", "TypeScript", "Canvas"]
featured: true
plate: "2.1"
tags: ["web", "typography", "graphics"]
links:
  - label: "Source"
    href: "https://github.com/"
---

A portfolio built around a single constraint: two colours, and every
apparent tone in between has to be constructed out of them.

## What it does

Images are loaded at full colour, downsampled to a buffer sized in
dither cells rather than pixels, converted to luminance, and pushed
through a choice of error-diffusion or ordered-dither algorithms —
Atkinson, Floyd–Steinberg, Jarvis, Burkes, Bayer 2/4/8 — then written
back out as pure ink and paper.

The background is an analytic interference field: a few summed sine
waves, ordered-dithered through a Bayer matrix every frame, with a
ripple that chases the pointer.

## Constraints that shaped it

- **Two colours, no exceptions.** Inverting the page is literally
  swapping the two variables, so "dark mode" was free.
- **No JavaScript required.** Every effect is progressive
  enhancement; with scripts off the site is a plain document.
- **Nothing that cannot be turned down.** All motion respects
  `prefers-reduced-motion`.
