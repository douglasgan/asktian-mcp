#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────
// asktian MCP server · 0.2.4
//
// Exposes Chinese metaphysics (bazi · qimen · 5 elements · daily energy)
// as tools any MCP-compatible AI agent can call.
//
// TWO TRANSPORTS:
//   • stdio (default)  — `npx @asktian/mcp-server`, for Claude Desktop / Cursor / Windsurf / Zed
//   • streamable-HTTP  — `ASKTIAN_MCP_HTTP=1 node dist/server.js`, for hosting at mcp.asktian.com
//                        so LangChain / LlamaIndex / Fetch.ai / remote agents can connect.
//
// HTTP mode env:
//   ASKTIAN_MCP_HTTP=1   enable HTTP transport (or pass --http)
//   PORT=8080            port to listen on (default 8080)
//   ASKTIAN_MCP_PATH     endpoint path (default /mcp)
// ──────────────────────────────────────────────────────────────

import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { dailyReadingTool, callDailyReading } from "./tools/daily-reading.js";
import { compatibilityTool, callCompatibility } from "./tools/compatibility.js";
import { bestTimeTool, callBestTime } from "./tools/best-time.js";
import { todayEnergyTool, callTodayEnergy } from "./tools/today-energy.js";
import { nameAnalysisTool, callNameAnalysis } from "./tools/name-analysis.js";
import { apiKeyInfo } from "./lib/api-client.js";

const VERSION = "0.2.4";
const ALL_TOOLS = [
  dailyReadingTool,
  compatibilityTool,
  bestTimeTool,
  todayEnergyTool,
  nameAnalysisTool,
];

// ───────────────────────────────────────────
// build a configured MCP Server instance
// (a fresh one is created per HTTP request in stateless mode)
// ───────────────────────────────────────────
function buildServer(): Server {
  const server = new Server(
    { name: "asktian", version: VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
      let result: unknown;
      switch (name) {
        case "asktian_daily_reading":
          result = callDailyReading(args as Parameters<typeof callDailyReading>[0]);
          break;
        case "asktian_compatibility":
          result = await callCompatibility(args as Parameters<typeof callCompatibility>[0]);
          break;
        case "asktian_best_time_for_action":
          result = callBestTime(args as Parameters<typeof callBestTime>[0]);
          break;
        case "asktian_today_energy":
          result = callTodayEnergy(args as Parameters<typeof callTodayEnergy>[0]);
          break;
        case "asktian_name_analysis":
          result = callNameAnalysis(args as Parameters<typeof callNameAnalysis>[0]);
          break;
        default:
          throw new Error(`unknown tool: ${name}`);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

// ───────────────────────────────────────────
// stdio transport (default — local CLI usage)
// ───────────────────────────────────────────
async function runStdio() {
  process.stderr.write(
    `[asktian-mcp v${VERSION}] stdio · tools: ${ALL_TOOLS.map((t) => t.name).join(", ")}\n`,
  );
  const info = apiKeyInfo();
  process.stderr.write(
    `[asktian-mcp] api.asktian.com key: ${info.source} (${info.live ? "live" : "local fallback only"})\n`,
  );
  const server = buildServer();
  await server.connect(new StdioServerTransport());
}

// ───────────────────────────────────────────
// streamable-HTTP transport (hosted — remote agents)
// ───────────────────────────────────────────
function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("body too large")); // 1MB cap
    });
    req.on("end", () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

async function runHttp() {
  const port = Number(process.env.PORT ?? 8080);
  const mcpPath = process.env.ASKTIAN_MCP_PATH ?? "/mcp";
  const info = apiKeyInfo();

  const http = createHttpServer(async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }

    // Health check
    if (req.method === "GET" && (req.url === "/health" || req.url === "/")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, server: "asktian", version: VERSION, tools: ALL_TOOLS.map((t) => t.name) }));
      return;
    }

    const url = (req.url ?? "").split("?")[0];
    if (url !== mcpPath) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `not found — POST to ${mcpPath}` }));
      return;
    }

    // Stateless mode has no server-initiated SSE stream, so only POST is valid.
    // Without this, a GET (which the SDK answers with a long-lived SSE stream)
    // hangs the connection open forever — a resource-exhaustion vector on a
    // public endpoint. Per the MCP spec, reject non-POST with 405.
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json", "Allow": "POST" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: `Method not allowed — POST to ${mcpPath}` }, id: null }));
      return;
    }

    // Stateless: a fresh Server + transport per request avoids cross-request
    // ID collisions. sessionIdGenerator: undefined = no session state.
    // NOTE (Phase 3): per-request `Authorization` / x402 payment headers are
    // read here when billing lands; for now the gateway's own ASKTIAN_API_KEY
    // env is used by the api-client.
    try {
      const body = await readBody(req); // guaranteed POST by the check above
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message }, id: null }));
      }
    }
  });

  http.listen(port, () => {
    process.stderr.write(
      `[asktian-mcp v${VERSION}] streamable-HTTP on :${port}${mcpPath} · tools: ${ALL_TOOLS.map((t) => t.name).join(", ")}\n`,
    );
    process.stderr.write(
      `[asktian-mcp] api.asktian.com key: ${info.source} (${info.live ? "live" : "local fallback only"})\n`,
    );
  });
}

// ───────────────────────────────────────────
// exports — so the gateway (and other apps) can reuse the tools
// without spawning a server. buildServer() returns a configured MCP Server;
// the call* fns run individual tools directly.
// ───────────────────────────────────────────
export { buildServer, ALL_TOOLS, VERSION };
export { callDailyReading, callCompatibility, callBestTime, callTodayEnergy, callNameAnalysis };

// ───────────────────────────────────────────
// boot — pick transport, but ONLY when run as the CLI entry point
// (not when imported as a library — importing must have no side effects).
// ───────────────────────────────────────────
const isCliEntry =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntry) {
  const httpMode = process.env.ASKTIAN_MCP_HTTP === "1" || process.argv.includes("--http");
  (httpMode ? runHttp() : runStdio()).catch((e) => {
    process.stderr.write(`[asktian-mcp] fatal: ${e}\n`);
    process.exit(1);
  });
}
