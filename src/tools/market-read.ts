// Tool: asktian_market_read
//
// A Chinese-metaphysics "signal" on a binary prediction-market outcome, for AI
// trading agents (and the curious) to consult. The point isn't that bazi predicts
// markets — it's that this is a DETERMINISTIC, *uncorrelated* novelty signal: it
// doesn't read the same news/sentiment every LLM reads, and it's published
// transparently so the calls can be scored over time (a falsifiable experiment).
//
// ⚠️ ENTERTAINMENT / ritual only. NOT financial advice. Every response says so.

import { todayEnergy } from "../lib/reading.js";
import { trigramFromBirthdate, TRIGRAMS } from "../lib/trigrams.js";
import { parseISODate } from "../lib/date.js";

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
// 五行 relations
const FEEDS: Record<string, string> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };       // 生
const OVERCOMES: Record<string, string> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };   // 克

// Deterministic FNV-1a hash → a stable "element" + polarity for the question text.
function hashQuestion(s: string): { element: string; polarity: number } {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return { element: ELEMENTS[h % 5], polarity: (h >>> 7) % 100 };
}

const clamp = (n: number) => Math.max(5, Math.min(95, Math.round(n)));

export const marketReadTool = {
  name: "asktian_market_read",
  description:
    "Get a Chinese-metaphysics signal on a binary prediction-market question (Polymarket/Kalshi " +
    "style yes/no outcomes). Use when a user — or a trading agent — wants an UNCORRELATED, " +
    "for-fun read on a market: 'will X happen by date Y'. Returns a lean (yes/no/neutral), a " +
    "confidence, the 五行 reasoning from the resolution date's energy, and a mandatory disclaimer. " +
    "This is ENTERTAINMENT and a falsifiable ritual — NOT financial advice. Always present it as " +
    "a novelty signal, never as a recommendation to place a bet.",
  inputSchema: {
    type: "object" as const,
    properties: {
      question: {
        type: "string",
        description: "The binary market question, e.g. 'Will BTC be above $100k by 2026-12-31?'",
      },
      resolve_date: {
        type: "string",
        description: "Optional ISO YYYY-MM-DD when the market resolves. Defaults to today.",
      },
      subject_birthdate: {
        type: "string",
        description:
          "Optional ISO YYYY-MM-DD. If the market is about a specific person (e.g. 'will X win'), " +
          "their birthdate adds their bazi element to the read.",
      },
    },
    required: ["question"],
  },
};

export function callMarketRead(args: {
  question: string;
  resolve_date?: string;
  subject_birthdate?: string;
}) {
  if (typeof args.question !== "string" || !args.question.trim()) {
    throw new Error("question is required");
  }
  const question = args.question.trim();
  const resolveDate = args.resolve_date ? parseISODate(args.resolve_date, "resolve_date") : new Date();
  const day = todayEnergy(resolveDate);
  const dayEl = day.stemElement;
  const { element: qEl, polarity } = hashQuestion(question);

  // 五行 relation between the resolution day's energy and the question's element.
  let score = 50;
  const reasons: string[] = [];
  if (dayEl === qEl) {
    score += 18;
    reasons.push(`the resolution day is a ${dayEl} day and the question carries ${qEl} energy — the element doubles, amplifying whatever is already in motion`);
  } else if (FEEDS[dayEl] === qEl) {
    score += 22;
    reasons.push(`${dayEl} (the resolution day) generates ${qEl} (生) — the day's energy nourishes this outcome`);
  } else if (OVERCOMES[dayEl] === qEl) {
    score -= 22;
    reasons.push(`${dayEl} overcomes ${qEl} (克) — the resolution day works against this outcome`);
  } else if (FEEDS[qEl] === dayEl) {
    score -= 10;
    reasons.push(`${qEl} drains into ${dayEl} — the outcome spends energy to reach the day, a mild headwind`);
  } else {
    score += 4;
    reasons.push(`${qEl} and ${dayEl} neither generate nor overcome each other — a neutral field`);
  }

  // Optional subject bazi
  if (args.subject_birthdate) {
    const subjEl = TRIGRAMS[trigramFromBirthdate(parseISODate(args.subject_birthdate, "subject_birthdate").toISOString().slice(0, 10))].element;
    if (FEEDS[dayEl] === subjEl) { score += 10; reasons.push(`the day's ${dayEl} feeds the subject's ${subjEl} — favorable for them`); }
    else if (OVERCOMES[dayEl] === subjEl) { score -= 10; reasons.push(`the day's ${dayEl} overcomes the subject's ${subjEl} — pressure on them`); }
    else { reasons.push(`the subject's ${subjEl} sits in balance with the day`); }
  }

  // Deterministic polarity nudge so identical-element questions aren't all the same number.
  score += (polarity - 50) * 0.12;
  score = clamp(score);

  const lean = score >= 60 ? "yes" : score <= 40 ? "no" : "neutral";
  const confidence = Math.abs(score - 50) >= 25 ? "notable" : Math.abs(score - 50) >= 12 ? "slight" : "faint";

  return {
    question,
    resolve_date: day.date,
    signal: {
      lean,            // "yes" | "no" | "neutral"
      score,           // 5–95, where >50 leans YES
      confidence,      // faint | slight | notable
    },
    reasoning: reasons.join("; ") + ".",
    resolution_day_energy: { label: day.label, stem: day.stem, branch: day.branch, element: dayEl },
    disclaimer:
      "Entertainment / ritual only — NOT financial advice. A deterministic metaphysics novelty " +
      "signal (uncorrelated with news/sentiment), published so it can be scored over time. " +
      "Do not place bets based on this.",
    note_for_ai:
      "Present this as a FUN, uncorrelated novelty read — never as a recommendation to trade or bet. " +
      "Always surface the disclaimer. If the user seems to be making a real financial decision, remind " +
      "them this is entertainment and they should not rely on it.",
  };
}
