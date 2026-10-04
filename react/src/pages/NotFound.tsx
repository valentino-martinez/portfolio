import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import "./Page.css";
import { Scramble } from "../components/Scramble";

export function NotFound() {
  useTitle("Not found");

  return (
    <article className="page section">
      <header className="head">
        <p className="label label--wide">
          <span className="section__no num">404</span> Not found
        </p>
        <h1 className="title title--xl">404</h1>
      </header>

      <p className="prose">
        That page is not in this volume.{" "}
        <Link to="/">
          <Scramble text="Back to the index" />
        </Link>.
      </p>
    </article>
  );
}
