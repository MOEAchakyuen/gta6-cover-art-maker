# Vice Cover Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/MOEAchakyuen/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/MOEAchakyuen/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A GTA 6-style poster cover maker that runs entirely offline in your browser. Load your own photos (or the built-in samples), arrange them in a multi-panel poster, crop and position each panel, write a bold caption, pick a Vice City sunset or neon colour grade, and export a share-ready PNG.

## What it does

- **Multi-panel layouts** — 1 full-bleed panel, 2 panels (big + small), a 3-panel comic strip, or a 4-panel grid. Each panel takes its own photo, or fill all panels with one photo.
- **Crop and position** — drag a panel to pan its photo, zoom with the slider, reset per panel.
- **Bold caption lettering** — big condensed heavy capitals with a thick outline and drop shadow, an editable main caption plus a smaller sub-caption line, five colours, and bottom-band or top-banner placement.
- **Vice City colour grade** — warm orange-pink-purple sunset, neon cyan-magenta, duotone, or raw, plus a vignette and a film-grain toggle.
- **Export sizes** — 1080 &times; 1080, 1080 &times; 1350 and 1920 &times; 1080, one click exports the current cover as a PNG at the exact pixels.
- **Offline** — static files only, no build step, no network requests; your photos never leave your machine.

Everything is original: no Rockstar Games logo, wordmark, artwork, character or font is used. Lettering uses system font stacks only.

## Run

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Screenshots

Deterministic scenes via `?shot=`:

| Scene | What it shows |
| --- | --- |
| `?shot=cover` | Exported wide cover, pier sample, "Sunset Heist" |
| `?shot=editor` | Editor with the boulevard sample, 2-panel layout |
| `?shot=cover2` | Exported portrait cover, boulevard sample, "Boulevard Queen" |
| `?shot=editor2` | Editor in the 3-panel comic strip layout |

## Enter make.fun

https://make.fun/r/a2v1dcqy
