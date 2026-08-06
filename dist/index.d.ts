/**
 * x402 Crypto MCP Server — STDIO Transport
 * Aggregates 9 x402 crypto services as MCP tools.
 * Agents call these tools; the MCP server forwards to the x402 services.
 * NOTE: x402 payment must be handled by the calling agent (this server
 * returns the 402 challenge — the agent pays and retries).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVICES, invokeX402, safeText } from "./tools/index.js";
declare const server: McpServer;
export { server, invokeX402, SERVICES, safeText };
