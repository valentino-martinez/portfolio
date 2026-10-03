/* ============================================================
   site.ts — everything you'll want to change first, in one file.
   ============================================================ */

export const site = {
  name: "Valentino Martinez",
  /** Shown as the bitmap wordmark in the masthead. Keep it short. */
  mark: "V.M.",
  role: "Design & Computer Science @ Stanford",
  location: "Stanford, CA",
  email: "valemar@stanford.edu",
  description:
    "Design and computer science at Stanford. Selected work, in black and white.",
  /** Used for absolute URLs; match astro.config.mjs. */
  url: "https://example.com",
  since: 2026,
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Two-digit plate number, printed beside the link. */
  index: string;
}

export const nav: NavItem[] = [
  { href: "/", label: "Index", index: "00" },
  { href: "/about/", label: "About", index: "01" },
  { href: "/projects/", label: "Projects", index: "02" },
];

export const links: { label: string; href: string }[] = [
  { label: "Email", href: `mailto:${site.email}` },
  { label: "GitHub", href: "https://github.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Read.cv", href: "https://read.cv/" },
];

