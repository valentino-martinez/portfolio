---
title: "Why one bit is enough"
summary: "On dithering, the Macintosh, and the strange fact that removing information can make an image more legible, not less."
date: 2026-08-14
tags: ["design", "dither", "history"]
---

The original Macintosh could not display grey. Not a dark grey, not a
light grey — the screen had one bit per pixel and that bit was either
on or off. Every photograph anyone put on that machine was a lie
constructed out of black dots on a white field.

## The trick

Dithering works because your eye integrates. Hold a dense field of
black dots far enough away and the retina stops resolving individual
dots and starts averaging them. Sixty percent coverage reads as sixty
percent grey. The image is not there; you are assembling it.

What makes this interesting rather than merely clever is that the
choice of *which* dots to turn on is an aesthetic decision, and
different algorithms have completely different personalities.

## Atkinson versus Floyd–Steinberg

Floyd–Steinberg distributes all of a pixel's quantisation error to its
neighbours. It is faithful. Bill Atkinson's variant, written for
MacPaint, throws away a quarter of the error on purpose.

That sounds like a bug. In practice it means highlights blow out to
pure white and shadows block up to pure black, and the midtones get
this bright, snappy, contrasty quality that no faithful algorithm
produces. It is wrong in a way that looks right on a small monochrome
screen.

> Every image on this site runs through Atkinson by default. It is
> not the most accurate choice. It is the one that looks like 1984.

## What this has to do with anything

I keep coming back to the idea that constraints are not obstacles
around which you design — they are the thing you are designing with.
One bit per pixel is a severe constraint. It also produced a decade of
graphic work that still looks more alive than most of what came after
it, once the machines got good enough to stop trying.
