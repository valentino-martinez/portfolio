/* Shared shapes used by more than one component. Types live here
   rather than in .astro frontmatter, which is not a module other
   files can reliably import from. */

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
  | "arc" // a long shallow curve, the pendulum line
  | "horizon" // pixel landscape: dissolving sky over solid ground
  | "static"; // a rectangle of decaying noise

/** The worked-surface panels in Texture.astro. */
export type TextureType =
  | "hatch"
  | "crosshatch"
  | "scan"
  | "ramp"
  | "contour"
  | "stipple"
  | "grid";
