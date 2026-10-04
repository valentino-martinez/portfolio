import "./Photo.css";

/* A photograph, in black and white. Desaturated with a CSS filter
   and nothing else — no dithering, no tone curve, so the browser
   does the work on the GPU and no JavaScript is involved. */

interface Props {
  src: string;
  alt: string;
  /** e.g. "3/2". Locks the box and crops, so the layout cannot shift. */
  ratio?: string;
  loading?: "lazy" | "eager";
  className?: string;
}

export function Photo({
  src,
  alt,
  ratio,
  loading = "lazy",
  className = "",
}: Props) {
  return (
    <img
      className={`photo${ratio ? " photo--fixed" : ""} ${className}`.trim()}
      style={ratio ? ({ ["--ratio" as string]: ratio } as React.CSSProperties) : undefined}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
    />
  );
}
