// Tool: asktian_today_energy
import { todayEnergy } from "../lib/reading.js";
import { parseISODate } from "../lib/date.js";

export const todayEnergyTool = {
  name: "asktian_today_energy",
  description:
    "Get today's GENERAL energy (no person needed) — the 干支 (stem + branch) and the " +
    "dominant 5-element character of the day. Useful when the user asks 'what kind of day " +
    "is it', 'what's the energy today', or when an AI agent wants to add cosmic context " +
    "to a generic suggestion without needing the user's birthdate.",
  inputSchema: {
    type: "object" as const,
    properties: {
      date: {
        type: "string",
        description: "Optional ISO YYYY-MM-DD. Defaults to today (UTC).",
      },
    },
    required: [],
  },
};

export function callTodayEnergy(args: { date?: string }) {
  const d = args.date ? parseISODate(args.date) : new Date();
  const energy = todayEnergy(d);
  return {
    date: energy.date,
    label: energy.label,
    stem: energy.stem,
    branch: energy.branch,
    stem_element: energy.stemElement,
    branch_element: energy.branchElement,
    description: dayDescription(energy.stemElement, energy.branchElement),
  };
}

function dayDescription(stemEl: string, branchEl: string): string {
  if (stemEl === branchEl) {
    return `A ${stemEl}-doubled day. ${stemEl} themes are amplified: ` + themeFor(stemEl);
  }
  return `A ${stemEl}-on-${branchEl} day. ${themeFor(stemEl)} Watch for ${themeFor(branchEl).toLowerCase()}`;
}

function themeFor(el: string): string {
  return ({
    wood: "Growth, conversations, new starts.",
    fire: "Visibility, presentations, big-picture work.",
    earth: "Stability, agreements, family.",
    metal: "Decisions, cuts, sharpness.",
    water: "Reflection, deep work, listening.",
  } as Record<string, string>)[el] ?? "Generic flow.";
}
