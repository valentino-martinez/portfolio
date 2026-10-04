import { Link } from "react-router-dom";
import { Photo } from "../components/Photo";
import { Plate } from "../components/Plate";
import { Reveal } from "../components/Reveal";
import { useTitle } from "../hooks/useTitle";
import { projects, site } from "../site";
import "./Index.css";
import { Scramble } from "../components/Scramble";

export function Index() {
  useTitle();

  return (
    <>
      {/* ---- THE POSTER ------------------------------------------
          Two masses on a diagonal: the photograph held to the right
          trim, the wordmark panel lying across its bottom left.
          Nothing centred in a void. */}
      <section className="poster">
        <div className="poster__sheet">
          <figure className="poster__figure">
            <div className="poster__shot">
              <Photo
                src="/media/portrait.jpg"
                alt={site.name}
                ratio="3/2"
                loading="eager"
              />
            </div>
          </figure>

          {/* The wordmark panel, set live rather than placed as a
              raster. Every measurement below is traced from the old
              838x341 export and expressed in cqw, so the type scales
              with the panel and the composition holds at any width.
              Being --ink and --paper, it follows the invert switch on
              its own; the raster had to be filtered by hand. */}
          <h1 className="poster__block">
            <span className="u-sr-only">
              {site.name} — {site.role}
            </span>

            <span className="poster__mark" aria-hidden="true">
              <span className="poster__name title">
                Valentino
                <br />
                Martinez
              </span>
              <span className="poster__role">{site.role}</span>
            </span>
          </h1>
        </div>
      </section>

      {/* ---- SELECTED WORK --------------------------------------- */}
      <section className="page section">
        <div className="section__head">
          <h2 className="label label--wide">
            <span className="section__no num">01</span> Selected Work
          </h2>
          <Link className="section__more label" to="/projects">
            <Scramble text="All projects →" />
          </Link>
        </div>

        <div className="grid">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 110}>
              <Plate no={p.plate} caption={p.title} meta={String(p.year)} hover>
                <div className="plate-empty plate-empty--4x3">
                  <span className="label num">PLATE {p.plate}</span>
                </div>
              </Plate>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- CLOSING --------------------------------------------- */}
      <section className="page section">
        <Reveal className="closing">
          <p className="label">Say hello</p>
          <p className="closing__big">
            <a href={`mailto:${site.email}`}>
              {/* "both": it resolves once as it scrolls into view,
                  and again on hover. */}
              <Scramble text={site.email} mode="both" />
            </a>
          </p>
        </Reveal>
      </section>
    </>
  );
}
