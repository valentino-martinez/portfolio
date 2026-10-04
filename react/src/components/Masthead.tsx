import { NavLink } from "react-router-dom";
import { nav, site } from "../site";
import { useInvert } from "../hooks/useInvert";
import { Scramble } from "./Scramble";
import "./Masthead.css";

/* Masthead — sticky running head. Wordmark, numbered nav, and the
   invert switch. */

function NavItem({ to, label, index }: (typeof nav)[number]) {
  return (
    <li>
      <NavLink to={to} end={to === "/"} className="mast__link">
        <span className="mast__idx num" aria-hidden="true">
          {index}
        </span>
        <Scramble text={label} className="mast__label" />
      </NavLink>
    </li>
  );
}

export function Masthead() {
  const { inverted, toggle } = useInvert();

  return (
    <header className="mast">
      <div className="mast__bar page">
        <NavLink className="mast__mark" to="/" aria-label={`${site.name} — home`}>
          <span className="mast__wordmark title">{site.mark}</span>
        </NavLink>

        <nav className="mast__nav" aria-label="Primary">
          <ul>
            {nav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </ul>
        </nav>

        <div className="mast__instruments label">
          <button
            type="button"
            className="mast__invert"
            onClick={toggle}
            aria-pressed={inverted}
          >
            <span className="mast__swatch" aria-hidden="true" />
            {inverted ? "POSITIVE" : "NEGATIVE"}
          </button>
        </div>
      </div>
    </header>
  );
}
