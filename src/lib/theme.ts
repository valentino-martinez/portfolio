/* ============================================================
   theme.ts — INVERT.

   In a two-colour system "dark mode" is literally swapping the
   inks, so the control is called what it does. The choice lives
   in localStorage and is applied by a blocking inline script in
   <head> (see Base.astro) so there is never a flash.
   ============================================================ */

export const STORAGE_KEY = "ap:invert";

export function currentInvert(): boolean {
  const attr = document.documentElement.getAttribute("data-invert");
  if (attr === "on") return true;
  if (attr === "off") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function setInvert(on: boolean, persist = true): void {
  document.documentElement.setAttribute("data-invert", on ? "on" : "off");
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
      /* private mode — the attribute still applies for this session */
    }
  }
  document.dispatchEvent(
    new CustomEvent("ap:invert", { detail: { inverted: on } })
  );
}

export function initTheme(): () => void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-invert-toggle]")
  );

  const sync = () => {
    const on = currentInvert();
    for (const b of buttons) {
      b.setAttribute("aria-pressed", String(on));
      const label = b.querySelector("[data-invert-label]");
      if (label) label.textContent = on ? "POSITIVE" : "NEGATIVE";
    }
  };

  const onClick = () => {
    setInvert(!currentInvert());
    sync();
  };

  for (const b of buttons) b.addEventListener("click", onClick);

  // Follow the OS only while the user has not made a choice here.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!stored) {
      setInvert(mq.matches, false);
      sync();
    }
  };
  mq.addEventListener("change", onSystem);

  sync();

  return () => {
    for (const b of buttons) b.removeEventListener("click", onClick);
    mq.removeEventListener("change", onSystem);
  };
}
