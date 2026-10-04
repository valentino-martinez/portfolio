import { Plate } from "../components/Plate";
import { Reveal } from "../components/Reveal";
import { useTitle } from "../hooks/useTitle";
import { projects } from "../site";
import "./Page.css";

export function Projects() {
  useTitle("Projects");

  return (
    <article className="page section">
      <header className="head">
        <p className="label label--wide">
          <span className="section__no num">02</span> Projects
        </p>
        <h1 className="title title--xl">Projects</h1>
      </header>

      <div className="grid">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={i * 110}>
            <Plate no={p.plate} caption={p.title} meta={String(p.year)} hover>
              <div className="plate-empty plate-empty--4x3">
                <span className="label num">PLATE {p.plate}</span>
              </div>
            </Plate>
            <p className="card__summary">{p.summary}</p>
          </Reveal>
        ))}
      </div>
    </article>
  );
}
