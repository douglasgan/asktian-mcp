// api-client.ts — calls api.asktian.com server-side from the MCP process.
// Returns null on failure so callers can fall back to local logic.

const BASE = process.env.ASKTIAN_API_BASE ?? "https://api.asktian.com";
const KEY = process.env.ASKTIAN_API_KEY;

interface TrpcWrap<T> {
  result?: { data?: { json?: T } };
  error?: { message?: string };
}

export async function trpcGet<T>(
  path: string,
  input: Record<string, unknown>,
): Promise<T | null> {
  if (!KEY) return null;
  const url = `${BASE}/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
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

export interface BirthdayCompatRaw {
  score: number;
  romanceScore?: number;
  friendshipScore?: number;
  marriageScore?: number;
  rating?: string;
  relationshipType?: string;
  pairChinese?: string;
}

export async function fetchBirthdayCompat(
  date1: string,
  date2: string,
): Promise<BirthdayCompatRaw | null> {
  return trpcGet<BirthdayCompatRaw>("compatibility.birthday", { date1, date2 });
}

export function hasApiKey(): boolean {
  return Boolean(KEY);
}

export function apiKeyInfo(): { source: string; live: boolean } {
  return {
    source: KEY ? `${KEY.slice(0, 8)}…` : "none — set ASKTIAN_API_KEY",
    live: Boolean(KEY),
  };
}
