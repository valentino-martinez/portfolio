---
title: "Bitmap specimen"
summary: "An interactive specimen for rasterising any installed typeface down to eight pixels and back."
date: 2026-02-08
year: 2026
role: "Design & build"
context: "Experiment"
tools: ["Canvas", "TypeScript"]
featured: false
tags: ["typography", "graphics"]
---

Draw text into a canvas at an absurdly small size, threshold away the
antialiasing, and scale it back up with nearest-neighbour sampling.
What comes out is a genuine bitmap letterform derived from a modern
outline font.

The interesting part is the threshold. Move it a few percent and a
typeface's whole personality changes — stems drop out, counters fill
in, and a humanist sans turns into something that looks like it came
off a dot-matrix printer.

The same technique renders every display heading on this site.
