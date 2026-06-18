// Compatibility scoring for two people.
// Same logic as the consumer app, replicated for npm-package isolation.

import { TRIGRAMS, elementRelation, trigramFromBirthdate, type TrigramKey } from "./trigrams.js";
import { todayEnergy } from "./reading.js";

export type CompatDimension = "love" | "career" | "friend" | "general";

export interface CompatResult {
  score: number;                // 0-100
  qualitativeLabel: string;     // "母子相生" · "互补型" · "需要磨合"
  category: "soulmate" | "growth" | "complement" | "soft" | "moderate";
  elementFlow: string[];        // e.g. ["🔥","→","🌱","→","🌍"]
  description: string;          // 1-2 sentences
  display: {
    showNumeric: boolean;       // false when score < 60 (dev principle)
    level: "good" | "moderate" | "soft";
  };
  todayAdvice: string;          // specific to today
  trigrams: {
    a: { glyph: string; element: string; nameEn: string };
    b: { glyph: string; element: string; nameEn: string };
  };
}

function pseudoScore(d1: string, d2: string): number {
  let h = 5381;
  const seed = `${d1}::${d2}`;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return 55 + (h % 41); // 55-95 range
}

function pickLabel(rel: ReturnType<typeof elementRelation>, score: number): {
  label: string;
  category: CompatResult["category"];
} {
  if (rel === "generate") {
    if (score >= 80) return { label: "母子相生 / Generative", category: "growth" };
    return { label: "互相托起 / Mutual lift", category: "growth" };
  }
  if (rel === "complement") {
    if (score >= 80) return { label: "知己缘 / Soulmate", category: "soulmate" };
    if (score >= 60) return { label: "同频共振 / Resonant", category: "soulmate" };
    return { label: "同款慢热 / Slow burn", category: "soft" };
  }
  if (rel === "overcome") {
    if (score >= 70) return { label: "互补型 / Complementary tension", category: "complement" };
    return { label: "需要磨合 / Friction phase", category: "soft" };
  }
  if (score >= 80) return { label: "天作之合 / Fated", category: "soulmate" };
  if (score >= 60) return { label: "慢慢合拍 / Gradual sync", category: "moderate" };
  return { label: "节奏不同 / Different tempo", category: "soft" };
}

const ELEMENT_GLYPH: Record<string, string> = {
  earth: "🌍", water: "💧", metal: "⚪", wood: "🌱",
  fire: "🔥", thunder: "⚡", mountain: "⛰️",
};

function todayAdviceFor(
  rel: ReturnType<typeof elementRelation>,
  category: CompatResult["category"],
  dim: CompatDimension,
): string {
  const base = {
    growth: "Reach out today — your energies build on each other.",
    soulmate: "Easy day to be present with them. No need to push.",
    complement: "Lean into difference — don't try to make them like you.",
    soft: "Give space. Small messages over big ones.",
    moderate: "Stay light. Don't overinterpret silence today.",
  }[category];

  const dimSuffix = {
    love: " Pick warmth over wit.",
    career: " Decisions land better than discussions today.",
    friend: " A casual ping beats a planned meeting.",
    general: "",
  }[dim];

  void rel; // reserved for future fine-grain rules
  return base + dimSuffix;
}

export function computeCompatibility(
  birthdateA: string,
  birthdateB: string,
  dimension: CompatDimension = "general",
): CompatResult {
  const keyA = trigramFromBirthdate(birthdateA);
  const keyB = trigramFromBirthdate(birthdateB);
  const tA = TRIGRAMS[keyA];
  const tB = TRIGRAMS[keyB];
  const rel = elementRelation(tA.element, tB.element);
  const score = pseudoScore(birthdateA, birthdateB);
  const { label, category } = pickLabel(rel, score);
  const dayEnergy = todayEnergy();

  const description =
    rel === "generate"
      ? `${tA.element} and ${tB.element} generate each other — one feeds the other's growth.`
      : rel === "complement"
        ? `Both ${tA.element} — same wavelength, less explaining needed.`
        : rel === "overcome"
          ? `Crossing elements — friction that reveals each other's blind spots.`
          : `Different rhythms — neither right nor wrong, just unlike.`;

  return {
    score,
    qualitativeLabel: label,
    category,
    elementFlow: [
      ELEMENT_GLYPH[tA.element] ?? "·",
      "→",
      ELEMENT_GLYPH[tB.element] ?? "·",
    ],
    description,
    display: {
      showNumeric: score >= 60, // Dev Principle #3
      level: score >= 80 ? "good" : score >= 60 ? "moderate" : "soft",
    },
    todayAdvice: todayAdviceFor(rel, category, dimension) +
      ` Today is a ${dayEnergy.label}.`,
    trigrams: {
      a: { glyph: tA.glyph, element: tA.element, nameEn: tA.nameEn },
      b: { glyph: tB.glyph, element: tB.element, nameEn: tB.nameEn },
    },
  };
}

export type { TrigramKey };
