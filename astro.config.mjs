// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  /* Honour PORT so a preview harness can place the dev server on a
     free port. Astro would otherwise always take 4321 and collide
     with a dev server already running in a terminal. */
  server: { port: Number(process.env.PORT) || 4321 },
  // Change this to your real domain before deploying.
  site: 'https://example.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  devToolbar: { enabled: false },
});
