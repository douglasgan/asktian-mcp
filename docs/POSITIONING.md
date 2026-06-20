# askTIAN — the decision layer for AI agents

> One-pager for developers, partners, and platform listings.
> 不知道就问天 · *When you don't know, ask tian.*

## The problem: AI agents won't commit

Ask any LLM a real decision — *"When should I send this? Is this the right hire? Should we launch Thursday?"* — and you get a hedge:

> *"It depends on several factors. Consider your timezone, weigh the trade-offs, and trust your judgment…"*

Technically safe. Completely useless. Agents that never take a position can't actually **decide** anything — which is the one thing a user delegating to an agent actually wants.

## The insight: agents are getting a stack — and decisions are the missing layer

The agent stack is filling in, one callable layer at a time:

| Layer | Example |
|---|---|
| Search | Exa, Tavily |
| Memory | Mem0, Zep |
| Payments | x402, Stripe |
| Browsing | Playwright MCP |
| **Decisions** | **askTIAN** ← the missing one |

askTIAN is the layer that gives an agent a **stance** — a specific, falsifiable, characterful call instead of mush.

## What it is

An **MCP server** — 6 tools any MCP-compatible agent (Claude, Cursor, Windsurf, Zed, LangChain, LlamaIndex…) can call. It turns 4,000 years of Chinese metaphysics (bazi 八字, the daily almanac 干支, five-element 五行 relations) into structured decision signals:

- `asktian_best_time_for_action` — *when* to do X
- `asktian_compatibility` — does this pairing fit
- `asktian_today_energy` / `asktian_daily_reading` — the day's real almanac (auspicious / inauspicious activities, lucky directions, fortune)
- `asktian_name_analysis` — a name's profile
- `asktian_market_read` — an uncorrelated yes/no signal (entertainment)

**Real readings, no key, 1-line install.** `npx -y @asktian/mcp-server`. Free + rate-limited; an optional key raises limits and unlocks a premium tier.

## Why it's different (the honest wedge)

We don't claim to out-predict GPT — that's unwinnable and beside the point. askTIAN sells three things no general LLM gives you:

1. **Decisiveness** — a concrete call (*"Thursday clashes, score 38 — wait for Tuesday, score 94"*), not "it depends."
2. **A point of view** — agents get a distinctive voice and cultural depth instead of generic hedging.
3. **Falsifiability** — deterministic, published, scoreable over time. *Pattern science, not mysticism.*

## Concrete use cases

- **Scheduling / calendar agents** → auspicious-day picking is genuinely used across Chinese & SEA cultures for weddings, moving, signings, launches. A real, non-novelty utility.
- **Matchmaking / dating / social agents** → compatibility as a fun, characterful signal.
- **Entertainment & companion agents** → a daily reading gives an agent ritual and personality.
- **Prediction-market / crypto agents** → `market_read` as an uncorrelated novelty signal.

## Why now

The MCP standard just made "plug a tool into any agent" a 1-line operation. The agent ecosystem is racing to assemble its stack. Cultural authenticity (4,000 years, not a GPT wrapper) is a moat a generic tool can't copy.

## Try it

```bash
npx -y @asktian/mcp-server     # or add to Claude/Cursor/LangChain — see docs/quickstart.md
```

- npm: [`@asktian/mcp-server`](https://www.npmjs.com/package/@asktian/mcp-server)
- MCP registry: `io.github.douglasgan/asktian`
- Site: [asktian.com/agents](https://asktian.com/agents) · Live demo: [asktian.com/read](https://asktian.com/read)
