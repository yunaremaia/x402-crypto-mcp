/**
 * x402 Crypto MCP Server — HTTP Transport (for Smithery/Vercel Node.js runtime)
 * Uses Streamable HTTP transport with Node.js adaptation
 */
import type { IncomingMessage, ServerResponse } from "http";
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
export declare const config: {
    runtime: string;
};
