// Tool: asktian_compatibility
import { computeCompatibility, type CompatDimension } from "../lib/compat.js";
import { fetchBirthdayCompat } from "../lib/api-client.js";
import { parseISODate } from "../lib/date.js";

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

  const local = computeCompatibility(
    args.person_a_birthdate,
    args.person_b_birthdate,
    args.dimension ?? "general",
  );

  // Try the real API for the numeric score; keep local empathy formatting.
  const api = await fetchBirthdayCompat(
    args.person_a_birthdate,
    args.person_b_birthdate,
  );
  if (api && typeof api.score === "number") {
    const apiScore = Math.max(0, Math.min(100, api.score));
    local.score = apiScore;
    local.display.showNumeric = apiScore >= 60;
    local.display.level = apiScore >= 80 ? "good" : apiScore >= 60 ? "moderate" : "soft";
  }

  return {
    compatibility: {
      // Per asktian dev principle: qualitative label is the headline,
      // numeric is metadata that the AI agent can choose whether to surface.
      qualitative_label: local.qualitativeLabel,
      category: local.category,
      element_flow: local.elementFlow.join(" "),
      description: local.description,
      // The score is exposed but the agent should respect should_show_score.
      score: local.score,
      should_show_score: local.display.showNumeric,
      level: local.display.level,
    },
    today_advice: local.todayAdvice,
    trigrams: local.trigrams,
    note_for_ai: local.display.showNumeric
      ? "Safe to mention the score."
      : "Score is < 60; do NOT mention the number. Use the qualitative label only. asktian's design principles avoid making low-compat feel like rejection.",
    source: api ? "api.asktian.com" : "local",
  };
}
