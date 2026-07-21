import type { Manifest } from "../src/content/types";

export declare const GROUP_COLORS: string[];
export declare function buildManifest(gardenDir: string): Promise<Manifest>;
export declare function writeManifest(
  gardenDir: string,
  outFile: string,
): Promise<Manifest>;
