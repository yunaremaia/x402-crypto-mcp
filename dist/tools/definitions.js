/**
 * Shared tool definitions for x402-crypto-mcp.
 * Single source of truth for both stdio and HTTP transports.
 */
import { z } from "zod";
export const SERVICES = {
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
};
// Tool input schemas (Zod) - shared between both transports
export const toolSchemas = {
    crypto_prices: {
        description: "Get live USD prices for crypto tokens (BTC, ETH, SOL, USDC, etc.). Returns current price in USD. Free data from CoinGecko with 60s cache.",
        schema: {
            symbols: z.array(z.string().max(10)).min(1).max(20).describe("Token symbols, e.g. ['BTC', 'ETH', 'SOL']"),
        },
        service: "price",
        transform: (input) => ({ symbols: input.symbols }),
    },
    market_sentiment: {
        description: "Get crypto market sentiment: Fear & Greed index (0-100) + global market metrics (total cap, BTC/ETH dominance).",
        schema: {},
        service: "sentiment",
        transform: () => ({}),
    },
    funding_rate: {
        description: "Get perp funding rate for a crypto symbol from Binance USDT futures. Positive = longs pay shorts (bullish bias).",
        schema: {
            symbol: z.string().min(1).max(12).describe("Base symbol: BTC, ETH, SOL, etc."),
        },
        service: "funding",
        transform: (input) => ({ symbol: input.symbol }),
    },
    technical_indicators: {
        description: "Get technical analysis indicators: RSI(7/14), MACD, EMA(20/50), SMA(20/50), volatility, ATR + trend/momentum signals. From Binance klines.",
        schema: {
            symbol: z.string().min(1).max(12).describe("Base symbol: BTC, ETH, SOL, etc."),
            interval: z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]).default("1h").describe("Kline interval"),
        },
        service: "indicators",
        transform: (input) => ({ symbol: input.symbol, interval: input.interval || "1h" }),
    },
    market_overview: {
        description: "Quick market overview: BTC/ETH/SOL prices + Fear & Greed + BTC funding rate in one combined call.",
        schema: {},
        service: null, // special: calls multiple services
        transform: () => ({}),
    },
    defi_yields: {
        description: "Get top DeFi yields across 40+ chains (DeFiLlama, 15,000+ pools). Filter by chain, project, symbol, min APY, min TVL, stablecoins.",
        schema: {
            chain: z.string().max(30).optional().describe("Chain: Ethereum, Arbitrum, Solana, Base..."),
            project: z.string().max(50).optional().describe("Protocol: lido, aave, uniswap..."),
            symbol: z.string().max(20).optional().describe("Token symbol: USDC, ETH, SOL..."),
            minApy: z.number().optional().describe("Minimum APY percentage"),
            minTvl: z.number().optional().describe("Minimum TVL in USD"),
            stablecoins: z.boolean().optional().describe("Only stablecoin pools"),
            limit: z.number().max(50).default(10).describe("Max results (1-50)"),
        },
        service: "yields",
        transform: (input) => {
            const out = { limit: input.limit || 10 };
            if (input.chain)
                out.chain = input.chain;
            if (input.project)
                out.project = input.project;
            if (input.symbol)
                out.symbol = input.symbol;
            if (input.minApy != null)
                out.minApy = input.minApy;
            if (input.minTvl != null)
                out.minTvl = input.minTvl;
            if (input.stablecoins != null)
                out.stablecoins = input.stablecoins;
            return out;
        },
    },
    gas_price: {
        description: "Get current gas price on an EVM chain. Returns gwei and wei values.",
        schema: {
            chain: z.string().min(1).max(20).describe("Chain: ethereum, base, arbitrum, optimism, polygon, bsc, avalanche"),
        },
        service: "gas",
        transform: (input) => ({ chain: input.chain }),
    },
    yield_pool_metrics: {
        description: "Get APY/TVL metrics for Aave V3 and Uniswap V3 pools. Returns pool snapshots with APY, TVL, and 24h deltas.",
        schema: {
            protocols: z.array(z.enum(["aave-v3", "uniswap-v3"])).optional().describe("Protocols to query (default: both)"),
            pool_ids: z.array(z.string()).optional().describe("Optional pool IDs to filter"),
        },
        service: "pool_metrics",
        transform: (input) => {
            const out = {};
            if (input.protocols)
                out.protocols = input.protocols;
            if (input.pool_ids)
                out.pool_ids = input.pool_ids;
            return out;
        },
    },
    fresh_markets: {
        description: "List new AMM pairs/pools created in the last N minutes (Uniswap V2, PancakeSwap, SushiSwap factories). For discovery bots and yield scouts.",
        schema: {
            chain: z.enum(["ethereum", "bsc", "all"]).optional().describe("Chain to scan (default: all)"),
            window_minutes: z.number().int().min(1).max(60).optional().describe("Time window in minutes (default: 5)"),
            limit: z.number().int().min(1).max(50).optional().describe("Max pairs to return (default: 20)"),
        },
        service: "new_pairs",
        transform: (input) => {
            const out = {};
            if (input.chain)
                out.chain = input.chain;
            if (input.window_minutes)
                out.window_minutes = input.window_minutes;
            if (input.limit)
                out.limit = input.limit;
            return out;
        },
    },
    // HTTP-only tools (different parameter names for HTTP transport)
    get_price: {
        description: "Get current price for any token on supported chains via x402",
        schema: {
            token: z.string(),
            chain: z.string().optional(),
            network: z.enum(["base", "ethereum", "arbitrum", "optimism", "polygon", "bsc", "avalanche", "solana"]).optional(),
        },
        service: "price",
        transform: (input) => ({ symbols: [input.token] }), // map token -> symbols array
    },
    get_market_sentiment: {
        description: "Fear & Greed Index (Alternative.me) via x402",
        schema: {},
        service: "sentiment",
        transform: () => ({}),
    },
    get_funding_rates: {
        description: "Perpetual funding rates across exchanges via x402",
        schema: {
            symbol: z.string().optional(),
            exchange: z.string().optional(),
        },
        service: "funding",
        transform: (input) => ({ symbol: input.symbol || "BTC" }),
    },
    get_technical_indicators: {
        description: "RSI, MACD, EMA, SMA for any symbol/timeframe via x402",
        schema: {
            symbol: z.string(),
            timeframe: z.string().optional(),
            indicators: z.array(z.string()).optional(),
        },
        service: "indicators",
        transform: (input) => ({ symbol: input.symbol, interval: input.timeframe || "1h" }),
    },
    get_defi_yields: {
        description: "Supply/borrow APY across protocols (Aave, Compound, Morpho, etc.) via x402",
        schema: {
            chain: z.string().optional(),
            protocol: z.string().optional(),
            min_tvl: z.number().optional(),
            min_apy: z.number().optional(),
        },
        service: "yields",
        transform: (input) => {
            const out = { limit: 10 };
            if (input.chain)
                out.chain = input.chain;
            if (input.protocol)
                out.project = input.protocol;
            if (input.min_tvl)
                out.minTvl = input.min_tvl;
            if (input.min_apy)
                out.minApy = input.min_apy;
            return out;
        },
    },
    get_gas_price: {
        description: "EIP-1559 gas fees for EVM chains via x402",
        schema: {
            chain: z.string().optional(),
        },
        service: "gas",
        transform: (input) => ({ chain: input.chain || "ethereum" }),
    },
    get_multi_chain_gas: {
        description: "Gas prices for multiple EVM chains at once via x402",
        schema: {
            chains: z.array(z.string()).optional(),
        },
        service: "gas_multi",
        transform: (input) => ({ chains: input.chains || ["ethereum", "base", "arbitrum", "optimism", "polygon", "bsc", "avalanche"] }),
    },
    get_pool_metrics: {
        description: "Yield pool APY/TVL/fee metrics across DEXes via x402",
        schema: {
            chain: z.string().optional(),
            dex: z.string().optional(),
            min_apy: z.number().optional(),
            min_tvl: z.number().optional(),
        },
        service: "pool_metrics",
        transform: (input) => {
            const out = {};
            if (input.chain)
                out.chain = input.chain;
            if (input.dex)
                out.dex = input.dex;
            if (input.min_apy)
                out.minApy = input.min_apy;
            if (input.min_tvl)
                out.minTvl = input.min_tvl;
            return out;
        },
    },
    get_pool_alerts: {
        description: "Pool alerts (APY spikes, new pools, TVL changes) via x402",
        schema: {
            chain: z.string().optional(),
            alert_type: z.string().optional(),
        },
        service: "pool_alerts",
        transform: (input) => {
            const out = {};
            if (input.chain)
                out.chain = input.chain;
            if (input.alert_type)
                out.alert_type = input.alert_type;
            return out;
        },
    },
    scan_new_pairs: {
        description: "Discover new AMM pairs on DEXes via x402",
        schema: {
            chain: z.string().optional(),
            dex: z.string().optional(),
            min_liquidity: z.number().optional(),
        },
        service: "new_pairs",
        transform: (input) => {
            const out = {};
            if (input.chain)
                out.chain = input.chain;
            if (input.dex)
                out.dex = input.dex;
            if (input.min_liquidity)
                out.min_liquidity = input.min_liquidity;
            return out;
        },
    },
};
// Helper to get stdio tool names (original naming)
export const stdioToolNames = [
    "crypto_prices",
    "market_sentiment",
    "funding_rate",
    "technical_indicators",
    "market_overview",
    "defi_yields",
    "gas_price",
    "yield_pool_metrics",
    "fresh_markets",
];
// Helper to get HTTP tool names (HTTP naming convention)
export const httpToolNames = [
    "get_price",
    "get_market_sentiment",
    "get_funding_rates",
    "get_technical_indicators",
    "get_defi_yields",
    "get_gas_price",
    "get_multi_chain_gas",
    "get_pool_metrics",
    "get_pool_alerts",
    "scan_new_pairs",
];
// Map stdio tool names to their HTTP equivalents
export const stdioToHttpMap = {
    crypto_prices: "get_price",
    market_sentiment: "get_market_sentiment",
    funding_rate: "get_funding_rates",
    technical_indicators: "get_technical_indicators",
    defi_yields: "get_defi_yields",
    gas_price: "get_gas_price",
    yield_pool_metrics: "get_pool_metrics",
    fresh_markets: "scan_new_pairs",
    // market_overview has no direct HTTP equivalent
};
// Map HTTP tool names to their stdio equivalents
export const httpToStdioMap = {
    get_price: "crypto_prices",
    get_market_sentiment: "market_sentiment",
    get_funding_rates: "funding_rate",
    get_technical_indicators: "technical_indicators",
    get_defi_yields: "defi_yields",
    get_gas_price: "gas_price",
    get_multi_chain_gas: "gas_price", // no direct stdio equivalent
    get_pool_metrics: "yield_pool_metrics",
    get_pool_alerts: "yield_pool_metrics", // no direct stdio equivalent
    scan_new_pairs: "fresh_markets",
};
