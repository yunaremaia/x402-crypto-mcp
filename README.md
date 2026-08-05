# x402 Crypto MCP Server

MCP server that aggregates **9 x402 crypto services** as tools for AI agents:
prices, sentiment, funding rates, technical indicators, DeFi yields, gas prices,
pool metrics, and fresh market discovery.

## Tools

| Tool | Description | Service |
|------|-------------|---------|
| `crypto_prices` | Live USD prices for 20+ tokens | multi-chain-price-oracle |
| `market_sentiment` | Fear & Greed index + global market metrics | crypto-market-sentiment |
| `funding_rate` | Perp funding rate from Binance USDT futures | crypto-market-sentiment |
| `technical_indicators` | RSI, MACD, EMA, SMA, volatility, ATR + signals | technical-indicators-oracle |
| `market_overview` | Combined: prices + sentiment + funding in one call | all 3 services |
| `defi_yields` | Top DeFi yields across 40+ chains (15,000+ pools) | defi-yield-aggregator |
| `gas_price` | Gas prices on 9 EVM chains (gwei/wei) | multi-chain-gas-oracle |
| `yield_pool_metrics` | APY/TVL snapshots for Aave V3 / Uniswap V3 pools | yield-pool-watcher |
| `fresh_markets` | New AMM pairs in the last N minutes | fresh-markets-watch |

## Install

```bash
npx x402-crypto-mcp
```

Or globally:
```bash
npm install -g x402-crypto-mcp
```

## Use in Claude Desktop / Cursor / any MCP client

```json
{
  "mcpServers": {
    "x402-crypto": {
      "command": "npx",
      "args": ["x402-crypto-mcp"]
    }
  }
}
```

## x402 Payments

All backend services use x402 pay-per-call on Base mainnet (USDC).
The MCP server returns 402 challenges with payment details when you need to pay.
Your agent must handle x402 payments to access the data.

## Data Sources

- CoinGecko (prices) — free, 60s cache
- Binance (funding rates, klines) — free
- Alternative.me (Fear & Greed) — free
- DeFiLlama (yields) — free, 5min cache
- Public RPCs (gas) — free, 30s cache
- The Graph (pool metrics) — free
- EVM RPCs (new pairs) — free

## GitHub

https://github.com/yunaremaia/x402-crypto-mcp
