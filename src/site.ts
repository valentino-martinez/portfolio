/* ============================================================
   site.ts — everything you'll want to change first, in one file.
   ============================================================ */

export const site = {
  name: "Valentino Martinez",
  /** Shown as the bitmap wordmark in the masthead. Keep it short. */
  mark: "V.M.",
  role: "Designer",
  location: "Stanford, CA",
  email: "valemar@stanford.edu",
  description:
    "Design, writing, ceramics and woodworking. A one-bit notebook.",
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
  { href: "/blog/", label: "Blog", index: "03" },
  { href: "/ceramics/", label: "Ceramics", index: "04" },
  { href: "/woodworking/", label: "Woodworking", index: "05" },
  { href: "/interests/", label: "Interests", index: "06" },
];

export const links: { label: string; href: string }[] = [
  { label: "Email", href: `mailto:${site.email}` },
  { label: "GitHub", href: "https://github.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Read.cv", href: "https://read.cv/" },
];

/** The ticker strip under the masthead. Edit freely — it's decor. */
export const ticker: string[] = [
  "proton",
  "neutron",
  "electron",
  "moron",
  "milli",
  "micro",
  "nano",
  "pico",
  "kilo",
  "mega",
  "giga",
  "tera",
  "order",
  "chaos",
  "play",
  "dream",
  "dance",
  "make sounds",
  "feel",
  "don't worry",
  "be happy",
];
