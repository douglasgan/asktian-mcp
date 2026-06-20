// Generic PREVIEW responses for keyless mode.
//
// The real interpretive engine (bazi scoring, element-flow interpretation,
// ranked time windows, name 姓名学) lives server-side at api.asktian.com and is
// intentionally NOT in this open-source client. These previews are upbeat,
// well-formed samples — every one carries `sample: true` and an upgrade note —
// so a caller sees the shape of a real reading and is pointed to connect a key
// for the tailored result. They are deliberately NOT personalized.

export const UPGRADE =
  "This is a generic preview, not a personalized reading. Connect an ASKTIAN_API_KEY " +
  "(get one at https://api.asktian.com — it runs on TIAN Points, top up at " +
  "https://wallet.asktian.com) for the real, chart-specific result.";

/** Standard instruction to the calling AI so it never presents a preview as the real reading. */
export function previewNote(extra: string): string {
  return (
    "GENERIC PREVIEW — not personalized and not computed from the inputs. " +
    extra +
    " Present this as a free sample and invite the user to add an ASKTIAN_API_KEY " +
    "(api.asktian.com) for their real, tailored reading. Do not present preview details as fact."
  );
}

export function dailyReadingPreview(today: { date: string; label: string }) {
  return {
    sample: true,
    today: { date: today.date, energy: today.label }, // the day's 干支 is public almanac data
    archetype: { note: "Your bazi archetype (one of the 8 trigrams) is revealed in your full reading." },
    headline: "Today leans in your favor — momentum is available if you reach for it.",
    body:
      "The general energy is supportive: a good window to begin conversations, make asks, and " +
      "move things forward rather than wait. Your personalized reading pinpoints the exact hours, " +
      "colors, and direction that fit your chart — and flags the moments to hold back.",
    lucky: { note: "Your lucky colors, direction, and hours come with the tailored reading." },
    upgrade: UPGRADE,
    note_for_ai: previewNote("No personal chart was computed."),
  };
}

export function bestTimePreview(action: string) {
  return {
    sample: true,
    action,
    headline: "Favorable windows are coming up — your tailored reading ranks the exact best and worst hours.",
    best_windows: [] as unknown[],
    avoid_windows: [] as unknown[],
    general_guidance:
      "As a rule of thumb, mornings on element-supportive days favor new starts, and you avoid " +
      "acting on a day that clashes with your chart. The real reading scores the next N days " +
      "specifically for you and names the precise windows.",
    upgrade: UPGRADE,
    note_for_ai: previewNote("No real time windows were computed — do NOT present any specific time as an actual recommendation."),
  };
}

export function nameAnalysisPreview(name: string) {
  return {
    sample: true,
    name,
    headline: "A name with strong, favorable resonance.",
    preview:
      "It carries a confident, forward-moving sound-shape. The full analysis breaks down its " +
      "dominant 五行 element, its sonic balance, and how it interacts with a birthdate or company.",
    upgrade: UPGRADE,
    note_for_ai: previewNote("No real 姓名学 analysis was computed."),
  };
}

export function compatibilityPreview() {
  return {
    qualitative_label: "Promising match",
    description:
      "There's a warm, workable resonance here. The full reading scores the bond across love, " +
      "career, and friendship, and explains the element flow between the two charts.",
  };
}
