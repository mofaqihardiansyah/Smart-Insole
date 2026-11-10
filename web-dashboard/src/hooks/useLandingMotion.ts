import { useEffect, useRef, useState } from "react";

/**
 * The landing's three motion effects, out of the page component.
 *
 * They were four `useEffect` blocks interleaved with the markup, which made the
 * page hard to read and impossible to test apart. They stay together here
 * because they share one rule: the visitor's reduced-motion preference decides
 * whether any of them run at all.
 *
 *   1. scroll reveal — one IntersectionObserver, reveal once, unobserve;
 *   2. drifting headline tiles — one rAF loop, cancelled on unmount;
 *   3. the nav's attached/floating state — a scroll listener that sets state,
 *      which is a state change rather than a transition of its own.
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const useLandingMotion = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [navFloating, setNavFloating] = useState(false);

  /* Scroll reveal: under reduced motion everything is visible immediately,
     and a browser without IntersectionObserver gets the same treatment rather
     than an invisible page. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = root.querySelectorAll("[data-reveal]");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reducedMotion]);

  /* Drifting tiles: one rAF loop for all of them, skipped entirely when the
     visitor asked for reduced motion. */
  useEffect(() => {
    if (reducedMotion) return undefined;
    const tiles = rootRef.current?.querySelectorAll<HTMLElement>("[data-drift]");
    if (!tiles || tiles.length === 0) return undefined;
    const bases = Array.from(tiles).map((el) =>
      parseFloat(el.dataset.rot || "0")
    );
    let raf: number;
    let t = 0;
    const loop = () => {
      t += 0.008;
      tiles.forEach((el, i) => {
        el.style.transform = `translateY(${Math.sin(t + i * 2) * 6}px) rotate(${
          bases[i] + Math.sin(t * 0.7 + i) * 2
        }deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  /* The nav sits flush on the page edge at the top and lifts into a floating
     bar once the page scrolls. */
  useEffect(() => {
    const onScroll = () => setNavFloating(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { rootRef, reducedMotion, navFloating };
};
