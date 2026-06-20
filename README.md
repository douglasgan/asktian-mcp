# asktian MCP server

[![CI](https://github.com/douglasgan/asktian-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/douglasgan/asktian-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@asktian/mcp-server)](https://www.npmjs.com/package/@asktian/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![asktian MCP server](https://glama.ai/mcp/servers/douglasgan/asktian-mcp/badges/score.svg)](https://glama.ai/mcp/servers/douglasgan/asktian-mcp)

> **Chinese metaphysics inside your AI assistant.**
> 不知道就问天 · Ask tian when you don't know.

Adds 4000 years of Chinese metaphysical traditions (bazi / 八字, qimen / 奇门, five elements, daily 干支 energy) as callable tools for any AI agent that speaks the **Model Context Protocol** — Claude Desktop, Claude Code, Cursor, Windsurf, Zed, and any MCP-compatible client.

When you ask your AI assistant a timing, person, or decision question, it can quietly consult asktian before answering.

> ### 🧪 Just testing? → run it **with no key — free forever.**
> ### 🎯 Want the real answers? → add a key from **[api.asktian.com](https://api.asktian.com)** *(requires a funded TIAN balance)*.
>
> The server works **instantly without any API key** (local-fallback mode — free forever, great
> for trying it out). For accurate, full-system readings (real bazi computation, the 70+ endpoint
> backend), set `ASKTIAN_API_KEY` — note the key runs on **TIAN Points**, so it needs a funded
> balance ([top up at wallet.asktian.com](https://wallet.asktian.com)). The key is optional;
> local mode is always free.

```
You: "I have a hard conversation with my boss tomorrow at 3pm. Should I move it?"

Claude (with asktian MCP):
  → calls asktian_best_time_for_action({ birthdate, action: "difficult_conversation" })
  → "Friday 10am scores much higher. Tomorrow 3pm is your clash hour.
     Want me to draft a message to reschedule?"
```

---

## Install

```bash
npm install -g @asktian/mcp-server
```

Then add to your client's MCP config:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "asktian": {
      "command": "asktian-mcp",
      "env": {
        "ASKTIAN_API_KEY": "at_live_xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop. Look for the 🔌 icon — asktian should appear with 6 tools.

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "asktian": {
      "command": "asktian-mcp",
      "env": {
        "ASKTIAN_API_KEY": "at_live_xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json` — same shape as above.

### Zed

Add to your Zed settings under `assistant.mcp_servers` — same command + env.

### Any other MCP client

Run `asktian-mcp` as a subprocess; it speaks JSON-RPC over stdio per the [MCP spec](https://spec.modelcontextprotocol.io).

### Remote / hosted (streamable-HTTP)

For LangChain, LlamaIndex, Fetch.ai, or any agent that connects to a hosted MCP endpoint,
run the server in HTTP mode instead of stdio:

```bash
ASKTIAN_MCP_HTTP=1 PORT=8080 npx -y @asktian/mcp-server
# → streamable-HTTP on :8080/mcp   (health check: GET :8080/health)
```

Hosted at **`https://mcp.asktian.com/mcp`**. Pass your key as a Bearer header:
`Authorization: Bearer YOUR_ASKTIAN_API_KEY`.

### LangChain & LlamaIndex

Both have native MCP adapters — askTIAN works with **zero integration code**. Copy-paste
snippets in **[docs/langchain-llamaindex.md](docs/langchain-llamaindex.md)**.

---

## API key

**The key is optional.** Pick your mode:

| | 🧪 **Local mode** (no key) | 🎯 **Live mode** (with key) |
|---|---|---|
| Setup | nothing — works instantly | get a key at [api.asktian.com](https://api.asktian.com) |
| Cost | **free forever** | key runs on **TIAN Points** — needs a funded balance ([top up](https://wallet.asktian.com)) |
| Best for | **testing / trying it out** | **real, accurate answers** |
| Readings | computed locally on the spot | full api.asktian.com backend (70+ endpoints): real bazi computation, daily fortune, full-system compatibility scoring |
| `today_energy`, `name_analysis` | identical to live | identical to local |

**To switch to Live mode**, set `ASKTIAN_API_KEY` in your client config:

```jsonc
{
  "mcpServers": {
    "asktian": {
      "command": "npx",
      "args": ["-y", "@asktian/mcp-server"],
      "env": { "ASKTIAN_API_KEY": "at_live_..." }   // ← omit this line to stay in local mode
    }
  }
}
```
Hosted (streamable-HTTP)? Pass it as a header instead: `Authorization: Bearer at_live_...`.

---

## The 6 tools

### 1. `asktian_daily_reading`

Personalized daily energy reading for a person.

```
input:  { birthdate: "1992-05-15", birth_hour?: "14:30", gender?: "male"|"female"|"any" }
output: archetype (one of 8 trigrams), today's stem-branch energy,
        favorable colors / direction / hours, headline + body advice
```

**Use when:** user asks how today will be, what colors to wear, what direction to face their desk, daily guidance.

### 2. `asktian_compatibility`

Fate compatibility between two people. Returns qualitative label first (e.g. *"互补型 Complementary"*), then numeric score (hidden if <60 per asktian design principles — low compat should never feel like rejection).

```
input:  { person_a_birthdate, person_b_birthdate, dimension?: "love"|"career"|"friend"|"general" }
output: qualitative label, category, element flow, today's advice, score (with should_show_score flag)
```

**Use when:** "will this person and I work", "compatibility check", "is this a good match".

### 3. `asktian_best_time_for_action`

The killer tool. Find the most auspicious time windows for a specific action over the next N days.

```
input:  { birthdate, action: "difficult_conversation"|"negotiation"|"launch"|... , range_days?: 7 }
output: top 3 best windows (date + hour + score + reason), windows to avoid
```

**Use when:** "when should I do X", "should I move this meeting", "is tomorrow a good day to launch", "when should I have the hard talk".

### 4. `asktian_today_energy`

General energy of the day — no birthdate needed.

```
input:  { date?: "YYYY-MM-DD" } (defaults to today)
output: 干支 stem+branch, dominant 5-element character, description
```

**Use when:** AI wants to add cosmic context to a generic suggestion without needing the user's birthdate.

### 5. `asktian_name_analysis`

Quick energetic profile of a name (姓名学).

```
input:  { name, language?: "en"|"zh"|"auto" }
output: dominant element guess, tone, one-liner
```

**Use when:** discussing baby names, company names, or "what kind of person is X" when birthdate unknown.

### 6. `asktian_market_read`

A Chinese-metaphysics signal on a binary prediction-market question (Polymarket/Kalshi style).

```
input:  { question, resolve_date?: YYYY-MM-DD, subject_birthdate?: YYYY-MM-DD }
output: { signal: { lean: yes|no|neutral, score 5–95, confidence }, reasoning, disclaimer }
```

**Use when:** a user or a trading agent wants an *uncorrelated, for-fun* read on a market —
"will X happen by date Y". The value isn't prediction; it's a **deterministic signal that
doesn't read the same news every LLM reads**, published so the calls can be scored over time.
⚠️ **Entertainment / falsifiable ritual — NOT financial advice.** Every response says so, and
the tool is built to be presented as a novelty, never as a bet recommendation.

---

## Design principles the tools follow

asktian is opinionated. The MCP tools surface these constraints to your AI agent through the `note_for_ai` field on each response. Notable rules:

1. **Qualitative label always wins.** Numbers are secondary.
2. **Scores below 60 hide the number.** Use the label only — never make someone feel rejected by a digit.
3. **Most positive accurate framing.** Same chart can be read 5 ways; pick the one that respects the person.
4. **Today's advice is specific, not vague.** "Reach out before 2pm" beats "Mercury retrograde."

If your AI client surfaces a numeric score when `should_show_score: false`, it's violating the design contract.

---

## Examples — sample prompts that route through asktian

These are the kinds of user prompts that an AI agent with asktian installed handles dramatically better:

| User prompt | Tool the AI will use |
|---|---|
| *"How will today be for me? Born 1992-05-15."* | `asktian_daily_reading` |
| *"I have a 3pm meeting tomorrow with a difficult client. Should I move it?"* | `asktian_best_time_for_action` |
| *"My partner is born 1990-08-22 and I'm 1992-05-15. How are we as a couple?"* | `asktian_compatibility` |
| *"What kind of day is it today?"* | `asktian_today_energy` |
| *"Is 'Aurora' a good name for my startup?"* | `asktian_name_analysis` |
| *"Best week to launch my product? My birthdate is..."* | `asktian_best_time_for_action` |
| *"Should I propose to my partner this month? Mine 1992-05-15, theirs 1990-08-22."* | `asktian_best_time_for_action` + `asktian_compatibility` |

The agent's response in each case becomes specific and actionable instead of vague.

---

## Roadmap

- [ ] Direct integration with the full api.asktian.com endpoint catalogue (qimen, ziwei, almanac, fengshui, name-analysis traditional)
- [ ] Lucky places near me (Google Places integration)
- [ ] Tian-points / $TIAN token incentives for power use
- [ ] Tools for venue / business: "is this address auspicious for a cafe"
- [ ] Multi-tradition cross-reference (Western astrology, Vedic, I Ching) — same person, multiple lenses

PRs welcome. The lib/ folder is intentionally self-contained for clean npm distribution.

---

## Links

- **Web app:** [play.asktian.com](https://play.asktian.com) *(coming soon)*
- **API key (runs on TIAN Points):** [api.asktian.com](https://api.asktian.com)
- **$TIAN token + wallet:** [wallet.asktian.com](https://wallet.asktian.com)
- **Source:** [github.com/douglasgan/asktian-mcp](https://github.com/douglasgan/asktian-mcp)

---

## License

MIT — use it anywhere, fork it, ship it inside your own product.
The asktian protocol is meant to be public infrastructure.

不知道就问天.
