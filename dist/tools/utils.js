/**
 * Shared utilities for x402-crypto-mcp.
 * Single source of truth for both stdio and HTTP transports.
 */
// ── Forward to x402 service ──
export async function invokeX402(url, input) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ input }),
        });
        const body = await res.json().catch(() => ({ raw: res.statusText }));
        return { status: res.status, body };
    }
    catch (e) {
        return { status: 0, body: { error: String(e?.message ?? e) } };
    }
}
// ── Safe output formatting (prevents 413 "Request payload too large") ──
const MAX_TEXT = 150_000; // ~150KB per tool response, well under 4MB MCP limit
export function safeText(body) {
    let text;
    try {
        text = JSON.stringify(body?.output ?? body, null, 2);
    }
    catch {
        text = String(body);
    }
    if (text.length <= MAX_TEXT)
        return text;
    // Truncate smartly: keep head + tail with a marker
    const head = text.slice(0, Math.floor(MAX_TEXT * 0.6));
    const tail = text.slice(-Math.floor(MAX_TEXT * 0.3));
    return `${head}\n... [TRUNCATED by x402-crypto-mcp: ${text.length} chars -> use limit/filters to reduce] ...\n${tail}`;
}
// Standard x402 payment required message
export function paymentRequiredMessage(body) {
    return `x402 payment required. Pay ${body.accepts?.[0]?.maxAmountRequired} USDC to ${body.accepts?.[0]?.payTo} on Base.`;
}
