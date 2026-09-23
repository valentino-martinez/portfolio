---
title: "Kiln log"
summary: "A small tool for recording firing schedules, glaze recipes and results — because a notebook in a ceramics studio does not survive."
date: 2026-05-12
year: 2026
role: "Design & build"
context: "Personal"
tools: ["TypeScript", "SQLite"]
featured: true
tags: ["tools", "ceramics"]
---

Every ceramicist keeps records and every ceramicist's records are
illegible, wet, and covered in slip. This is an attempt at a version
that survives the studio.

## The model

A firing has a schedule (ramps, holds, a target cone) and a load
(pieces, each with a clay body and a glaze). A result attaches to the
intersection. The interesting queries are all of the form "what did
this glaze do on this clay at this cone, the last five times?"

## What I learned

The hard part was not the data model. It was that nobody wants to
type while wearing gloves. Almost all of the design work went into
making entry take under fifteen seconds with one hand.
