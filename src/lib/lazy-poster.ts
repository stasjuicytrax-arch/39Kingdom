/** Defers a `<video>`'s poster image fetch until it's near the viewport.
 * `preload="none"` (used throughout the site per TZ §8) stops the video
 * file itself from downloading early, but `poster` is a plain image
 * attribute and loads immediately regardless — on a page with several
 * below-the-fold videos that meant multiple ~300-400KB poster JPGs
 * competing with the hero's own LCP image on first paint. */
export function lazyPoster(video: HTMLVideoElement, src: string): void {
  if (!src) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        video.poster = src;
        io.disconnect();
      }
    },
    { rootMargin: '600px 0px' }
  );
  io.observe(video);
}
