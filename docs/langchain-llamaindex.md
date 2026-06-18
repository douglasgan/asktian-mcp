# Use askTIAN in LangChain & LlamaIndex

askTIAN ships an MCP server. Both LangChain and LlamaIndex have **native MCP adapters**, so you
get all 5 askTIAN tools (`daily_reading`, `best_time_for_action`, `compatibility`,
`today_energy`, `name_analysis`) in your agent with **no custom integration code** — just point
the adapter at the askTIAN MCP endpoint.

There are two ways to connect:

| Transport | Endpoint | Best for |
|---|---|---|
| **Streamable-HTTP** (recommended) | `https://mcp.asktian.com/mcp` | hosted agents, per-session auth headers |
| **stdio** (local) | `npx -y @asktian/mcp-server` | local dev, single-user |

> **Auth:** pass your askTIAN API key as a Bearer header (HTTP) or `ASKTIAN_API_KEY` env (stdio).
> Without a key the tools still work in local-fallback mode. Free keys: https://api.asktian.com
> TIAN Points (billing): https://wallet.asktian.com

---

## LangChain (Python)

Uses [`langchain-mcp-adapters`](https://github.com/langchain-ai/langchain-mcp-adapters).
Only `http`/`sse` transports carry runtime auth headers — use the hosted HTTP endpoint.

```bash
pip install langchain-mcp-adapters langgraph "langchain[anthropic]"
```

```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

async def main():
    client = MultiServerMCPClient({
        "asktian": {
            "transport": "streamable_http",
            "url": "https://mcp.asktian.com/mcp",
            "headers": {"Authorization": "Bearer YOUR_ASKTIAN_API_KEY"},  # optional
        }
    })

    tools = await client.get_tools()  # → all 5 askTIAN tools as LangChain tools
    agent = create_react_agent("anthropic:claude-sonnet-4-6", tools)

    res = await agent.ainvoke({
        "messages": [{"role": "user",
                      "content": "I was born 1992-05-15. When's the best day this week "
                                 "to have a hard conversation with my boss?"}]
    })
    print(res["messages"][-1].content)

asyncio.run(main())
```

### Local stdio variant (no hosted endpoint)
```python
client = MultiServerMCPClient({
    "asktian": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@asktian/mcp-server"],
        "env": {"ASKTIAN_API_KEY": "YOUR_ASKTIAN_API_KEY"},  # optional
    }
})
```

---

## LlamaIndex (Python)

Uses [`llama-index-tools-mcp`](https://developers.llamaindex.ai/python/framework/module_guides/mcp/).
`BasicMCPClient` supports Bearer headers and OAuth.

```bash
pip install llama-index-tools-mcp llama-index
```

```python
import asyncio
from llama_index.tools.mcp import BasicMCPClient, McpToolSpec
from llama_index.core.agent.workflow import FunctionAgent
from llama_index.llms.anthropic import Anthropic

async def main():
    mcp_client = BasicMCPClient(
        "https://mcp.asktian.com/mcp",
        headers={"Authorization": "Bearer YOUR_ASKTIAN_API_KEY"},  # optional
    )
    tools = await McpToolSpec(client=mcp_client).to_tool_list_async()  # → 5 askTIAN tools

    agent = FunctionAgent(
        tools=tools,
        llm=Anthropic(model="claude-sonnet-4-6"),
        system_prompt="You help users with timing and compatibility decisions using askTIAN.",
    )

    print(await agent.run("Is Aurora a good name for a startup? And what's today's energy?"))

asyncio.run(main())
```

---

## Notes & gotchas

- **HTTP 402 / billing:** paid tools return a `402`-style error when an account is out of TIAN
  Points. Surface it to the agent as a tool error (it won't crash) — the agent can tell the user
  to top up at wallet.asktian.com. `today_energy` and `name_analysis` are always free.
- **Two tools are free, three cost points** — see the main [README](../README.md#the-5-tools).
- **Don't cache the key in the browser.** Keep `ASKTIAN_API_KEY` server-side.
- **Self-hosting the HTTP server:** `ASKTIAN_MCP_HTTP=1 PORT=8080 npx @asktian/mcp-server`
  (or `npm run start:http` from source) exposes the same endpoint at `:8080/mcp`.
