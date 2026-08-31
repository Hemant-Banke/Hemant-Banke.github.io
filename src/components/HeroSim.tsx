import { useActiveSim } from "../lib/sims";

// The hero's right-hand panel. Which simulation runs is chosen in the floating
// dock (FloatingDock) and stored in lib/sims.
export default function HeroSim() {
  const sim = useActiveSim();
  const { Component } = sim;

  // Keyed so switching unmounts the old canvas and its rAF loop.
  return (
    <div className="sim-stage" aria-hidden="true" key={sim.key}>
      <Component />
    </div>
  );
}
