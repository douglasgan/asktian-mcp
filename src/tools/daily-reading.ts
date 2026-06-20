// Tool: asktian_daily_reading
import { todayEnergy } from "../lib/reading.js";
import { parseISODate } from "../lib/date.js";
import { dailyReadingPreview } from "../lib/teaser.js";
import { fetchAlmanacDaily } from "../lib/api-client.js";

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

export async function callDailyReading(args: {
  birthdate: string;
  birth_hour?: string;
  gender?: "male" | "female" | "any";
}) {
  parseISODate(args.birthdate, "birthdate"); // validates format + calendar validity
  const today = new Date().toISOString().slice(0, 10);

  // Real daily almanac from the live backend (public, rate-limited).
  const a = await fetchAlmanacDaily(today);
  if (a) {
    return {
      for_birthdate: args.birthdate,
      today: {
        date: a.date ?? today,
        lunar_date: a.lunarDate,
        ganzhi: a.dayGanZhi,
        zodiac: a.dayZodiac,
        auspicious_day: a.isHuangDao,
      },
      do_today: a.auspiciousActivities,
      avoid_today: a.inauspiciousActivities,
      lucky_directions: { wealth: a.positionCai, joy: a.positionXi, blessing: a.positionFu },
      overall_fortune: a.overallFortune,
      score: a.score,
      note_for_ai:
        "Real daily almanac from api.asktian.com. Surface today's do/avoid activities, lucky " +
        "directions, and fortune. For a deeper birthdate-personalized bazi reading, the premium " +
        "tian.* tier (needs an API key) goes further.",
      source: "api.asktian.com",
    };
  }

  // Fallback: generic preview when the backend is unreachable.
  return dailyReadingPreview(todayEnergy(new Date()));
}
