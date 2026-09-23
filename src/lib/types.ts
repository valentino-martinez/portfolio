/* Shared shapes used by more than one component. Types live here
   rather than in .astro frontmatter, which is not a module other
   files can reliably import from. */

/** One object in a studio index (ceramics, woodworking). */
export interface MakeItem {
  href: string;
  /** Plate number, e.g. "4.2". */
  no: string;
  title: string;
  summary: string;
  cover?: string;
  coverAlt?: string;
  /** Printed under the summary: materials, firing, finish. */
  specs: string[];
  /** Short right-hand caption: FIRED, IN PROGRESS, GIFTED. */
  status: string;
}

/** The drawn objects in Mark.astro — orbit rings, spirals, tick
 *  charts and the rest of the collage furniture. */
export type MarkType =
  | "orbit" // nested ellipses on a tilt
  | "spiral" // archimedean spiral
  | "checker" // checkerboard dissolving to nothing
  | "bars" // a little tick chart
  | "target" // registration circle and cross
  | "stack" // stepped blocks, a staircase of squares
  | "dots" // square field thinning out
  | "ring" // one ellipse, off-axis
  | "sunset" // filled panel, a disc half-sunk behind a horizon
  | "wave" // horizontal striations, like video static in a block
  | "arc"; // a long shallow curve, the pendulum line

/** One of the big shapes loose in the page. See Field.astro. */
export interface FieldShape {
  type: MarkType;
  /** Any CSS length. Past 100vw is encouraged. */
  width: string;
  /** Cells across. Keep it low so the tiles stay large. */
  grid: number;
  seed: number;
  /** Percent down the page. */
  top: string;
  /** Which edge it hangs off, and by how much. */
  side: "left" | "right";
  off: string;
  opacity: number;
  /** Scroll response — see src/lib/drift.ts. */
  drift: number;
  rise?: number;
  spin?: number;
  zoom?: number;
}

/** The pen-drawn studies in Sketch.astro. */
export type SketchType =
  | "box"
  | "box-hatch"
  | "cylinder"
  | "cone"
  | "sphere"
  | "plane"
  | "ellipses"
  | "spiral"
  | "helix"
  | "target"
  | "chart";
