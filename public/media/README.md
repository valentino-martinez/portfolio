# Images

## Your headshot

Drop it in here named **`portrait`** — any of `.jpg`, `.jpeg`, `.png`,
`.webp`, `.avif`:

    public/media/portrait.jpg

That is the whole step. `src/pages/index.astro` looks for it at build
time, and the hero swaps from an empty plate to your photograph with no
code change. Until then the plate holds the same 4:5 box, so the layout
does not jump when you add it.

The hero dithers it with `transparent`, which drops the light tones out
entirely and leaves the figure sitting on the paper as halftone dots with
no frame. **Pick a shot with a bright, simple background** and that will
look right immediately. A dark or busy background will fill the whole
rectangle with ink and read as a blob.

Around 1200px on the long edge is plenty — the image is downsampled into
a canvas and the original resolution is thrown away.

## Everything else

Covers for projects, posts, pots and furniture go here too, referenced
from frontmatter by path:

```yaml
cover: "/media/faceted-vase.jpg"
coverAlt: "A faceted stoneware vase, tenmoku glaze"
```

With no `cover:` the card shows an empty plate. With one, it is dithered
the same way everything else is.
