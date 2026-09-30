# Build progress — autonomous session

Running log, one entry per completed stage. See `DECISIONS.md` for reasoning behind judgment calls made along the way.

## Prior sessions (context)
- Step 1: Vite+TS scaffold, tokens, GitHub Pages deploy, `/impeccable init` → `PRODUCT.md`.
- Step 2: Media pipeline (ffmpeg video, sharp images → `public/img`, `public/video`), `content.json` assembled from `03_CONTENT.md`.
- Step 3 + Hero: grid, header, menu, cursor, grain, scroll-progress, reusable buttons, Hero section.
- Sections 02–03: About Us, Performance Highlights.
- Sections 04–06: Line-up, On Tour, Live.

## This session

### Stage A — Highlights title-overlap bug + critical site-wide asset-path bug
- Fixed: `.highlights__title` used the page-wide `--fs-h1` token inside the narrow sticky column (~320–530px at ≥1280px), overflowing "PERFORMANCE HIGHLIGHTS" into the venue list. Column-scoped `clamp()` + `overflow-wrap: anywhere` + `min-width: 0` on both grid items. Checked 01–06 for the same class of bug (full-width heading token used inside a narrower column) — Highlights was the only instance.
- Found while checking: every section built so far (Hero through Live) referenced images/video with hardcoded root-relative paths (`/img/...`, `/video/...`), but the site deploys at `base: '/39Kingdom/'`. Confirmed via the dev server that `/img/...` 404s while `/39Kingdom/img/...` 200s — every media asset on the live site was broken. Added `lib/asset-url.ts` (`assetUrl()`, passes external URLs through unchanged) and applied it at every path call site across hero/about/highlights/lineup/tour/live/menu.ts.
- `impeccable detect` clean, `tsc --noEmit` clean, `npm run build` clean.

### Stage B + C — Music, Global Recognition, Social, Contact, Footer
Built together in one pass (not staged separately): `main.ts` wires all five in a single edit, so splitting the commit would mean re-touching the same lines twice for no real benefit — noting this as a deliberate deviation from strict per-stage commits, logged per the autonomy instruction.
- Music (theme-bone light section): circular clip-path reveal on scroll-in, two-tone headline with portrait pill, labels marquee (4 recolored logos + text), streaming buttons as real `href="#" data-todo="link"` per TZ §6, two fact cards with a vinyl-hover reveal, one counter (1.5M+) animated.
- Global Recognition: 27 names split across 3 marquee rows (different speed/direction each), hover pauses that row, lights the name ember, and — for the 6 names with a matching press photo — pops a cursor-tracked preview that settles from B&W to color. Triptych of the 3 curated B&W photos.
- Social: handle/followers/links, 4-column masonry gallery with per-column parallax (alternating direction), clip-path reveal on scroll, ember-duotone→true-color on hover. Alt text derived from each image's own descriptive slug instead of one repeated generic string.
- Contact: heat-gradient text mask on "THANK YOU", email click-to-copy (+ toast, + mailto fallback) via a new component, a magnetic BOOK orb that chases the cursor anywhere in the section (not just on its own hover — required excluding it from the generic magnetic-button hover handler, which would otherwise fight the section-wide tracker).
- Footer: logo, social links, streaming links (duplicated per 03_CONTENT.md's own instruction), Fenyx Artists contact line, copyright.
- **Press Release / Press Kit downloads**: source files existed locally but were never converted. No LibreOffice, Python, or pandoc available in this environment; used `mammoth` (docx→HTML, pure JS) + headless Edge's `--print-to-pdf` (Edge ships with Windows) to convert `PRESS RELEASE 2026.docx` → a clean 2-page PDF. The 16.4MB `Press Kit 2026.pdf` could not be recompressed (no ghostscript/poppler; `pdf-lib`'s lossless object-stream pass only reached 99.5% of original size, since the size is dominated by already-compressed embedded images pdf-lib can't re-encode) — shipped as-is; it's well under GitHub's 100MB limit and fully functional. Both now live in `public/downloads/` and are wired into `content.json`.
- `impeccable detect` clean across all new files, `tsc --noEmit` clean, `npm run build` clean.
