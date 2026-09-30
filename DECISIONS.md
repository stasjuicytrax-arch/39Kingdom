# Decisions log — autonomous build

Spontaneous calls made while building, with reasoning, per CLAUDE.md's instruction to record and justify rather than silently pick. Newest first.

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
