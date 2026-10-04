import type { ReactNode } from "react";
import "./Plate.css";

/* Plate — a numbered figure, set like a page from a design history
   book: hairline box, caption rule, plate number, registration
   crosses at the corners. */

interface Props {
  /** Figure number, e.g. "2.1". */
  no?: string;
  caption?: string;
  /** Right-aligned metadata: year, medium, dimensions. */
  meta?: string;
  /** Invert the whole plate on hover. */
  hover?: boolean;
  children: ReactNode;
}

export function Plate({ no, caption, meta, hover = false, children }: Props) {
  return (
    <figure className={`plate${hover ? " plate--hover" : ""}`}>
      <span className="plate__mark plate__mark--tl" aria-hidden="true" />
      <span className="plate__mark plate__mark--tr" aria-hidden="true" />
      <span className="plate__mark plate__mark--bl" aria-hidden="true" />
      <span className="plate__mark plate__mark--br" aria-hidden="true" />

      <div className="plate__body">{children}</div>

      {(caption || meta) && (
        <figcaption className="plate__caption">
          <span className="plate__text">
            {no && <span className="plate__no num">{no}</span>}
            {caption}
          </span>
          {meta && <span className="plate__meta num">{meta}</span>}
        </figcaption>
      )}
    </figure>
  );
}
