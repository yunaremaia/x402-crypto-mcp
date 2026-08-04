/**
 * x402 Crypto MCP Server
 * Aggregates 3 x402 services (price, sentiment, indicators) as MCP tools.
 * Agents call these tools; the MCP server forwards to the x402 services.
 * NOTE: x402 payment must be handled by the calling agent (this server
 * returns the 402 challenge — the agent pays and retries).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
declare const SERVICES: {
    readonly price: "https://multi-chain-price-oracle.vercel.app/entrypoints/price/invoke";
    readonly sentiment: "https://crypto-market-sentiment.vercel.app/entrypoints/sentiment/invoke";
    readonly funding: "https://crypto-market-sentiment.vercel.app/entrypoints/funding/invoke";
    readonly indicators: "https://technical-indicators-oracle.vercel.app/entrypoints/indicators/invoke";
    readonly yields: "https://defi-yield-aggregator.vercel.app/entrypoints/yields/invoke";
};
declare function invokeX402(url: string, input: Record<string, any>): Promise<{
    status: number;
    body: any;
}>;
declare const server: McpServer;
export { server, invokeX402, SERVICES };
