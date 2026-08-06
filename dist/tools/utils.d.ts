/**
 * Shared utilities for x402-crypto-mcp.
 * Single source of truth for both stdio and HTTP transports.
 */
export declare function invokeX402(url: string, input: Record<string, any>): Promise<{
    status: number;
    body: any;
}>;
export declare function safeText(body: any): string;
export declare function paymentRequiredMessage(body: any): string;
