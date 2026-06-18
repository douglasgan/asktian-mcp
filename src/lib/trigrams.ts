// 8 Trigrams (八卦) — archetype system for asktian MCP.
// Self-contained so the npm package has no workspace dependencies.

export type TrigramKey =
  | "kun" | "kan" | "dui" | "xun" | "qian" | "li" | "zhen" | "gen";

export type Element =
  | "earth" | "water" | "metal" | "wood" | "fire" | "thunder" | "mountain";

export interface Trigram {
  key: TrigramKey;
  glyph: string;
  element: Element;
  nameZh: string;
  nameEn: string;
  tagline: string;
}

export const TRIGRAMS: Record<TrigramKey, Trigram> = {
  kun:  { key: "kun",  glyph: "坤", element: "earth",   nameZh: "坤土温柔型",   nameEn: "THE GROUNDED MOTHER",  tagline: "嘴上倔强 · 心里疼你" },
  kan:  { key: "kan",  glyph: "坎", element: "water",   nameZh: "坎水细腻型",   nameEn: "THE DEEP CURRENT",     tagline: "话不多 · 心思细" },
  dui:  { key: "dui",  glyph: "兑", element: "metal",   nameZh: "兑金倔强型",   nameEn: "THE BRIGHT BLADE",     tagline: "嘴硬心软 · 笑起来 disarming" },
  xun:  { key: "xun",  glyph: "巽", element: "wood",    nameZh: "巽风灵活型",   nameEn: "THE WIND READER",      tagline: "想得多 · 走得快" },
  qian: { key: "qian", glyph: "乾", element: "metal",   nameZh: "乾金强势型",   nameEn: "THE STEADY SKY",       tagline: "话不多 · 一句一锤" },
  li:   { key: "li",   glyph: "离", element: "fire",    nameZh: "离火灿烂型",   nameEn: "THE BRIGHT FLAME",     tagline: "热情外露 · 自带光" },
  zhen: { key: "zhen", glyph: "震", element: "thunder", nameZh: "震雷活力型",   nameEn: "THE WAKING THUNDER",   tagline: "动作快 · 想到就做" },
  gen:  { key: "gen",  glyph: "艮", element: "mountain", nameZh: "艮山沉稳型", nameEn: "THE STILL MOUNTAIN",   tagline: "稳如山 · 慢热" },
};

/** Stable hash → trigram. Replace with api.asktian.com when archetype endpoint is exposed. */
export function trigramFromBirthdate(
  birthdate: string,
  gender: "male" | "female" | "any" = "any",
): TrigramKey {
  const keys = Object.keys(TRIGRAMS) as TrigramKey[];
  let hash = 0;
  const seed = `${birthdate}|${gender}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return keys[hash % keys.length];
}

export type ElementRelation = "generate" | "complement" | "neutral" | "overcome";

const FEEDS: Record<string, string> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const OVERCOMES: Record<string, string> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

export function elementRelation(a: string, b: string): ElementRelation {
  if (a === b) return "complement";
  if (FEEDS[a] === b || FEEDS[b] === a) return "generate";
  if (OVERCOMES[a] === b || OVERCOMES[b] === a) return "overcome";
  return "neutral";
}

/** Direction associated with each trigram (per 后天八卦 / Later Heaven Bagua) */
export const TRIGRAM_DIRECTION: Record<TrigramKey, string> = {
  kun:  "Southwest",
  kan:  "North",
  dui:  "West",
  xun:  "Southeast",
  qian: "Northwest",
  li:   "South",
  zhen: "East",
  gen:  "Northeast",
};

/** Best-hour pairs per trigram (rough; chat.asktian.com refines) */
export const TRIGRAM_LUCKY_HOURS: Record<TrigramKey, string[]> = {
  kun:  ["10am-12pm", "8pm-10pm"],
  kan:  ["11pm-1am", "5am-7am"],
  dui:  ["5pm-7pm", "9am-11am"],
  xun:  ["9am-11am", "3pm-5pm"],
  qian: ["7pm-9pm", "1pm-3pm"],
  li:   ["11am-1pm", "5pm-7pm"],
  zhen: ["5am-7am", "5pm-7pm"],
  gen:  ["1am-3am", "1pm-3pm"],
};
