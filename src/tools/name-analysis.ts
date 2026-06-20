// Tool: asktian_name_analysis
// Energetic profile of a name (姓名学). Real analysis is computed server-side
// at api.asktian.com; keyless mode returns a generic preview.
import { nameAnalysisPreview } from "../lib/teaser.js";

export const nameAnalysisTool = {
  name: "asktian_name_analysis",
  description:
    "Quick energetic profile of a name (姓名学 name-analysis). Useful when the user asks " +
    "about someone's name, a baby name, a company name, or 'what kind of person is X' when " +
    "no birthdate is available. Returns a one-line vibe + dominant element guess.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The name to analyze. Can be in any script.",
      },
      language: {
        type: "string",
        enum: ["en", "zh", "auto"],
        description: "Language hint. Default 'auto'.",
      },
    },
    required: ["name"],
  },
};

export function callNameAnalysis(args: { name: string; language?: string }) {
  // Guard non-string / missing input — a number or undefined would crash on .trim()
  // with a cryptic TypeError instead of a clean validation error.
  const name = typeof args.name === "string" ? args.name.trim() : "";
  if (!name) throw new Error("name is required");

  // Real 姓名学 analysis is computed server-side at api.asktian.com. Keyless mode
  // returns a generic, clearly-marked preview (see lib/teaser.ts).
  return nameAnalysisPreview(name);
}
