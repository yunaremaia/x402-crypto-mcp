/**
 * x402 Crypto MCP Server — STDIO Transport
 * Aggregates 9 x402 crypto services as MCP tools.
 * Agents call these tools; the MCP server forwards to the x402 services.
 * NOTE: x402 payment must be handled by the calling agent (this server
 * returns the 402 challenge — the agent pays and retries).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { toolSchemas, stdioToolNames, SERVICES, invokeX402, safeText, paymentRequiredMessage } from "./tools/index.js";

// ── MCP Server ──
const server = new McpServer({
  name: "x402-crypto",
  version: "1.1.3",
});

// Register all stdio tools from shared definitions
for (const toolName of stdioToolNames) {
  const def = toolSchemas[toolName];
  if (!def) continue;

  if (toolName === "market_overview") {
    // Special case: combines multiple services
    server.tool(toolName, def.description, def.schema, async () => {
      const [prices, sentiment, funding] = await Promise.all([
        invokeX402(SERVICES.price, { symbols: ["BTC", "ETH", "SOL"] }),
        invokeX402(SERVICES.sentiment, {}),
        invokeX402(SERVICES.funding, { symbol: "BTC" }),
      ]);
      const overview = {
        prices: prices.body.output ?? prices.body,
        sentiment: sentiment.body.output ?? sentiment.body,
        funding: funding.body.output ?? funding.body,
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(overview, null, 2),
          },
        ],
      };
    });
    continue;
  }

  const serviceUrl = SERVICES[def.service as keyof typeof SERVICES];
  const transform = def.transform;

  server.tool(toolName, def.description, def.schema, async (input: any) => {
    const { status, body } = await invokeX402(serviceUrl, transform(input));
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: paymentRequiredMessage(body),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: safeText(body),
        },
      ],
    };
  });
}

// ── Start ──
const transport = new StdioServerTransport();
await server.connect(transport);

export { server, invokeX402, SERVICES, safeText };