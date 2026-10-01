# Decisions log — autonomous build

Spontaneous calls made while building, with reasoning, per CLAUDE.md's instruction to record and justify rather than silently pick. Newest first.

---

## 2026-10-01 — Venue count: shipped 35, not the "34" in TZ §10

**What:** Highlights/Performance section lists 35 venues across 13 countries; TZ §10's acceptance checklist says "34 площадки."

**Why:** `03_CONTENT.md`'s own itemized venue list — the actual source of truth per CLAUDE.md's content-priority rule — totals 35 when counted directly (Saudi 3 + UAE 4 + India 4 + Nepal 1 + Belarus 1 + Turkey 1 + Thailand 2 + Vietnam 5 + Philippines 2 + China 6 + Myanmar 1 + Malaysia 2 + Indonesia 3 = 35). The "34" appears only in that same file's own section heading ("Venues & festivals (34)"), which is a stale label, not a second, conflicting data source. `content.json` was already built from the itemized list, not the heading, so it's correct as shipped — flagging the mismatch for the client rather than silently dropping a real venue to match a miscounted label.

---

## 2026-10-01 — About's burn-in text contrast: left as-is, not "fixed"

**What:** Lighthouse/axe flags About's paragraph text as failing color-contrast (foreground ~`#211d1c` on `#070404` at rest, ratio 1.22). Not changed.

**Why:** This is the at-rest state of a scroll-scrubbed reveal TZ §02 explicitly specifies — "слова из `--c-ash` 20% → `--c-bone` 100% по мере прокрутки" — so low contrast before the paragraph scrolls into its trigger zone is the intended design, not a bug. axe/Lighthouse only sees a static snapshot and has no concept of scroll-linked animation. Per CLAUDE.md's rule for skill-vs-brief conflicts ("не переделывать молча, а сообщить заказчику"), this is flagged to the client rather than diluted to pass a static check.

---

## 2026-10-01 — Hero heat-haze renders as a decorative overlay, not literal photo/video refraction

**What:** The WebGL heat-haze layer (`lib/webgl-heat-haze.ts`) draws cursor-reactive flame-colored noise + rising sparks on a transparent canvas composited above the hero photo/video, rather than sampling and warping the actual hero pixels.

**Why:** True refraction would mean texturing from whichever of photo/video is currently visible and keeping that texture in sync frame-to-frame (video texture uploads are themselves a real cost) — expensive exactly where TZ §8 says to be conservative (weak devices/mobile fall back to CSS). An additive shimmer overlay reads as the same "heat over fire" effect, costs a lot less, and composites correctly over both the static photo and the video once it loads, without needing to know which is currently on top.

---

## 2026-10-01 — Live section: vertical swipe replaces the pin-scrub carousel on mobile, not just a resized version of it

**What:** TZ §8 ("Live на мобиле → вертикальный свайп-слайдер") is implemented as a full mode switch (`mountVerticalSwipe()`): native CSS scroll-snap, no `pin`/`scrub`, no page-scroll hijacking — not the desktop carousel with smaller cards.

**Why:** The desktop mechanic works by translating the track horizontally as the user scrolls the *page* vertically — on a touch device that means a vertical swipe gesture doesn't do what it looks like it should (swipe the cards), it scrolls the page, which then drives the carousel indirectly. That's the exact failure TZ is calling out. A plain resize wouldn't have fixed it; the interaction model itself had to change.

---

## 2026-09-30 — Highlights section layout: h1 title stays inside the sticky column, not full-bleed above it

**What:** Fixed the PERFORMANCE HIGHLIGHTS heading overlapping the venue list at ~960px by making its font-size respond to the sticky column's own width (via a column-relative clamp) instead of the page-wide `--fs-h1` token, and hardening the grid so the sticky column can never grow past its track.

**Why:** TZ §5.03 pins the title to the *left sticky column*, next to the counters — it's explicitly part of that column, not a full-width banner over both columns. The bug was `--fs-h1` (tuned for full-width headings like Hero/Tour) being reused inside a ~320–380px-wide column at tablet/small-desktop widths, where it doesn't fit. Keeping it column-scoped matches the brief's own layout intent; widening the heading above both columns would not.

---

## 2026-09-30 — Streaming buttons render as real outline buttons with `href="#"` + `data-todo="link"`

**What:** Spotify/Apple Music/Beatport/SoundCloud buttons in Music render fully styled, not disabled/greyed, pointing at `#` with a `data-todo="link"` marker.

**Why:** TZ §6 literally specifies this exact markup pattern ("href='#' data-todo='link'") for pending streaming links. Not a judgment call — just flagging where it's implemented in case the client wants it disabled instead.

---

## 2026-09-30 — Press Release / Press Kit PDF downloads

**What:** `PRESS RELEASE 2026.docx` → converted to PDF; `39 KINGDOM - Press Kit 2026.pdf` (16MB) → compressed for web download. Both placed in `site/public/downloads/` and wired into `content.json`'s `contact.downloads`.

**Why:** These aren't client-dependent — the source files already exist in the project folder (`BIO/LOGO - BIO/PRESS RELEASE 2026.docx`, `39 KINGDOM - Press Kit 2026.pdf`), TZ §6 explicitly calls for this exact conversion/compression, and leaving the Contact section's download buttons dead would ship a visibly broken feature. Distinguished from genuinely client-blocked items (streaming links, real tour data) which stay as `data-todo="link"` placeholders per the instruction above.
