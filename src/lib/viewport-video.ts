/** Plays a muted video only while it's in the viewport, pauses outside it.
 * Never autoplays under prefers-reduced-motion — the poster frame stands in. */
export function autoplayInViewport(video: HTMLVideoElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.25 }
  );
  observer.observe(video);
}
