import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* GitHub Pages has no rewrite rules, so a hard refresh on /about asks
   the server for a file that does not exist. It serves 404.html for
   those, so shipping a copy of index.html under that name boots the
   app and lets the router read the path and render the right page.
   The response is still a 404 status; the content is correct. */
function spaFallback() {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const out = resolve(__dirname, "dist");
      copyFileSync(resolve(out, "index.html"), resolve(out, "404.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  /* Served from the apex of a custom domain, so assets resolve from
     the root. A project page at user.github.io/repo/ would need
     "/repo/" here instead. */
  base: "/",
  server: {
    /* 4321 belongs to the Astro dev server, which may still be
       running alongside this one. */
    port: Number(process.env.PORT) || 5173,
  },
});
