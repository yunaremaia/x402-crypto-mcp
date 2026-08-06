/**
 * x402 Crypto MCP Server — HTTP Transport (for Smithery/Vercel Node.js runtime)
 * Uses Streamable HTTP transport with Node.js adaptation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const SERVICES = {
  price: "https://multi-chain-price-oracle.vercel.app/entrypoints/price/invoke",
  sentiment: "https://crypto-market-sentiment.vercel.app/entrypoints/sentiment/invoke",
  funding: "https://crypto-market-sentiment.vercel.app/entrypoints/funding/invoke",
  indicators: "https://technical-indicators-oracle.vercel.app/entrypoints/indicators/invoke",
  yields: "https://defi-yield-aggregator.vercel.app/entrypoints/yields/invoke",
  gas: "https://multi-chain-gas-oracle.vercel.app/entrypoints/gas/invoke",
  gas_multi: "https://multi-chain-gas-oracle.vercel.app/entrypoints/gas_multi/invoke",
  pool_metrics: "https://yield-pool-watcher-five.vercel.app/entrypoints/metrics/invoke",
  pool_alerts: "https://yield-pool-watcher-five.vercel.app/entrypoints/alerts/invoke",
  new_pairs: "https://fresh-markets-watch.vercel.app/entrypoints/scan/invoke",
} as const;

async function invokeX402(url: string, input: Record<string, any>): Promise<{ status: number; body: any }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const body = await res.json().catch(() => ({ raw: res.statusText }));
    return { status: res.status, body };
  } catch (e: any) {
    return { status: 502, body: { error: e.message } };
  }
}

const server = new McpServer({ name: "x402-crypto-mcp", version: "1.1.2" });

server.registerTool("get_price", {
  title: "Get Token Price",
  description: "Get current price for any token on supported chains via x402",
  inputSchema: { token: z.string(), chain: z.string().optional(), network: z.enum(["base", "ethereum", "arbitrum", "optimism", "polygon", "bsc", "avalanche", "solana"]).optional() },
}, async ({ token, chain, network }) => {
  const result = await invokeX402(SERVICES.price, { token, chain, network });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_market_sentiment", {
  title: "Get Market Sentiment",
  description: "Fear & Greed Index (Alternative.me) via x402",
  inputSchema: {},
}, async () => {
  const result = await invokeX402(SERVICES.sentiment, {});
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_funding_rates", {
  title: "Get Funding Rates",
  description: "Perpetual funding rates across exchanges via x402",
  inputSchema: { symbol: z.string().optional(), exchange: z.string().optional() },
}, async ({ symbol, exchange }) => {
  const result = await invokeX402(SERVICES.funding, { symbol, exchange });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_technical_indicators", {
  title: "Get Technical Indicators",
  description: "RSI, MACD, EMA, SMA for any symbol/timeframe via x402",
  inputSchema: { symbol: z.string(), timeframe: z.string().optional(), indicators: z.array(z.string()).optional() },
}, async ({ symbol, timeframe, indicators }) => {
  const result = await invokeX402(SERVICES.indicators, { symbol, timeframe, indicators });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_defi_yields", {
  title: "Get DeFi Yields",
  description: "Supply/borrow APY across protocols (Aave, Compound, Morpho, etc.) via x402",
  inputSchema: { chain: z.string().optional(), protocol: z.string().optional(), min_tvl: z.number().optional(), min_apy: z.number().optional() },
}, async ({ chain, protocol, min_tvl, min_apy }) => {
  const result = await invokeX402(SERVICES.yields, { chain, protocol, min_tvl, min_apy });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_gas_price", {
  title: "Get Gas Price",
  description: "EIP-1559 gas fees for EVM chains via x402",
  inputSchema: { chain: z.string().optional() },
}, async ({ chain }) => {
  const result = await invokeX402(SERVICES.gas, { chain });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_multi_chain_gas", {
  title: "Get Multi-Chain Gas",
  description: "Gas prices for multiple EVM chains at once via x402",
  inputSchema: { chains: z.array(z.string()).optional() },
}, async ({ chains }) => {
  const result = await invokeX402(SERVICES.gas_multi, { chains });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_pool_metrics", {
  title: "Get Pool Metrics",
  description: "Yield pool APY/TVL/fee metrics across DEXes via x402",
  inputSchema: { chain: z.string().optional(), dex: z.string().optional(), min_apy: z.number().optional(), min_tvl: z.number().optional() },
}, async ({ chain, dex, min_apy, min_tvl }) => {
  const result = await invokeX402(SERVICES.pool_metrics, { chain, dex, min_apy, min_tvl });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("get_pool_alerts", {
  title: "Get Pool Alerts",
  description: "Pool alerts (APY spikes, new pools, TVL changes) via x402",
  inputSchema: { chain: z.string().optional(), alert_type: z.string().optional() },
}, async ({ chain, alert_type }) => {
  const result = await invokeX402(SERVICES.pool_alerts, { chain, alert_type });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

server.registerTool("scan_new_pairs", {
  title: "Scan New Pairs",
  description: "Discover new AMM pairs on DEXes via x402",
  inputSchema: { chain: z.string().optional(), dex: z.string().optional(), min_liquidity: z.number().optional() },
}, async ({ chain, dex, min_liquidity }) => {
  const result = await invokeX402(SERVICES.new_pairs, { chain, dex, min_liquidity });
  return { content: [{ type: "text", text: JSON.stringify(result.body, null, 2) }] };
});

// ── Vercel Serverless Handler (Node.js) ──
import type { IncomingMessage, ServerResponse } from "http";

const transports: Record<string, StreamableHTTPServerTransport> = {};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const sessionId = req.headers["mcp-session-id"] as string ?? "default";
  
  let transport = transports[sessionId];
  if (!transport) {
    transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => sessionId });
    transports[sessionId] = transport;
    await server.connect(transport);
  }
  
  // Parse body for POST
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  const parsedBody = body ? JSON.parse(body) : undefined;
  
  transport.handleRequest(req, res, parsedBody);
}

export const config = { runtime: "nodejs20.x" };