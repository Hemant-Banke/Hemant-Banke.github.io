import type { Layouts, Manifest } from "../src/content/types";

export declare const GROUP_COLORS: string[];
export declare const MANIFEST_FILE: string;
export declare const LAYOUTS_FILE: string;
export declare function buildManifest(gardenDir: string): Promise<Manifest>;
export declare function writeContent(
  gardenDir: string,
  outDir: string,
): Promise<{ manifest: Manifest; layouts: Layouts }>;
