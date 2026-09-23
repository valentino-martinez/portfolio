import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { site } from "../site";
import { byDateDesc } from "../lib/format";

/* Hand-rolled so the project keeps a single dependency. If you later
   want enclosures, categories and the rest, swap this for @astrojs/rss. */

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ site: astroSite }) => {
  const origin = (astroSite?.href ?? site.url).replace(/\/$/, "");

  const posts = (await getCollection("blog"))
    .filter((p) => !p.data.draft)
    .sort(byDateDesc);

  const items = posts
    .map((post) => {
      const url = `${origin}/blog/${post.id}/`;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(post.data.summary)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)} — Blog</title>
    <link>${origin}/blog/</link>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escape(site.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
