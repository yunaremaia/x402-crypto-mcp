# x402 Crypto MCP Server

MCP server that aggregates 3 x402 crypto services as tools for AI agents:
prices, sentiment, funding rates, and technical indicators.

## Tools

| Tool | Description | Service |
|------|-------------|---------|
| `crypto_prices` | Live USD prices for 20+ tokens | multi-chain-price-oracle |
| `market_sentiment` | Fear & Greed index + global market metrics | crypto-market-sentiment |
| `funding_rate` | Perp funding rate from Binance USDT futures | crypto-market-sentiment |
| `technical_indicators` | RSI, MACD, EMA, SMA, volatility, ATR + signals | technical-indicators-oracle |
| `market_overview` | Combined: prices + sentiment + funding in one call | all 3 services |

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

## License

MIT
