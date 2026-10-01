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

### Stage D — Preloader + WebGL layer (heat-haze, RGB-shift)
- Preloader (`lib/preloader.ts`): symbol clip-path reveal, 00→39 mono counter, logotype wdth/wght morph via SplitText, torn-paper exit into hero; session-gated (`sessionStorage`), reduced-motion gets a plain fade, budget caps at 1.5s mobile / 2.2s desktop per TZ §3.1. Hero's intro animation now waits on `onPreloaderComplete()` instead of racing it.
- Hero heat-haze (`lib/webgl-heat-haze.ts`): OGL full-screen shimmer shader (domain-warped value noise, warm vertical gradient) + GPU-driven rising sparks (`gl.POINTS`, additive blend), both intensifying near the cursor. Paused via IntersectionObserver/`visibilitychange`.
- Recognition RGB-shift (`lib/webgl-rgb-shift.ts`): one-shot channel-split reveal on each triptych photo's first viewport entry, texture-sampled from the existing `<img>` with cover-crop UV math; tears its own GL context down on completion. Also fixed a spec gap: the triptych photos had no hover-to-color transition at all (TZ §08), only hover-zoom.
- Both WebGL layers share `lib/webgl-gate.ts` (`shouldUseWebGL()`: off under reduced-motion, mobile viewport, low-power hardware (`hardwareConcurrency < 4` / `deviceMemory < 4`), or no WebGL support) and defer past `window load` via `afterLoad()`; dynamically imported so OGL never sits on the critical path (confirmed as separate chunks in the build output — ~5–7kB gzip each). Gated-off cases fall back to a prebuilt CSS variant (hero ember wash + CSS sparks; Recognition's plain photo + CSS hover-color).
- Shader flame colors read from `tokens.css` at runtime (`color-tokens.ts: tokenColorRGB()`) instead of duplicating hex values — caught by `/impeccable audit`'s theming check.
- `impeccable detect`: 0 findings. `tsc --noEmit` / `npm run build` clean.

### Stage E — Mobile adaptation + Lighthouse
- **Live section mobile bug**: the horizontal pinned carousel ran unconditionally on every viewport (TZ §8 calls for a vertical swipe-slider on mobile instead), hijacking page scroll on touch and using a stale `CARD_WIDTH` constant that no longer matched the CSS mobile card width. Replaced with `mountVerticalSwipe()`: a native vertical scroll-snap stack on mobile, no pin, timeline/ticks synced via IntersectionObserver.
- Verified **empirically**, not just by static review: no browser devtools in this environment, so wrote a minimal CDP driver script (`node` + native `WebSocket`, since no Playwright/Puppeteer is installed) against headless Chrome — confirmed zero horizontal page overflow at 375/390/430/768px, both at page-top and scrolled into Live, and captured screenshots confirming the swipe deck and About section render correctly at 390px.
- Custom-cursor/tilt touch-gating (`isTouchDevice()`) and `prefers-reduced-motion` coverage were audited across every section — already solid from prior stages, no changes needed there.
- **Lighthouse** (local `vite preview` build, headless Chrome): mobile performance **69 → 87**, desktop **95**. Root cause: `<video poster>` is a plain image attribute, not covered by `preload="none"` — four below-the-fold videos (Live's intro + 3 local cards, About's pill clip) were downloading ~1.2MB of poster JPGs immediately on parse, competing with the hero's own LCP image over HTTP/1.1's limited connection pool. Fixed via `lib/lazy-poster.ts` (IntersectionObserver-deferred `poster`). LCP 4.2s → 2.7s, Speed Index 9.1s → 5.8s, TTI 15.0s → 9.8s.
- Accessibility **90 → 95**: GSAP SplitText's default `aria:"auto"` mode puts an `aria-label` on the split container to compensate for hiding its generated spans, but lands it on elements with no `role` to carry one (hero wordmark, About paragraphs, Contact heading, preloader logo) — set `aria: 'none'` on all four (text stays readable without it). Fixed label/visible-text mismatches (WCAG 2.5.3) on Line-up/Live cards (visually-hidden prefix instead of a non-matching `aria-label`) and the header logo link (`"39 KINGDOM"` vs visible `"39KINGDOM"`).
- One remaining Lighthouse `color-contrast` finding (About's burn-in paragraph text, ~0.2 opacity at rest) is a **known false positive**: axe snapshots the pre-scroll DOM state of a scroll-scrubbed reveal TZ §02 explicitly specifies ("слова из `--c-ash` 20% → `--c-bone` 100% по мере прокрутки"). Not weakening the effect to satisfy a static snapshot — flagged for the client per CLAUDE.md's skill-conflict rule instead.
- `impeccable detect`: 0 findings. `tsc --noEmit` / `npm run build` clean.
