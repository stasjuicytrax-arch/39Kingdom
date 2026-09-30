# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Booking agencies and promoters (international) evaluating 39 KINGDOM for festival and club bookings. They often review the link on mobile, inside a messaging app (WhatsApp/Telegram), in a short session — not at a desk.

## Product Purpose

A one-page electronic press kit (EPK) website that replaces a static Photoshop/Canva PDF. It must convince a booker within the first 3 seconds/60 seconds that the act performs at headliner level — scale, live show quality, name recognition — and let them act in one click: **contact · watch a set · download the media kit**.

## Positioning

39 KINGDOM is a hybrid electronic live duo: DJ sets combined with real-time musicianship (live vocals, guitar, drums), not a DJ-only act. Evidence a booker can verify directly: 500+ shows across 20+ countries, shared bills with David Guetta, Tiësto, Martin Garrix, Calvin Harris and 20+ other headline names, releases on labels tied to Armin van Buuren, Hardwell, R3HAB, Andrew Rayel.

## Operating Context

- Single scrolling page, no server, hosted on GitHub Pages (`https://stasjuicytrax-arch.github.io/39Kingdom/`, later a custom domain).
- Shared as a raw link in booking conversations and messaging apps — link-preview quality (OG image) and mobile load speed matter as much as desktop.
- Site language is English only (international audience); internal team communication about the project is in Russian (see project CLAUDE.md), which does not affect site copy.
- Content is sourced only from `_BRIEF/03_CONTENT.md` (itself derived from `39 KINGDOM - Press Kit 2026.pdf` and `PRESS RELEASE 2026.docx`, with PDF typos corrected) — nothing on the page may be invented.
- Streaming links (Spotify/Apple Music/Beatport/SoundCloud) are intentionally empty placeholders (`content.json`) until the client supplies them.
- Tour dates shown are a demonstration set (`Tour Date.jpg` as data source only, not used as an image); the real tour will be swapped in later via `content.json` without re-editing markup.

## Capabilities and Constraints

- Stack already decided and scaffolded: Vite + vanilla TypeScript, GSAP (ScrollTrigger/SplitText/Flip), Lenis smooth scroll, OGL for WebGL (heat-haze shader, particles), self-hosted variable Archivo (`wdth` axis) + JetBrains Mono via `@fontsource`.
- Deploy: GitHub Actions → `actions/deploy-pages`; every push to `main` updates the live preview in ~1–2 min. GitHub's 100MB file limit means raw video/photo sources never enter the repo — only compressed `public/` output (images via `sharp` → AVIF/WebP/JPG; video via `ffmpeg` → web-sized MP4/WebM + posters).
- Performance targets: LCP ≤ 2.5s on 4G, CLS ≈ 0, Lighthouse ≥ 85 mobile / ≥ 95 desktop. Video `preload="none"`, autoplay only in viewport (IntersectionObserver). YouTube via lite-embed only.
- Mobile-first, checked at 375/390/430/768/1280/1440/1920px. `prefers-reduced-motion` turns scroll scenes into simple fades, disables shaders/particles/video autoplay.
- Custom cursor, WebGL, and tilt effects are disabled on touch devices.
- The site is dark by design with exactly one light "day" section (Music) — this is a deliberate rhythm choice from the design system (night → day → night), not an oversight; do not "fix" it toward a conventional light theme.
- A 124 BPM pulse (`--beat: 484ms`) is applied only to 1–2 elements (the ✱ asterisk, the red orb) as a genre-specific motion signature — intentionally not applied site-wide.
- Open/undecided: 2 of 4 streaming links and the real tour schedule are pending from the client; the identity of the duo's members is deliberately not shown on the site (per open questions in `03_CONTENT.md`).

## Brand Commitments

- Name/wordmark: **39KINGDOM** (geometric logotype with an inverted "D"); symbol mark `39KNGD Symbol` used for preloader, favicon, cursor accents.
- Design system is fixed and documented: "EMBER KINGDOM" (`_BRIEF/01_DESIGN_SYSTEM.md`), tokens sourced from `_BRIEF/02_tokens.css` (already wired into the codebase as `src/styles/tokens.css`) — palette (void/oxblood/blood/ember/fire/bone), Archivo-only type system, 4px spacing scale, named easings/durations.
- Explicit anti-patterns from the brief: no Inter/Roboto/Poppins/Montserrat, no violet-blue "AI gradient" or site-wide glassmorphism (glass reserved for stat cards only), no icon+headline+2-lines-text triple-column cards, no emoji or "lightbulb" icons, no bounce/spring easing, at most one large red accent per screen.
- Voice: confident, short, factual — no "We are passionate about…" marketing filler.
- Photo credit obligation: any Show Pics credited `@mapurohit` in the filename must carry a visible `PHOTO: @MAPUROHIT` caption on the site.

## Evidence on Hand

All under the project root (sibling to `site/`, not committed to the repo — raw sources stay local):
- `Hero.jpg` — hero scene (fire/pyro, containers), 4000×2667.
- `Video/` — 3 source clips (`India.MOV`, `Sunburn camp, India _004.mov`, `Void Bangkok.mov`), all 3 must appear on the site.
- `PRESS PICS/`, `SHOW PICS/` — press portraits and 65+ live/show photos, including "with [artist]" photos for Global Recognition.
- `BIO/LOGO - BIO/` — vector logo source (`.ai`), white/black PNG logos, symbol marks, press release `.docx`.
- `PDF ASSETS/` — extracted posters (9), label logos (4), PDF-sourced photos.
- `39 KINGDOM - Press Kit 2026.pdf` — full press kit, compressed copy offered as a download.
- `_BRIEF/03_CONTENT.md` — canonical, pre-corrected text for every section (about copy, 34 venues, 7 tour dates, 9 posters, 13 labels, 27 names, 4 YouTube sets, social stats).
- No testimonials, case studies, or pricing exist or should be fabricated; the two "highlight" facts (1.5M+ streams t.A.T.u. cover, Top 10 Vietnam with Phùng Khánh Linh) are the only performance-metric claims on hand.

## Product Principles

1. **Numbers over adjectives.** Every claim of scale (500+ shows, 20+ countries, 100K+ followers, streaming counts) is a sourced fact from the press kit, never a rounded-up guess — these are what a booker actually checks.
2. **Speed is a booking feature.** A booker on mobile in a chat thread will not wait; LCP, video autoplay discipline, and lite-embeds are conversion requirements, not nice-to-haves.
3. **One page, one path to yes.** Every section should visibly serve "contact · watch · download" — nothing decorative that doesn't build toward those three actions.
4. **The fire is dosed, not constant.** Darkness is the canvas; red/ember accents and the one light section exist to be noticed because they're rare, per the design system's own rule of one bright accent per screen.
5. **Content is a translation, not an invention.** English copy, figures, dates, and credits trace back to `03_CONTENT.md`; nothing is phrased or quantified beyond what that file states.

## Accessibility & Inclusion

`prefers-reduced-motion: reduce` is a required, tested state (not just a media-query stub): scroll-driven scenes fall back to plain fades, shaders/particles turn off, video does not autoplay. Custom cursor and 3D tilt are touch-disabled rather than degraded. No other accessibility standard (e.g. WCAG level) was specified by the client; treat mobile readability and reduced-motion support as the binding requirements until told otherwise.
