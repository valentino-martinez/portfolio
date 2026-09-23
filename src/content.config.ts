import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* ============================================================
   Content collections.

   Covers are plain paths into /public/media/. They get downsampled
   into a canvas and thrown away, so Astro's image pipeline would
   be doing work we'd immediately discard — a string path is the
   honest tool here.
   ============================================================ */

const base = {
  title: z.string(),
  /** One or two sentences. Used in listings, cards and <meta>. */
  summary: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  cover: z.string().optional(),
  /** Alt text for the cover. Required whenever there is a cover. */
  coverAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  /** Overrides the auto-assigned figure number, e.g. "3.4". */
  plate: z.string().optional(),
};

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    ...base,
    /** Rough read time is computed at build time if omitted. */
    minutes: z.number().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    ...base,
    year: z.union([z.number(), z.string()]),
    role: z.string().optional(),
    context: z.string().optional(),
    tools: z.array(z.string()).default([]),
    /** Pin to the top of the index and the home page. */
    featured: z.boolean().default(false),
    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),
  }),
});

/** Ceramics and woodworking share a shape: an object, made, described. */
const madeThing = {
  ...base,
  year: z.union([z.number(), z.string()]).optional(),
  materials: z.array(z.string()).default([]),
  dimensions: z.string().optional(),
  /** Where it ended up. */
  status: z
    .enum(["in-progress", "finished", "fired", "sold", "gifted", "broken"])
    .default("finished"),
};

const ceramics = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/ceramics" }),
  schema: z.object({
    ...madeThing,
    clay: z.string().optional(),
    glaze: z.string().optional(),
    /** Cone number, e.g. "6" or "10 reduction". */
    firing: z.string().optional(),
  }),
});

const woodworking = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/woodworking",
  }),
  schema: z.object({
    ...madeThing,
    species: z.array(z.string()).default([]),
    finish: z.string().optional(),
    joinery: z.array(z.string()).default([]),
  }),
});

/** Short entries for the interests page: a link, a note, a rating. */
const interests = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/interests" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["reading", "listening", "watching", "playing", "other"]),
    note: z.string().optional(),
    href: z.string().url().optional(),
    date: z.coerce.date().optional(),
    /** 0–5, printed as a bar of blocks. */
    rating: z.number().min(0).max(5).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog,
  projects,
  ceramics,
  woodworking,
  interests,
};
