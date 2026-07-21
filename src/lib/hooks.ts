import { useEffect, useState } from "react";

/** True when the visitor prefers reduced motion; kept in sync live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Tracks whether the viewport is at/under `px` wide (default 720). */
export function useIsNarrow(px = 720): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia(`(max-width:${px}px)`).matches,
  );
  useEffect(() => {
    const mq = matchMedia(`(max-width:${px}px)`);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [px]);
  return narrow;
}
