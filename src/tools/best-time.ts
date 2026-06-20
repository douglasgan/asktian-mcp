// Tool: asktian_best_time_for_action
import { parseISODate } from "../lib/date.js";
import { bestTimePreview } from "../lib/teaser.js";

// Action kinds the tool accepts (kept for the input schema / typing).
type ActionKind =
  | "difficult_conversation" | "negotiation" | "launch" | "first_meeting"
  | "ask_for_favor" | "make_decision" | "rest" | "creative_work" | "travel" | "generic";

export const bestTimeTool = {
  name: "asktian_best_time_for_action",
  description:
    "Find the most auspicious time windows in the next N days for a specific action. " +
    "Use this when the user asks 'when should I do X', 'should I move this meeting', " +
    "'is tomorrow a good day to launch', 'when should I have the hard conversation', etc. " +
    "Returns top 3 best windows and any windows to avoid. This is the most useful tool for " +
    "real-time decision support inside any AI assistant — it lets you give specific " +
    "scheduling advice instead of vague reflections.",
  inputSchema: {
    type: "object" as const,
    properties: {
      birthdate: {
        type: "string",
        description: "ISO YYYY-MM-DD birthdate of the person taking the action.",
      },
      action: {
        type: "string",
        enum: [
          "difficult_conversation",
          "negotiation",
          "launch",
          "first_meeting",
          "ask_for_favor",
          "make_decision",
          "rest",
          "creative_work",
          "travel",
          "generic",
        ],
        description:
          "What kind of action. Pick the closest match; use 'generic' if unsure.",
      },
      range_days: {
        type: "number",
        description: "How many days ahead to search. Default 7. Max 30.",
        minimum: 1,
        maximum: 30,
      },
    },
    required: ["birthdate"],
  },
};

export function callBestTime(args: {
  birthdate: string;
  action?: ActionKind;
  range_days?: number;
}) {
  parseISODate(args.birthdate, "birthdate"); // validates format + calendar validity
  // Ranked, chart-specific time windows are computed server-side at api.asktian.com.
  // Keyless mode returns a generic, clearly-marked preview (no real windows) — see
  // lib/teaser.ts.
  return bestTimePreview(args.action ?? "generic");
}
