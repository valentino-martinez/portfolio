import { useCallback, useEffect, useState } from "react";

/* INVERT — the two-colour "dark mode". There is no theme to load:
   the palette is two CSS variables and this swaps them. The initial
   value is already applied by the inline script in index.html, so
   this only has to read it back and keep it in sync. */

const KEY = "ap:invert";

function current(): boolean {
  const attr = document.documentElement.getAttribute("data-invert");
  if (attr === "on") return true;
  if (attr === "off") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useInvert() {
  const [inverted, setInverted] = useState(current);

  const toggle = useCallback(() => {
    setInverted((was) => {
      const next = !was;
      document.documentElement.setAttribute(
        "data-invert",
        next ? "on" : "off"
      );
      try {
        localStorage.setItem(KEY, next ? "on" : "off");
      } catch {
        /* private mode — the attribute still holds for this session */
      }
      return next;
    });
  }, []);

  /* Follow the OS only while the reader has not chosen here. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(KEY);
      } catch {
        /* ignore */
      }
      if (stored) return;
      document.documentElement.setAttribute(
        "data-invert",
        mq.matches ? "on" : "off"
      );
      setInverted(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { inverted, toggle };
}
