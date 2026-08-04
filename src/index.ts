/**
 * x402 Crypto MCP Server
 * Aggregates 3 x402 services (price, sentiment, indicators) as MCP tools.
 * Agents call these tools; the MCP server forwards to the x402 services.
 * NOTE: x402 payment must be handled by the calling agent (this server
 * returns the 402 challenge — the agent pays and retries).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Service URLs ──
const SERVICES = {
  price: "https://multi-chain-price-oracle.vercel.app/entrypoints/price/invoke",
  sentiment: "https://crypto-market-sentiment.vercel.app/entrypoints/sentiment/invoke",
  funding: "https://crypto-market-sentiment.vercel.app/entrypoints/funding/invoke",
  indicators: "https://technical-indicators-oracle.vercel.app/entrypoints/indicators/invoke",
  yields: "https://defi-yield-aggregator.vercel.app/entrypoints/yields/invoke",
} as const;

// ── Forward to x402 service ──
async function invokeX402(
  url: string,
  input: Record<string, any>,
): Promise<{ status: number; body: any }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const body = await res.json().catch(() => ({ raw: res.statusText }));
    return { status: res.status, body };
  } catch (err: any) {
    return { status: 0, body: { error: err?.message ?? "fetch failed" } };
  }
}

// ── MCP Server ──
const server = new McpServer({
  name: "x402-crypto",
  version: "1.0.0",
});

// Tool 1: Crypto Prices
server.tool(
  "crypto_prices",
  "Get live USD prices for crypto tokens (BTC, ETH, SOL, USDC, etc.). Returns current price in USD. Free data from CoinGecko with 60s cache.",
  {
    symbols: z
      .array(z.string().max(10))
      .min(1)
      .max(20)
      .describe("Token symbols, e.g. ['BTC', 'ETH', 'SOL']"),
  },
  async ({ symbols }) => {
    const { status, body } = await invokeX402(SERVICES.price, { symbols });
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base, then set X-PAYMENT header.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  },
);

// Tool 2: Market Sentiment
server.tool(
  "market_sentiment",
  "Get crypto market sentiment: Fear & Greed index (0-100) + global market metrics (total cap, BTC/ETH dominance).",
  {},
  async () => {
    const { status, body } = await invokeX402(SERVICES.sentiment, {});
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  },
);

// Tool 3: Funding Rate
server.tool(
  "funding_rate",
  "Get perp funding rate for a crypto symbol from Binance USDT futures. Positive = longs pay shorts (bullish bias).",
  {
    symbol: z.string().min(1).max(12).describe("Base symbol: BTC, ETH, SOL, etc."),
  },
  async ({ symbol }) => {
    const { status, body } = await invokeX402(SERVICES.funding, { symbol });
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  },
);

// Tool 4: Technical Indicators
server.tool(
  "technical_indicators",
  "Get technical analysis indicators: RSI(7/14), MACD, EMA(20/50), SMA(20/50), volatility, ATR + trend/momentum signals. From Binance klines.",
  {
    symbol: z.string().min(1).max(12).describe("Base symbol: BTC, ETH, SOL, etc."),
    interval: z
      .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
      .default("1h")
      .describe("Kline interval"),
  },
  async ({ symbol, interval }) => {
    const { status, body } = await invokeX402(SERVICES.indicators, {
      symbol,
      interval,
    });
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  },
);

// Tool 5: Bundle — price + sentiment + funding in one call
server.tool(
  "market_overview",
  "Quick market overview: BTC/ETH/SOL prices + Fear & Greed + BTC funding rate in one combined call.",
  {},
  async () => {
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
  },
);

// Tool 6: DeFi Yields
server.tool(
  "defi_yields",
  "Get top DeFi yields across 40+ chains (DeFiLlama, 15,000+ pools). Filter by chain, project, symbol, min APY, min TVL, stablecoins.",
  {
    chain: z.string().max(30).optional().describe("Chain: Ethereum, Arbitrum, Solana, Base..."),
    project: z.string().max(50).optional().describe("Protocol: lido, aave, uniswap..."),
    symbol: z.string().max(20).optional().describe("Token symbol: USDC, ETH, SOL..."),
    minApy: z.number().optional().describe("Minimum APY percentage"),
    minTvl: z.number().optional().describe("Minimum TVL in USD"),
    stablecoins: z.boolean().optional().describe("Only stablecoin pools"),
    limit: z.number().max(50).default(10).describe("Max results (1-50)"),
  },
  async ({ chain, project, symbol, minApy, minTvl, stablecoins, limit }) => {
    const input: Record<string, any> = { limit };
    if (chain) input.chain = chain;
    if (project) input.project = project;
    if (symbol) input.symbol = symbol;
    if (minApy != null) input.minApy = minApy;
    if (minTvl != null) input.minTvl = minTvl;
    if (stablecoins != null) input.stablecoins = stablecoins;
    const { status, body } = await invokeX402(SERVICES.yields, input);
    if (status === 402) {
      return {
        content: [
          {
            type: "text" as const,
            text: `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  },
);

// ── Start ──
const transport = new StdioServerTransport();
await server.connect(transport);

export { server, invokeX402, SERVICES };
