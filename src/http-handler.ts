/**
 * x402 Crypto MCP Server — HTTP Transport (for Smithery/Vercel Node.js runtime)
 * Uses Streamable HTTP transport with Node.js adaptation
 * Tool definitions are shared from src/tools/definitions.ts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toolSchemas, httpToolNames, SERVICES, invokeX402, safeText, paymentRequiredMessage } from "./tools/index.js";
import { z } from "zod";

// ── MCP Server ──
const server = new McpServer({ name: "x402-crypto-mcp", version: "1.1.3" });

// Register all HTTP tools from shared definitions
for (const toolName of httpToolNames) {
  const def = toolSchemas[toolName];
  if (!def) continue;

  const serviceUrl = SERVICES[def.service as keyof typeof SERVICES];
  const transform = def.transform;

  // Convert schema object to ZodRawShape for registerTool
  const zodSchema = z.object(def.schema);

  // @ts-ignore - dynamic schema
  server.registerTool(toolName, {
    title: toolName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase()),
    description: def.description,
    inputSchema: zodSchema,
  }, async (input: any) => {
    const { status, body } = await invokeX402(serviceUrl, transform(input));
    if (status === 402) {
      return {
        content: [
          {
            type: "text",
            text: paymentRequiredMessage(body),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(body.output ?? body, null, 2),
        },
      ],
    };
  });
}

// ── Vercel Serverless Handler (Node.js) ──
import type { IncomingMessage, ServerResponse } from "http";

const transports: Record<string, StreamableHTTPServerTransport> = {};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const sessionId = (req.headers["mcp-session-id"] as string) ?? "default";

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