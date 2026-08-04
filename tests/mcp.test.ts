import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeX402, SERVICES } from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("invokeX402", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns status and body from successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ output: { prices: { BTC: { usd: 65000 } } } }),
    });
    const { status, body } = await invokeX402(SERVICES.price, { symbols: ["BTC"] });
    expect(status).toBe(200);
    expect(body.output.prices.BTC.usd).toBe(65000);
    expect(mockFetch.mock.calls[0][0]).toContain("multi-chain-price-oracle");
  });

  it("returns 402 with payment requirements", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 402,
      json: async () => ({
        error: "X-PAYMENT header is required",
        accepts: [{ payTo: "0x61090C6e", maxAmountRequired: "1000" }],
      }),
    });
    const { status, body } = await invokeX402(SERVICES.price, { symbols: ["BTC"] });
    expect(status).toBe(402);
    expect(body.accepts[0].payTo).toContain("0x61090C6e");
  });

  it("handles fetch errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));
    const { status, body } = await invokeX402(SERVICES.price, { symbols: ["BTC"] });
    expect(status).toBe(0);
    expect(body).toBeDefined();
  });
});

describe("SERVICES", () => {
  it("has all 4 service URLs", () => {
    expect(SERVICES.price).toContain("multi-chain-price-oracle");
    expect(SERVICES.sentiment).toContain("crypto-market-sentiment");
    expect(SERVICES.funding).toContain("crypto-market-sentiment");
    expect(SERVICES.indicators).toContain("technical-indicators-oracle");
  });
});
