/* ============================================================
   site.ts — everything you'll want to change first, in one file.
   ============================================================ */

export const site = {
  name: "Valentino Martinez",
  /** The short wordmark in the masthead. */
  mark: "V.M.",
  role: "Design & Computer Science @ Stanford",
  location: "Stanford, CA",
  email: "valemar@stanford.edu",
  description:
    "Design and computer science at Stanford. Selected work, in black and white.",
  since: 2026,
} as const;

export interface NavItem {
  to: string;
  label: string;
  /** Two-digit plate number, printed beside the link. */
  index: string;
}

export const nav: NavItem[] = [
  { to: "/", label: "Index", index: "00" },
  { to: "/about", label: "About", index: "01" },
  { to: "/projects", label: "Projects", index: "02" },
];

export interface Project {
  slug: string;
  title: string;
  summary: string;
  year: string | number;
  plate: string;
  /** A path in public/media, or omit for a reserved plate. */
  cover?: string;
  coverAlt?: string;
}

/* Placeholder entries. Swap in real ones — or move this to a CMS,
   a JSON file, or a route loader later; nothing else depends on
   where it comes from. */
export const projects: Project[] = [
  {
    slug: "one-bit-portfolio",
    title: "One-bit portfolio",
    summary:
      "This site. A black-and-white publishing system built on two colours and a lot of straight rules.",
    year: 2026,
    plate: "2.1",
  },
  {
    slug: "kiln-log",
    title: "Kiln log",
    summary:
      "A small tool for recording firing schedules, glaze recipes and results.",
    year: 2026,
    plate: "2.2",
  },
  {
    slug: "type-specimen",
    title: "Bitmap specimen",
    summary:
      "An interactive specimen for rasterising any installed typeface down to eight pixels and back.",
    year: 2026,
    plate: "2.3",
  },
];
