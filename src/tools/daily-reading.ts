// Tool: asktian_daily_reading
import { readingFor } from "../lib/reading.js";
import { parseISODate } from "../lib/date.js";

export const dailyReadingTool = {
  name: "asktian_daily_reading",
  description:
    "Get today's personalized Chinese metaphysics (八字 bazi + 干支 daily energy) reading " +
    "for a person. Returns their archetype (one of 8 trigrams 八卦), today's energy, " +
    "favorable colors/direction/hours, headline advice, and any caution. Use this when " +
    "the user asks how today will be for them, what colors to wear, where to face their " +
    "desk, or for general daily guidance.",
  inputSchema: {
    type: "object" as const,
    properties: {
      birthdate: {
        type: "string",
        description: "ISO date YYYY-MM-DD (Gregorian calendar).",
      },
      birth_hour: {
        type: "string",
        description: "Optional 24h time HH:MM. If unknown, omit (defaults to noon).",
      },
      gender: {
        type: "string",
        enum: ["male", "female", "any"],
        description: "Optional. Some metaphysics traditions weigh gender; pass 'any' if unsure.",
      },
    },
    required: ["birthdate"],
  },
};

export function callDailyReading(args: {
  birthdate: string;
  birth_hour?: string;
  gender?: "male" | "female" | "any";
}) {
  parseISODate(args.birthdate, "birthdate"); // validates format + calendar validity
  const r = readingFor(args.birthdate, { gender: args.gender });
  return {
    archetype: {
      glyph: r.trigram.glyph,
      english: r.trigram.nameEn,
      chinese: r.trigram.nameZh,
      element: r.trigram.element,
    },
    today: {
      date: r.date,
      energy: r.dayEnergy.label,
      stem_branch: `${r.dayEnergy.stem}${r.dayEnergy.branch}`,
    },
    headline: r.headline,
    body: r.body,
    lucky: {
      colors: r.luckyColors,
      direction: r.luckyDirection,
      hours: r.luckyHours,
    },
    caution: r.caution,
  };
}
