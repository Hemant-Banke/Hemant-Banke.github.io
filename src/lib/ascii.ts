import figlet from "figlet";
// Font data is a plain string module; imported once and registered lazily.
import ansiShadow from "figlet/importable-fonts/ANSI Shadow.js";
import slant from "figlet/importable-fonts/Slant.js";
import standard from "figlet/importable-fonts/Standard.js";
import smallSlant from "figlet/importable-fonts/Small Slant.js";

const FONTS: Record<string, string> = {
  "ANSI Shadow": ansiShadow as unknown as string,
  Slant: slant as unknown as string,
  Standard: standard as unknown as string,
  "Small Slant": smallSlant as unknown as string,
};

const registered = new Set<string>();

/** Render text as an ASCII banner. Falls back to the raw text on any failure. */
export function banner(text: string, font = "ANSI Shadow"): string {
  const data = FONTS[font] ?? FONTS["Standard"];
  const name = FONTS[font] ? font : "Standard";
  try {
    if (!registered.has(name)) {
      figlet.parseFont(name, data);
      registered.add(name);
    }
    return figlet.textSync(text, { font: name as figlet.Fonts }).replace(/\s+$/g, "");
  } catch {
    return text;
  }
}

/** Longest visible line width — handy for centering / sizing ascii blocks. */
export function widestLine(block: string): number {
  return block.split("\n").reduce((w, l) => Math.max(w, l.length), 0);
}

/** Deterministic small hash → used for stable pseudo-random layout seeds. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
