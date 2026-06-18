// best-time.ts — find auspicious windows for an action over a date range.
// This is the killer MCP tool: "I have a meeting at 3pm tomorrow, should I move it?"

import { TRIGRAMS, trigramFromBirthdate, type TrigramKey } from "./trigrams.js";
import { todayEnergy } from "./reading.js";

export type ActionKind =
  | "difficult_conversation"
  | "negotiation"
  | "launch"
  | "first_meeting"
  | "ask_for_favor"
  | "make_decision"
  | "rest"
  | "creative_work"
  | "travel"
  | "generic";

export interface TimeWindow {
  date: string;              // YYYY-MM-DD
  hourRange: string;         // "11am-1pm"
  score: number;             // 0-100, higher = more favorable
  reason: string;            // why this is good
  caution?: string;          // anything to watch
}

export interface BestTimeResult {
  trigram: { key: TrigramKey; glyph: string; nameEn: string; element: string };
  action: ActionKind;
  bestWindows: TimeWindow[];
  avoidWindows: TimeWindow[];
  oneLine: string;           // headline summary
}

const ACTION_ELEMENT_AFFINITY: Record<ActionKind, string[]> = {
  difficult_conversation: ["earth", "water"],   // grounded, deep
  negotiation: ["metal"],                        // sharp, decisive
  launch: ["fire"],                              // visible, energetic
  first_meeting: ["wood"],                       // growing, open
  ask_for_favor: ["water", "wood"],             // flowing, receptive
  make_decision: ["metal"],                      // cutting
  rest: ["earth"],                               // settled
  creative_work: ["wood", "fire"],              // generative, bright
  travel: ["wood"],                              // movement
  generic: ["earth"],
};

const ACTION_BEST_HOURS: Record<ActionKind, string[]> = {
  difficult_conversation: ["10am-12pm", "2pm-4pm"],
  negotiation: ["10am-12pm"],
  launch: ["11am-1pm"],
  first_meeting: ["9am-11am", "2pm-4pm"],
  ask_for_favor: ["10am-12pm"],
  make_decision: ["9am-11am"],
  rest: ["7pm-10pm"],
  creative_work: ["9am-12pm", "8pm-11pm"],
  travel: ["6am-9am"],
  generic: ["10am-12pm"],
};

const FEEDS: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const OVERCOMES: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

function scoreDayForAction(
  userEl: string,
  dayEl: string,
  action: ActionKind,
): { score: number; reason: string; caution?: string } {
  const affinities = ACTION_ELEMENT_AFFINITY[action];
  let score = 60;
  const reasons: string[] = [];
  let caution: string | undefined;

  // Element matches action's preferred element
  if (affinities.includes(dayEl)) {
    score += 15;
    reasons.push(`today's ${dayEl} aligns with this kind of action`);
  }

  // Day feeds user
  if (FEEDS[dayEl] === userEl) {
    score += 12;
    reasons.push(`today's ${dayEl} feeds your ${userEl} — energy is on your side`);
  }
  // User feeds day (generous but draining)
  else if (FEEDS[userEl] === dayEl) {
    score += 4;
    reasons.push(`you'll be giving today — sustainable but tiring`);
  }
  // Day overcomes user (clash)
  else if (OVERCOMES[dayEl] === userEl) {
    score -= 25;
    reasons.push(`today's ${dayEl} clashes with your ${userEl}`);
    caution = `Avoid forcing this — your element is under pressure`;
  }
  // User overcomes day (you push through but cost)
  else if (OVERCOMES[userEl] === dayEl) {
    score += 6;
    reasons.push(`you can push through today, but it'll cost energy`);
  }
  // Match (doubled)
  else if (dayEl === userEl) {
    score += 18;
    reasons.push(`your element doubles today — peak day for ${action.replace(/_/g, " ")}`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reason: reasons.join("; "),
    caution,
  };
}

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const STEM_ELEMENT: Record<string, string> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth", 庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

function dateNDaysFromNow(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function jiazi(date: Date): { stem: string; branch: string } {
  const ref = new Date(Date.UTC(2026, 0, 1));
  const days = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - ref.getTime()) /
      (24 * 3600 * 1000),
  );
  const idx = ((days % 60) + 60) % 60;
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };
}

export function bestTimeFor(
  birthdate: string,
  action: ActionKind = "generic",
  rangeDays = 7,
  opts: { gender?: "male" | "female" | "any" } = {},
): BestTimeResult {
  // Normalize unknown/invalid actions to "generic" — the inputSchema enum is
  // advisory, so a caller (or misbehaving agent) can pass anything. Without this,
  // ACTION_ELEMENT_AFFINITY[action] / ACTION_BEST_HOURS[action] would be undefined
  // and crash with a cryptic TypeError instead of returning a sensible reading.
  if (!(action in ACTION_ELEMENT_AFFINITY)) action = "generic";

  const trigramKey = trigramFromBirthdate(birthdate, opts.gender ?? "any");
  const t = TRIGRAMS[trigramKey];

  const windows: TimeWindow[] = [];

  for (let i = 0; i < rangeDays; i++) {
    const date = dateNDaysFromNow(i);
    const { stem } = jiazi(date);
    const dayEl = STEM_ELEMENT[stem];
    const dayScore = scoreDayForAction(t.element, dayEl, action);
    for (const hourRange of ACTION_BEST_HOURS[action]) {
      windows.push({
        date: date.toISOString().slice(0, 10),
        hourRange,
        score: dayScore.score,
        reason: dayScore.reason,
        caution: dayScore.caution,
      });
    }
  }

  const sorted = [...windows].sort((a, b) => b.score - a.score);
  const bestWindows = sorted.slice(0, 3);
  const avoidWindows = sorted.filter((w) => w.score < 50).slice(0, 2);

  const top = bestWindows[0];
  const oneLine = top
    ? `Best window: ${top.date} ${top.hourRange} (score ${top.score}). ${top.reason}.`
    : "No strong window in the next " + rangeDays + " days — proceed normally.";

  return {
    trigram: {
      key: trigramKey,
      glyph: t.glyph,
      nameEn: t.nameEn,
      element: t.element,
    },
    action,
    bestWindows,
    avoidWindows,
    oneLine,
  };
}
