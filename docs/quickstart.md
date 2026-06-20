# Quickstart — add the decision layer in 2 minutes

askTIAN is an MCP server. Point any MCP client at it and your agent gets 6 decision tools.
**No API key needed** — readings are real and free (rate-limited). An optional `ASKTIAN_API_KEY`
([api.asktian.com](https://api.asktian.com)) raises the limit and unlocks the premium tier.

Jump to: [Claude Desktop](#claude-desktop) · [Claude Code](#claude-code) · [Cursor](#cursor) · [Windsurf](#windsurf) · [Zed](#zed) · [LangChain / LlamaIndex](#langchain--llamaindex) · [First prompts](#first-prompts-to-try)

---

## Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "asktian": { "command": "npx", "args": ["-y", "@asktian/mcp-server"] }
  }
}
```

Restart Claude Desktop. The 🔌 icon should show **asktian** with 6 tools.

## Claude Code

```bash
claude mcp add asktian -- npx -y @asktian/mcp-server
```

## Cursor

`~/.cursor/mcp.json` (or Settings → MCP → Add):

```json
{
  "mcpServers": {
    "asktian": { "command": "npx", "args": ["-y", "@asktian/mcp-server"] }
  }
}
```

## Windsurf

`~/.codeium/windsurf/mcp_config.json` — same `mcpServers` block as Cursor above.

## Zed

`settings.json` → `context_servers`:

```json
{
  "context_servers": {
    "asktian": { "command": { "path": "npx", "args": ["-y", "@asktian/mcp-server"] } }
  }
}
```

## LangChain / LlamaIndex

Use the hosted streamable-HTTP endpoint — full snippets in [langchain-llamaindex.md](langchain-llamaindex.md):

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
client = MultiServerMCPClient({
    "asktian": {"transport": "streamable_http", "url": "https://mcp.asktian.com/mcp"}
})
tools = await client.get_tools()   # 6 askTIAN tools, no key required
```

> Adding a key? Pass it as `env: { "ASKTIAN_API_KEY": "at_live_..." }` (stdio) or an
> `Authorization: Bearer at_live_...` header (HTTP).

---

## First prompts to try

The point of askTIAN is a **decisive, specific** answer where a plain LLM would hedge. Try:

- *"When's the best time this week to send a tough email? I was born 1992-05-15."*
  → ranked windows with reasons, not "consider the timing."
- *"Is today a good day to sign a contract?"*
  → real almanac: the day's auspicious / inauspicious activities + lucky directions.
- *"Are we compatible? Born 1992-05-15 and 1990-08-22."*
  → a real score across romance / friendship / marriage.
- *"Pick an auspicious day next month to move house."*
  → the genuinely-used 黄道 almanac utility.

If your client supports it, ask the agent to **call the tool and commit to one answer** — that's the
decision layer doing its job.

---

## Self-host the HTTP endpoint

```bash
ASKTIAN_MCP_HTTP=1 PORT=8080 npx -y @asktian/mcp-server   # POST /mcp · GET /health
```
