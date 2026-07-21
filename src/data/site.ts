// -----------------------------------------------------------------------------
// Site identity.
// -----------------------------------------------------------------------------

export const site = {
  name: "Hemant Banke",
  handle: "hemant", // used in the terminal prompt: you@portfolio:~$
  role: "Researcher · Quant · Engineer · Gardener of thoughts",
  tagline:
    "I build durable systems, work on exciting ideas and grow a public notebook of what I learn along the way.",
  // Tfiglet/importable-fonts (e.g. "ANSI Shadow", "Slant", "Standard", "Small Slant").
  bannerFont: "ANSI Shadow" as const,
  // Short text under the wordmark that "types" out on load.
  typedLines: [
    "initializing portfolio…",
    "mounting /digital-garden vault…",
    "ready.",
  ],
  email: "hemantbanke5@gmail.com",
};

export type Site = typeof site;
