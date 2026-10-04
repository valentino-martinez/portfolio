import { useCallback, useEffect, useRef, useState } from "react";

/* Text that resolves out of noise.

   Only the *rendered* characters are substituted — never the length —
   so the box never reflows mid-run, and the caller keeps the real
   string to hand to assistive tech. */

const GLYPHS = "▓▒░#%&@*+=-<>/\\|[]{}()01";

export function useScramble(text: string, defaultDuration = 420) {
  const [shown, setShown] = useState(text);
  const raf = useRef(0);

  useEffect(() => setShown(text), [text]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const run = useCallback(
    (duration = defaultDuration) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      cancelAnimationFrame(raf.current);

      const chars = [...text];
      /* Each character settles at its own moment, left to right with
         a little jitter, so it reads as resolving rather than wiping. */
      const settle = chars.map(
        (_, i) => (i / Math.max(1, chars.length)) * 0.65 + Math.random() * 0.35
      );
      const t0 = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        setShown(
          chars
            .map((c, i) =>
              c === " " || t >= settle[i]!
                ? c
                : GLYPHS[(Math.random() * GLYPHS.length) | 0]
            )
            .join("")
        );
        if (t < 1) raf.current = requestAnimationFrame(tick);
        else setShown(text);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [text, defaultDuration]
  );

  return { shown, run };
}
