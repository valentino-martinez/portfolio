/* ============================================================
   rail.ts — the vertical tick scales down the page edges.

   They are not decoration. Each rail is a map of the document:
   a tick for every section, a label for each one, and an index
   mark that tracks where you are. Scrolling moves the mark;
   clicking a tick jumps to that section.

   Everything is expressed as a percentage of document height and
   written to CSS custom properties, so the only work per scroll
   frame is one style write.
   ============================================================ */

interface Stop {
  id: string;
  label: string;
  /** 0–1 position down the document. */
  at: number;
}

export function initRails(): () => void {
  const rails = Array.from(document.querySelectorAll<HTMLElement>("[data-rail]"));
  if (!rails.length) return () => {};

  // Sections opt in by carrying an id and a label.
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("main [id][data-rail-label]")
  );

  let stops: Stop[] = [];
  let docHeight = 1;

  function measure() {
    docHeight = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const full = Math.max(1, document.documentElement.scrollHeight);
    stops = sections.map((el) => ({
      id: el.id,
      label: el.dataset.railLabel || el.id,
      at: Math.min(1, Math.max(0, el.offsetTop / full)),
    }));
    build();
  }

  function build() {
    for (const rail of rails) {
      const marks = rail.querySelector<HTMLElement>("[data-rail-marks]");
      if (!marks) continue;
      marks.textContent = "";
      for (const stop of stops) {
        const a = document.createElement("a");
        a.className = "rail__stop";
        a.href = `#${stop.id}`;
        a.style.top = `${(stop.at * 100).toFixed(3)}%`;
        a.innerHTML =
          `<span class="rail__stopTick"></span>` +
          `<span class="rail__stopLabel">${stop.label}</span>`;
        marks.appendChild(a);
      }
    }
  }

  let queued = false;
  function update() {
    queued = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / docHeight));
    const pct = (progress * 100).toFixed(2);
    for (const rail of rails) {
      rail.style.setProperty("--rail-pos", `${pct}%`);
      const read = rail.querySelector<HTMLElement>("[data-rail-readout]");
      if (read) {
        read.textContent = String(Math.round(progress * 100)).padStart(3, "0");
      }
    }
    // Light up the section you are actually inside.
    const mid = window.scrollY + window.innerHeight * 0.4;
    let currentId = "";
    for (const el of sections) {
      if (el.offsetTop <= mid) currentId = el.id;
    }
    for (const rail of rails) {
      for (const stop of rail.querySelectorAll<HTMLElement>(".rail__stop")) {
        stop.toggleAttribute(
          "data-current",
          stop.getAttribute("href") === `#${currentId}`
        );
      }
    }
  }

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      measure();
      update();
    }, 150);
  };

  measure();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  // Images resolving changes the document height under us.
  window.addEventListener("load", onResize);

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("load", onResize);
  };
}
