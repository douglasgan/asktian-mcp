// Tool: asktian_compatibility
import { fetchCompatBirthday } from "../lib/api-client.js";
import { parseISODate } from "../lib/date.js";
import { compatibilityPreview, previewNote } from "../lib/teaser.js";

type CompatDimension = "love" | "career" | "friend" | "general";

export const compatibilityTool = {
  name: "asktian_compatibility",
  description:
    "Compute fate compatibility between two people via Chinese metaphysics (八字 pairing, " +
    "5-element generation/clash). Returns qualitative label first (e.g. '互补型 Complementary'), " +
    "then a numeric score (hidden if <60 to avoid making low-compat feel like rejection — " +
    "this is intentional per the asktian design principles). Useful when user asks about " +
    "compatibility, fit, or 'will this person and I work'.",
  inputSchema: {
    type: "object" as const,
    properties: {
      person_a_birthdate: {
        type: "string",
        description: "ISO YYYY-MM-DD birthdate of the first person.",
      },
      person_b_birthdate: {
        type: "string",
        description: "ISO YYYY-MM-DD birthdate of the second person.",
      },
      dimension: {
        type: "string",
        enum: ["love", "career", "friend", "general"],
        description: "Which dimension to weight. Default 'general'.",
      },
    },
    required: ["person_a_birthdate", "person_b_birthdate"],
  },
};

export async function callCompatibility(args: {
  person_a_birthdate: string;
  person_b_birthdate: string;
  dimension?: CompatDimension;
}) {
  for (const d of [args.person_a_birthdate, args.person_b_birthdate]) {
    parseISODate(d, "birthdates"); // validates format + calendar validity
  }

  // The real pairing is computed server-side at api.asktian.com (returns the score).
  // The element-flow interpretation lives behind the API too; keyless mode returns a
  // generic, clearly-marked preview.
  const api = await fetchCompatBirthday(
    args.person_a_birthdate,
    args.person_b_birthdate,
  );

  if (api && typeof api.score === "number") {
    const score = Math.max(0, Math.min(100, api.score));
    const showNumeric = score >= 60;
    const level = score >= 80 ? "good" : score >= 60 ? "moderate" : "soft";
    const label = score >= 80 ? "Strong match" : score >= 60 ? "Workable match" : "Tender — needs care";
    return {
      compatibility: {
        qualitative_label: label,
        score,
        romance_score: api.romanceScore,
        friendship_score: api.friendshipScore,
        marriage_score: api.marriageScore,
        should_show_score: showNumeric,
        level,
        description: api.astroDescription,
        dimensions: api.dimensions,
      },
      source: "api.asktian.com",
      note_for_ai: showNumeric
        ? "Real scores from api.asktian.com. Safe to mention the score."
        : "Score is < 60 — do NOT mention the number; use the qualitative label only. asktian's design principles avoid making low-compat feel like rejection.",
    };
  }

  const preview = compatibilityPreview();
  return {
    sample: true,
    compatibility: {
      qualitative_label: preview.qualitative_label,
      description: preview.description,
      score: null,
      should_show_score: false,
    },
    source: "preview",
    note_for_ai: previewNote("No real compatibility was computed."),
  };
}
