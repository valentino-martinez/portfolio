import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Masthead } from "./components/Masthead";
import { Index } from "./pages/Index";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";
import { NotFound } from "./pages/NotFound";

/* A client router has no browser-supplied scroll reset and no
   document title change, so both happen here, once per navigation. */
function OnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Masthead />
      <OnNavigate />

      <main id="main">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
