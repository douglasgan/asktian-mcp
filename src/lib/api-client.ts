// api-client.ts — calls the live askTIAN backend (tRPC) from the MCP process.
//
// The read endpoints are public + rate-limited (300 / 15 min per IP). An
// ASKTIAN_API_KEY is OPTIONAL: send it for higher limits / the premium tian.*
// tier later. Every helper returns null on any failure so tools can fall back
// to a graceful preview.

const BASE = process.env.ASKTIAN_API_BASE ?? "https://api.asktian.com/api/trpc";
const KEY = process.env.ASKTIAN_API_KEY;

interface TrpcWrap<T> {
  result?: { data?: { json?: T } };
  error?: unknown;
}

/** GET a tRPC query: BASE/<proc>?input={"json":<input>} → result.data.json (or null). */
export async function trpcGet<T = unknown>(
  proc: string,
  input: Record<string, unknown>,
): Promise<T | null> {
  const url = `${BASE}/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return null;
    const body = (await res.json()) as TrpcWrap<T>;
    if (body.error) return null;
    return body.result?.data?.json ?? null;
  } catch {
    return null;
  }
}

// ── Typed helpers for the procedures the MCP tools use ──────────────────────

export interface AlmanacRaw {
  date: string;
  lunarDate?: string;
  dayGanZhi?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  dayZodiac?: string;
  twelveDeity?: string;
  twelveDeityLuck?: string;
  isHuangDao?: boolean;
  auspiciousActivities?: string[];
  inauspiciousActivities?: string[];
  overallFortune?: string;
  positionCai?: string;   // wealth direction
  positionXi?: string;    // joy direction
  positionFu?: string;    // blessing direction
  score?: number;
  [k: string]: unknown;
}
export const fetchAlmanacDaily = (date: string) =>
  trpcGet<AlmanacRaw>("almanac.daily", { date });

export interface CompatRaw {
  score?: number;
  romanceScore?: number;
  friendshipScore?: number;
  marriageScore?: number;
  astroDescription?: string;
  dimensions?: unknown;
  person1?: unknown;
  person2?: unknown;
  [k: string]: unknown;
}
export const fetchCompatBirthday = (date1: string, date2: string) =>
  trpcGet<CompatRaw>("compatibility.birthday", { date1, date2 });

export interface NameRaw {
  name?: string;
  surname?: string;
  givenName?: string;
  overallScore?: number;
  overallFortune?: string;
  summary?: string;
  fiveFormations?: unknown;
  score?: number;
  [k: string]: unknown;
}
export const fetchNameAnalysis = (surname: string, givenName: string) =>
  trpcGet<NameRaw>("nameAnalysis.analyze", { surname, givenName });

export function apiKeyInfo(): { source: string; live: boolean } {
  return {
    source: KEY ? `${KEY.slice(0, 8)}…` : "none (public reads, rate-limited)",
    live: Boolean(KEY),
  };
}
