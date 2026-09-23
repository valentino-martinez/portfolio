/* ============================================================
   cursor.ts — a registration crosshair with a live coordinate
   readout, like the corner marks on a press sheet.

   Pointer-only: never mounts on touch, never on reduced motion.
   Positions are written with transform inside a rAF so we do not
   thrash layout on every mousemove.
   ============================================================ */

export function initCursor(): () => void {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || reduced.matches) return () => {};

  const root = document.createElement("div");
  root.className = "cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <i class="cursor__v"></i>
    <i class="cursor__h"></i>
    <b class="cursor__box"></b>
    <span class="cursor__read num"></span>
  `;
  document.body.appendChild(root);

  const v = root.querySelector<HTMLElement>(".cursor__v")!;
  const h = root.querySelector<HTMLElement>(".cursor__h")!;
  const box = root.querySelector<HTMLElement>(".cursor__box")!;
  const read = root.querySelector<HTMLElement>(".cursor__read")!;

  let x = -100;
  let y = -100;
  let raf = 0;
  let dirty = false;
  let shown = false;

  const draw = () => {
    raf = 0;
    dirty = false;
    v.style.transform = `translateX(${x}px)`;
    h.style.transform = `translateY(${y}px)`;
    box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    read.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    read.textContent = `${String(Math.round(x)).padStart(4, "0")} ${String(
      Math.round(y)
    ).padStart(4, "0")}`;
  };

  const onMove = (e: PointerEvent) => {
    x = e.clientX;
    y = e.clientY;
    if (!shown) {
      shown = true;
      root.setAttribute("data-on", "");
    }
    if (!dirty) {
      dirty = true;
      raf = requestAnimationFrame(draw);
    }
  };

  const onLeave = () => {
    shown = false;
    root.removeAttribute("data-on");
  };

  // Thicken the crosshair over anything clickable.
  const onOver = (e: Event) => {
    const t = e.target as Element | null;
    const hot = !!t?.closest?.("a, button, [data-hot]");
    root.toggleAttribute("data-hot", hot);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.addEventListener("pointerover", onOver, { passive: true });
  window.addEventListener("blur", onLeave);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("blur", onLeave);
    root.remove();
  };
}
