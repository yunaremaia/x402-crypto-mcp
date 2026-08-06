import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeX402, SERVICES, safeText, paymentRequiredMessage, toolSchemas, stdioToolNames, httpToolNames } from "../src/tools/index.js";

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
  it("has all 10 service URLs", () => {
    expect(SERVICES.price).toContain("multi-chain-price-oracle");
    expect(SERVICES.sentiment).toContain("crypto-market-sentiment");
    expect(SERVICES.funding).toContain("crypto-market-sentiment");
    expect(SERVICES.indicators).toContain("technical-indicators-oracle");
    expect(SERVICES.yields).toContain("defi-yield-aggregator");
    expect(SERVICES.gas).toContain("multi-chain-gas-oracle");
    expect(SERVICES.gas_multi).toContain("multi-chain-gas-oracle");
    expect(SERVICES.pool_metrics).toContain("yield-pool-watcher-five");
    expect(SERVICES.pool_alerts).toContain("yield-pool-watcher-five");
    expect(SERVICES.new_pairs).toContain("fresh-markets-watch");
  });
});

describe("safeText", () => {
  it("keeps small payloads unchanged", () => {
    const small = { output: { ok: true } };
    const text = safeText(small);
    expect(text).toContain('"ok"');
    expect(text).not.toContain("TRUNCATED");
  });

  it("truncates oversized payloads with a marker", () => {
    const big = { output: { data: "x".repeat(400_000) } };
    const text = safeText(big);
    expect(text.length).toBeLessThan(200_000);
    expect(text).toContain("TRUNCATED");
    expect(text).toContain("use limit/filters");
  });

  it("handles string bodies", () => {
    expect(safeText("hello")).toBe('"hello"');
  });
});

describe("paymentRequiredMessage", () => {
  it("formats payment message correctly", () => {
    const body = {
      accepts: [{ payTo: "0x61090C6e6fbdaee9d695c6d164a3ead268aea4ac", maxAmountRequired: "1000" }],
    };
    const msg = paymentRequiredMessage(body);
    expect(msg).toContain("x402 payment required");
    expect(msg).toContain("1000 USDC");
    expect(msg).toContain("0x61090C6e");
  });
});

describe("toolSchemas", () => {
  it("has all stdio tool names defined", () => {
    for (const name of stdioToolNames) {
      expect(toolSchemas[name]).toBeDefined();
      expect(toolSchemas[name].description).toBeTruthy();
    }
  });

  it("has all HTTP tool names defined", () => {
    for (const name of httpToolNames) {
      expect(toolSchemas[name]).toBeDefined();
      expect(toolSchemas[name].description).toBeTruthy();
    }
  });

  it("crypto_prices has correct schema structure", () => {
    const def = toolSchemas.crypto_prices;
    expect(def.service).toBe("price");
    expect(def.transform).toBeDefined();
    const transformed = def.transform({ symbols: ["BTC", "ETH"] });
    expect(transformed.symbols).toEqual(["BTC", "ETH"]);
  });

  it("market_overview is special (no service)", () => {
    const def = toolSchemas.market_overview;
    expect(def.service).toBeNull();
  });

  it("HTTP get_price maps token to symbols array", () => {
    const def = toolSchemas.get_price;
    expect(def.service).toBe("price");
    const transformed = def.transform({ token: "BTC", chain: "ethereum" });
    expect(transformed.symbols).toEqual(["BTC"]);
  });

  it("HTTP get_defi_yields maps protocol to project", () => {
    const def = toolSchemas.get_defi_yields;
    expect(def.service).toBe("yields");
    const transformed = def.transform({ protocol: "aave", min_tvl: 1000000 });
    expect(transformed.project).toBe("aave");
    expect(transformed.minTvl).toBe(1000000);
  });

  it("HTTP get_multi_chain_gas uses gas_multi service", () => {
    const def = toolSchemas.get_multi_chain_gas;
    expect(def.service).toBe("gas_multi");
    const transformed = def.transform({ chains: ["ethereum", "base"] });
    expect(transformed.chains).toEqual(["ethereum", "base"]);
  });
});