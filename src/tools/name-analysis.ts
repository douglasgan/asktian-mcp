// Tool: asktian_name_analysis
// Energetic profile of a name (姓名学). Calls the live api.asktian.com analysis;
// falls back to a generic preview if the backend is unreachable.
import { nameAnalysisPreview } from "../lib/teaser.js";
import { fetchNameAnalysis } from "../lib/api-client.js";

/** Best-effort split of a free-form name into surname + given name. */
function splitName(name: string): { surname: string; givenName: string } {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return { surname: parts[0], givenName: parts.slice(1).join(" ") };
  if (name.length >= 2) return { surname: name.slice(0, 1), givenName: name.slice(1) };
  return { surname: name, givenName: name };
}

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

export async function callNameAnalysis(args: { name: string; language?: string }) {
  // Guard non-string / missing input — a number or undefined would crash on .trim()
  // with a cryptic TypeError instead of a clean validation error.
  const name = typeof args.name === "string" ? args.name.trim() : "";
  if (!name) throw new Error("name is required");

  const { surname, givenName } = splitName(name);
  const r = await fetchNameAnalysis(surname, givenName);
  if (r) {
    return {
      name: r.name ?? name,
      surname: r.surname,
      given_name: r.givenName,
      overall_score: r.overallScore ?? r.score,
      overall_fortune: r.overallFortune,
      summary: r.summary,
      five_formations: r.fiveFormations,
      source: "api.asktian.com",
    };
  }

  // Fallback: generic preview when the backend is unreachable.
  return nameAnalysisPreview(name);
}
