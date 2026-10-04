# Display font

Titles are set in **BigBlue Terminal 437TT** — an 8×12 console font drawn
from the 8×14 EGA/VGA charset.

    © 2015 VileR — https://int10h.org
    Licensed under Creative Commons Attribution-ShareAlike 4.0 International
    Full licence text: LICENSE.txt (and https://creativecommons.org/licenses/by-sa/4.0/)

Bundled here:

| File | What |
|---|---|
| `BigBlueTerminal-437TT.ttf` | CP437 charset. The one titles actually use. |
| `BigBlueTerminalPlus.ttf` | Extended Unicode cut, sits behind 437TT in the stack so stray glyphs have somewhere to fall through to. |
| `LICENSE.txt` | CC BY-SA 4.0, as shipped by the author. Keep it. |

## Two things to know

**It is a bitmap font.** The native cell is 8×12, so it is only genuinely
crisp at 12px and integer multiples — 24, 36, 48, 72, 96. Every `.title`
size in `src/styles/global.css` is a hard step for that reason, not a
fluid `clamp()`. If you add a size, make it a multiple of 12.

**Attribution is a licence condition, not a courtesy.** The credit in the
site colophon and this file satisfy it. If you restyle the colophon, keep
the credit somewhere.

## Optional: shrink it

The TTF is 25 KB, which is small enough to leave alone. If you want it
smaller, convert to woff2 (roughly a quarter of the size) and add a
`url(...) format("woff2")` line *before* the truetype one in the
`@font-face` rule:

```bash
pip install fonttools brotli
python3 -c "from fontTools.ttLib import TTFont; f=TTFont('BigBlueTerminal-437TT.ttf'); f.flavor='woff2'; f.save('BigBlueTerminal-437TT.woff2')"
```
