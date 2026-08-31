import { type ComponentType, useEffect, useState } from "react";
import Morphogenesis from "../components/Morphogenesis";
import ParticleLife from "../components/ParticleLife";

// Registry of the hero's background simulations. To add one: write the
// component (a canvas that fills its parent and pauses itself off-screen — see
// whileVisible in lib/hooks) and add an entry to SIMS. The hero and the
// floating dock both read this list, so nothing else needs touching.

export interface SimDef {
  key: string;
  label: string;
  blurb: string;
  Component: ComponentType;
}

export const SIMS: SimDef[] = [
  {
    key: "particle-life",
    label: "particle life",
    blurb: "species attraction matrix · emergent colonies",
    Component: ParticleLife,
  },
  {
    key: "morphogenesis",
    label: "morphogenesis",
    blurb: "seed · growth · pattern · regrowth",
    Component: Morphogenesis,
  },
];

const STORAGE_KEY = "hero-sim";

export function getSim(): SimDef {
  try {
    const saved = SIMS.find((s) => s.key === localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // storage blocked (private browsing) — fall through to the default
  }
  return SIMS[0];
}

/** Persists the choice and notifies listeners (the hero swaps canvases). */
export function setSim(key: string) {
  const sim = SIMS.find((s) => s.key === key) ?? SIMS[0];
  try {
    localStorage.setItem(STORAGE_KEY, sim.key);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent<SimDef>("simchange", { detail: sim }));
}

/** The active simulation, kept in sync across the dock and the hero. */
export function useActiveSim(): SimDef {
  const [sim, setState] = useState<SimDef>(getSim);
  useEffect(() => {
    const on = (e: Event) => setState((e as CustomEvent<SimDef>).detail);
    window.addEventListener("simchange", on);
    return () => window.removeEventListener("simchange", on);
  }, []);
  return sim;
}
