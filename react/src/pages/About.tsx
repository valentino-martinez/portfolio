import { Photo } from "../components/Photo";
import { Plate } from "../components/Plate";
import { Reveal } from "../components/Reveal";
import { useTitle } from "../hooks/useTitle";
import { site } from "../site";
import "./Page.css";
import { Scramble } from "../components/Scramble";

export function About() {
  useTitle("About");

  return (
    <article className="page section">
      <header className="head">
        <p className="label label--wide">
          <span className="section__no num">01</span> About
        </p>
        <h1 className="title title--xl">About</h1>
      </header>

      <div className="layout">
        <Reveal className="prose" as="div">
          <p>{site.role}. Based in {site.location}.</p>
          <p>
            Placeholder copy. This is where the long-form bit goes —
            what I make, how I work, and why everything here is set in
            two colours.
          </p>
          <p>
            Reach me at <a href={`mailto:${site.email}`}>
              <Scramble text={site.email} />
            </a>.
          </p>
        </Reveal>

        <Reveal delay={120} as="div">
          <Plate no="1.1" caption="Portrait" meta={String(site.since)}>
            <Photo src="/media/portrait.jpg" alt={site.name} ratio="4/5" />
          </Plate>
        </Reveal>
      </div>
    </article>
  );
}
