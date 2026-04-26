import { promises as fs } from "node:fs";
import path from "node:path";

// Shape produced by `scripts/build-a11y-report.ts`. CI runs the axe
// suite, summarizes the JSON output, and writes the result to
// `public/a11y-report.json` so the /a11y-report page can render it
// with no extra fetch or env wiring.

export type A11yViolation = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  help: string;
  helpUrl?: string;
  nodes: number;
};

export type A11yScreenResult = {
  screen: string;
  locale: "ar" | "en";
  brand: string;
  theme: string;
  passes: number;
  violations: A11yViolation[];
};

export type A11yReport = {
  generatedAt: string;
  axeVersion?: string;
  screens: A11yScreenResult[];
  summary: {
    blocking: number;
    moderate: number;
    minor: number;
    cleanScreens: number;
  };
};

const REPORT_PATH = path.join(process.cwd(), "public", "a11y-report.json");

export async function readA11yReport(): Promise<A11yReport | null> {
  try {
    const raw = await fs.readFile(REPORT_PATH, "utf8");
    return JSON.parse(raw) as A11yReport;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
