import { useEffect, useRef } from "react";
import { useScramble } from "../hooks/useScramble";
import "./Scramble.css";

/* <Scramble text="Projects" />                 → on hover or focus
   <Scramble text="hi@…" mode="both" />         → also once, on entry

   The trigger is bound to the nearest enclosing link or button, so
   pointing anywhere on a link resolves its label — not just the few
   pixels of the text itself. */

type Mode = "hover" | "enter" | "both";

interface Props {
  text: string;
  mode?: Mode;
  className?: string;
}

export function Scramble({ text, mode = "hover", className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { shown, run } = useScramble(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: Array<() => void> = [];

    if (mode === "enter" || mode === "both") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            io.disconnect();
            run(600);
          }
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }

    if (mode === "hover" || mode === "both") {
      const onEnter = () => run();
      const target = el.closest("a, button") ?? el;
      target.addEventListener("pointerenter", onEnter);
      target.addEventListener("focus", onEnter);
      cleanups.push(() => {
        target.removeEventListener("pointerenter", onEnter);
        target.removeEventListener("focus", onEnter);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [mode, run]);

  return (
    <span ref={ref} className={`scramble ${className}`.trim()}>
      {/* The true text, for anyone not looking at the screen. The
          noise is decorative and stays out of the accessibility
          tree entirely. */}
      <span className="u-sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
