// Daily reading builder.
// Derives 干支 (heavenly stems + earthly branches) for today,
// then renders a personalized reading based on user trigram × day element.

import {
  TRIGRAMS,
  TRIGRAM_DIRECTION,
  TRIGRAM_LUCKY_HOURS,
  trigramFromBirthdate,
  type TrigramKey,
} from "./trigrams.js";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_ELEMENT: Record<string, string> = {
  甲: "wood", 乙: "wood",  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth", 庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子: "water", 丑: "earth", 寅: "wood",  卯: "wood",
  辰: "earth", 巳: "fire",  午: "fire",  未: "earth",
  申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

const COLORS: Record<string, string[]> = {
  wood:  ["green", "teal"],
  fire:  ["red", "vermilion"],
  earth: ["beige", "ochre"],
  metal: ["white", "silver"],
  water: ["midnight blue", "ink"],
};

export interface DayEnergy {
  date: string;          // YYYY-MM-DD
  stem: string;          // 干
  branch: string;        // 支
  stemElement: string;
  branchElement: string;
  label: string;         // "Fire-Metal day"
}

export interface Reading {
  date: string;
  trigram: {
    key: TrigramKey;
    glyph: string;
    nameEn: string;
    nameZh: string;
    element: string;
  };
  dayEnergy: DayEnergy;
  headline: string;
  body: string;
  luckyColors: string[];
  luckyDirection: string;
  luckyHours: string[];
  caution: string | null;
}

/** Compute the 干支 (jiazi) for any given date, anchored to 2026-01-01 = 甲子. */
export function dayJiazi(date = new Date()): { stem: string; branch: string } {
  const ref = new Date(Date.UTC(2026, 0, 1));
  const days = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - ref.getTime()) /
      (24 * 3600 * 1000),
  );
  const idx = ((days % 60) + 60) % 60;
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };
}

export function todayEnergy(date = new Date()): DayEnergy {
  const { stem, branch } = dayJiazi(date);
  const stemElement = STEM_ELEMENT[stem];
  const branchElement = BRANCH_ELEMENT[branch];
  return {
    date: date.toISOString().slice(0, 10),
    stem,
    branch,
    stemElement,
    branchElement,
    label: `${cap(stemElement)}-${cap(branchElement)} day`,
  };
}

function feeds(from: string, to: string): boolean {
  return (
    (from === "wood" && to === "fire") ||
    (from === "fire" && to === "earth") ||
    (from === "earth" && to === "metal") ||
    (from === "metal" && to === "water") ||
    (from === "water" && to === "wood")
  );
}

function overcomes(from: string, to: string): boolean {
  return (
    (from === "wood" && to === "earth") ||
    (from === "earth" && to === "water") ||
    (from === "water" && to === "fire") ||
    (from === "fire" && to === "metal") ||
    (from === "metal" && to === "wood")
  );
}

function headlineFor(userEl: string, dayEl: string): string {
  if (userEl === dayEl) return "Your day. Move.";
  if (feeds(dayEl, userEl)) return "Today wants you bigger.";
  if (feeds(userEl, dayEl)) return "Today asks you to give.";
  if (overcomes(dayEl, userEl)) return "Today is friction — bend, don't break.";
  if (overcomes(userEl, dayEl)) return "Today bends to you, gently.";
  return "Today is yours to read.";
}

function bodyFor(userEl: string, dayEl: string): string {
  if (userEl === dayEl)
    return `Your element doubles today. Whatever you start has wind behind it. The risk: too much of the same — pace yourself.`;
  if (feeds(dayEl, userEl))
    return `Today's ${dayEl} feeds your ${userEl}. Conversations land. Asks get yes. Start the thing.`;
  if (feeds(userEl, dayEl))
    return `Today's ${dayEl} drinks from your ${userEl}. Generous day. Give first — it returns later.`;
  if (overcomes(dayEl, userEl))
    return `Today's ${dayEl} pushes on your ${userEl}. Don't pick fights. Pick rest, walks, slower conversations.`;
  return `Move with the day, not against it. Read the room first.`;
}

function cautionFor(userEl: string, dayEl: string): string | null {
  if (overcomes(dayEl, userEl))
    return `Avoid making high-stakes commitments today — your ${userEl} is being pressed.`;
  if (userEl === dayEl)
    return `Avoid burnout — when your element doubles, you can overspend energy without noticing.`;
  return null;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function readingFor(
  birthdate: string,
  opts: { gender?: "male" | "female" | "any"; date?: Date } = {},
): Reading {
  const trigramKey = trigramFromBirthdate(birthdate, opts.gender ?? "any");
  const t = TRIGRAMS[trigramKey];
  const energy = todayEnergy(opts.date);

  const userEl = t.element;
  const dayEl = energy.stemElement;

  const luckyColors = dedupe([
    ...(COLORS[userEl] ?? []),
    ...(COLORS[dayEl] ?? []),
  ]);

  return {
    date: energy.date,
    trigram: {
      key: trigramKey,
      glyph: t.glyph,
      nameEn: t.nameEn,
      nameZh: t.nameZh,
      element: userEl,
    },
    dayEnergy: energy,
    headline: headlineFor(userEl, dayEl),
    body: bodyFor(userEl, dayEl),
    luckyColors,
    luckyDirection: TRIGRAM_DIRECTION[trigramKey],
    luckyHours: TRIGRAM_LUCKY_HOURS[trigramKey],
    caution: cautionFor(userEl, dayEl),
  };
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
