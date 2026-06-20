// Day-energy (干支 / jiazi) calendar utilities.
//
// This computes the public sexagenary-cycle stem+branch for a date and its
// dominant 5-element character — public almanac data, used by the keyless
// `today_energy` tool and as harmless context for previews. The personalized
// interpretive engine (what a given day means for a given chart) lives
// server-side at api.asktian.com and is not part of this open-source client.

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

export interface DayEnergy {
  date: string;          // YYYY-MM-DD
  stem: string;          // 干
  branch: string;        // 支
  stemElement: string;
  branchElement: string;
  label: string;         // "Fire-Metal day"
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
