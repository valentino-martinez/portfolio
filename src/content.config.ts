import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* ============================================================
   Content collections — one of them.

   Covers are plain paths into /public/media/ rather than Astro
   image imports: they are displayed as-is, so the image pipeline
   would be doing work we'd immediately discard.
   ============================================================ */

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
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

export const collections = { projects };
