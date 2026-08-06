/**
 * Shared tool definitions for x402-crypto-mcp.
 * Single source of truth for both stdio and HTTP transports.
 */
import { z } from "zod";
export declare const SERVICES: {
    readonly price: "https://multi-chain-price-oracle.vercel.app/entrypoints/price/invoke";
    readonly sentiment: "https://crypto-market-sentiment.vercel.app/entrypoints/sentiment/invoke";
    readonly funding: "https://crypto-market-sentiment.vercel.app/entrypoints/funding/invoke";
    readonly indicators: "https://technical-indicators-oracle.vercel.app/entrypoints/indicators/invoke";
    readonly yields: "https://defi-yield-aggregator.vercel.app/entrypoints/yields/invoke";
    readonly gas: "https://multi-chain-gas-oracle.vercel.app/entrypoints/gas/invoke";
    readonly gas_multi: "https://multi-chain-gas-oracle.vercel.app/entrypoints/gas_multi/invoke";
    readonly pool_metrics: "https://yield-pool-watcher-five.vercel.app/entrypoints/metrics/invoke";
    readonly pool_alerts: "https://yield-pool-watcher-five.vercel.app/entrypoints/alerts/invoke";
    readonly new_pairs: "https://fresh-markets-watch.vercel.app/entrypoints/scan/invoke";
};
export declare const toolSchemas: {
    readonly crypto_prices: {
        readonly description: "Get live USD prices for crypto tokens (BTC, ETH, SOL, USDC, etc.). Returns current price in USD. Free data from CoinGecko with 60s cache.";
        readonly schema: {
            readonly symbols: z.ZodArray<z.ZodString, "many">;
        };
        readonly service: "price";
        readonly transform: (input: {
            symbols: string[];
        }) => {
            symbols: string[];
        };
    };
    readonly market_sentiment: {
        readonly description: "Get crypto market sentiment: Fear & Greed index (0-100) + global market metrics (total cap, BTC/ETH dominance).";
        readonly schema: {};
        readonly service: "sentiment";
        readonly transform: () => {};
    };
    readonly funding_rate: {
        readonly description: "Get perp funding rate for a crypto symbol from Binance USDT futures. Positive = longs pay shorts (bullish bias).";
        readonly schema: {
            readonly symbol: z.ZodString;
        };
        readonly service: "funding";
        readonly transform: (input: {
            symbol: string;
        }) => {
            symbol: string;
        };
    };
    readonly technical_indicators: {
        readonly description: "Get technical analysis indicators: RSI(7/14), MACD, EMA(20/50), SMA(20/50), volatility, ATR + trend/momentum signals. From Binance klines.";
        readonly schema: {
            readonly symbol: z.ZodString;
            readonly interval: z.ZodDefault<z.ZodEnum<["1m", "5m", "15m", "1h", "4h", "1d"]>>;
        };
        readonly service: "indicators";
        readonly transform: (input: {
            symbol: string;
            interval?: string;
        }) => {
            symbol: string;
            interval: string;
        };
    };
    readonly market_overview: {
        readonly description: "Quick market overview: BTC/ETH/SOL prices + Fear & Greed + BTC funding rate in one combined call.";
        readonly schema: {};
        readonly service: any;
        readonly transform: () => {};
    };
    readonly defi_yields: {
        readonly description: "Get top DeFi yields across 40+ chains (DeFiLlama, 15,000+ pools). Filter by chain, project, symbol, min APY, min TVL, stablecoins.";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly project: z.ZodOptional<z.ZodString>;
            readonly symbol: z.ZodOptional<z.ZodString>;
            readonly minApy: z.ZodOptional<z.ZodNumber>;
            readonly minTvl: z.ZodOptional<z.ZodNumber>;
            readonly stablecoins: z.ZodOptional<z.ZodBoolean>;
            readonly limit: z.ZodDefault<z.ZodNumber>;
        };
        readonly service: "yields";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly gas_price: {
        readonly description: "Get current gas price on an EVM chain. Returns gwei and wei values.";
        readonly schema: {
            readonly chain: z.ZodString;
        };
        readonly service: "gas";
        readonly transform: (input: {
            chain: string;
        }) => {
            chain: string;
        };
    };
    readonly yield_pool_metrics: {
        readonly description: "Get APY/TVL metrics for Aave V3 and Uniswap V3 pools. Returns pool snapshots with APY, TVL, and 24h deltas.";
        readonly schema: {
            readonly protocols: z.ZodOptional<z.ZodArray<z.ZodEnum<["aave-v3", "uniswap-v3"]>, "many">>;
            readonly pool_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        };
        readonly service: "pool_metrics";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly fresh_markets: {
        readonly description: "List new AMM pairs/pools created in the last N minutes (Uniswap V2, PancakeSwap, SushiSwap factories). For discovery bots and yield scouts.";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodEnum<["ethereum", "bsc", "all"]>>;
            readonly window_minutes: z.ZodOptional<z.ZodNumber>;
            readonly limit: z.ZodOptional<z.ZodNumber>;
        };
        readonly service: "new_pairs";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly get_price: {
        readonly description: "Get current price for any token on supported chains via x402";
        readonly schema: {
            readonly token: z.ZodString;
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly network: z.ZodOptional<z.ZodEnum<["base", "ethereum", "arbitrum", "optimism", "polygon", "bsc", "avalanche", "solana"]>>;
        };
        readonly service: "price";
        readonly transform: (input: any) => {
            symbols: any[];
        };
    };
    readonly get_market_sentiment: {
        readonly description: "Fear & Greed Index (Alternative.me) via x402";
        readonly schema: {};
        readonly service: "sentiment";
        readonly transform: () => {};
    };
    readonly get_funding_rates: {
        readonly description: "Perpetual funding rates across exchanges via x402";
        readonly schema: {
            readonly symbol: z.ZodOptional<z.ZodString>;
            readonly exchange: z.ZodOptional<z.ZodString>;
        };
        readonly service: "funding";
        readonly transform: (input: any) => {
            symbol: any;
        };
    };
    readonly get_technical_indicators: {
        readonly description: "RSI, MACD, EMA, SMA for any symbol/timeframe via x402";
        readonly schema: {
            readonly symbol: z.ZodString;
            readonly timeframe: z.ZodOptional<z.ZodString>;
            readonly indicators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        };
        readonly service: "indicators";
        readonly transform: (input: any) => {
            symbol: any;
            interval: any;
        };
    };
    readonly get_defi_yields: {
        readonly description: "Supply/borrow APY across protocols (Aave, Compound, Morpho, etc.) via x402";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly protocol: z.ZodOptional<z.ZodString>;
            readonly min_tvl: z.ZodOptional<z.ZodNumber>;
            readonly min_apy: z.ZodOptional<z.ZodNumber>;
        };
        readonly service: "yields";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly get_gas_price: {
        readonly description: "EIP-1559 gas fees for EVM chains via x402";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
        };
        readonly service: "gas";
        readonly transform: (input: any) => {
            chain: any;
        };
    };
    readonly get_multi_chain_gas: {
        readonly description: "Gas prices for multiple EVM chains at once via x402";
        readonly schema: {
            readonly chains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        };
        readonly service: "gas_multi";
        readonly transform: (input: any) => {
            chains: any;
        };
    };
    readonly get_pool_metrics: {
        readonly description: "Yield pool APY/TVL/fee metrics across DEXes via x402";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly dex: z.ZodOptional<z.ZodString>;
            readonly min_apy: z.ZodOptional<z.ZodNumber>;
            readonly min_tvl: z.ZodOptional<z.ZodNumber>;
        };
        readonly service: "pool_metrics";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly get_pool_alerts: {
        readonly description: "Pool alerts (APY spikes, new pools, TVL changes) via x402";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly alert_type: z.ZodOptional<z.ZodString>;
        };
        readonly service: "pool_alerts";
        readonly transform: (input: any) => Record<string, any>;
    };
    readonly scan_new_pairs: {
        readonly description: "Discover new AMM pairs on DEXes via x402";
        readonly schema: {
            readonly chain: z.ZodOptional<z.ZodString>;
            readonly dex: z.ZodOptional<z.ZodString>;
            readonly min_liquidity: z.ZodOptional<z.ZodNumber>;
        };
        readonly service: "new_pairs";
        readonly transform: (input: any) => Record<string, any>;
    };
};
export type ToolName = keyof typeof toolSchemas;
export type ToolDefinition = typeof toolSchemas[ToolName];
export declare const stdioToolNames: readonly ["crypto_prices", "market_sentiment", "funding_rate", "technical_indicators", "market_overview", "defi_yields", "gas_price", "yield_pool_metrics", "fresh_markets"];
export declare const httpToolNames: readonly ["get_price", "get_market_sentiment", "get_funding_rates", "get_technical_indicators", "get_defi_yields", "get_gas_price", "get_multi_chain_gas", "get_pool_metrics", "get_pool_alerts", "scan_new_pairs"];
export declare const stdioToHttpMap: Record<string, string>;
export declare const httpToStdioMap: Record<string, string>;
