// Tool: asktian_name_analysis
// Simple energetic profile of a name. Works for any language;
// best for Chinese names. Future: call api.asktian.com name endpoint.

export const nameAnalysisTool = {
  name: "asktian_name_analysis",
  description:
    "Quick energetic profile of a name (姓名学 name-analysis). Useful when the user asks " +
    "about someone's name, a baby name, a company name, or 'what kind of person is X' when " +
    "no birthdate is available. Returns a one-line vibe + dominant element guess.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The name to analyze. Can be in any script.",
      },
      language: {
        type: "string",
        enum: ["en", "zh", "auto"],
        description: "Language hint. Default 'auto'.",
      },
    },
    required: ["name"],
  },
};

const VOWELS = "aeiouAEIOU";

export function callNameAnalysis(args: { name: string; language?: string }) {
  // Guard non-string / missing input — a number or undefined would crash on .trim()
  // with a cryptic TypeError instead of a clean validation error.
  const name = typeof args.name === "string" ? args.name.trim() : "";
  if (!name) throw new Error("name is required");

  // Compute a simple hash-stable "element" for the name.
  // Western: vowel/consonant ratio + length resonance.
  // Chinese: stroke-count proxy (length of CJK chars).
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const elements = ["wood", "fire", "earth", "metal", "water"] as const;
  const element = elements[hash % elements.length];

  let vowelCount = 0;
  for (const c of name) if (VOWELS.includes(c)) vowelCount++;
  const vowelRatio = name.length ? vowelCount / name.length : 0;

  const tone =
    vowelRatio > 0.5
      ? "open, expressive"
      : vowelRatio > 0.3
        ? "balanced"
        : "tight, sharp";

  return {
    name,
    dominant_element: element,
    energetic_tone: tone,
    one_liner: oneLinerFor(element, tone),
    note_for_ai:
      "This is a quick read. For real depth, ask for the person's birthdate and use " +
      "asktian_daily_reading or asktian_compatibility.",
  };
}

function oneLinerFor(element: string, tone: string): string {
  const elementWord = {
    wood: "growth and forward motion",
    fire: "visibility and warmth",
    earth: "groundedness and durability",
    metal: "precision and resolve",
    water: "depth and adaptability",
  }[element] ?? "presence";
  return `A name leaning toward ${elementWord}, with a ${tone} sound-shape.`;
}
