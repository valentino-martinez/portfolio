import type { ElementType, ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

/* Wraps anything in the scroll entrance. `delay` staggers a run of
   siblings without hand-writing a delay on each one. */

interface Props {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: Props) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
