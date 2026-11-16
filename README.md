# Quantum AI Labs

The web frontend for Quantum AI Labs, a set of crypto research and wallet safety tools that supports the QAI utility token on Solana. It is a React single-page app built with Vite. The API behind the tools is hosted separately and is not part of this repository.

- Website: https://www.quantumailabs.site
- X: https://x.com/QAIXLabs
- Telegram: https://t.me/quantumailabs

## What you can do

- **Quantum Agent** (`/assistant`): a terminal-style chat for crypto research. It answers questions about BTC and altcoins with a price chart and technical indicators, screens new pump.fun tokens, and pulls swap quotes. It is read-only and does not give financial advice.
- **Privacy Swap** (`/swap`): swap supported coin pairs at a floating or fixed rate with no account and no wallet connection. You send funds to a deposit address and track the order on the page. Your swap history stays in your browser.
- **PQC Lab** (`/pqc`): paste an EVM or Solana wallet address to find out whether you can keep using it. It looks for permissions held by flagged addresses, contact with known drainers, and lookalike-address tricks, then gives a plain answer.
- **Web3 Solutions** (`/web3`): network monitors for six EVM chains and Solana, an address and transaction explorer, a token watchlist, and price alerts. The alerts run in your browser tab only.
- **Quantum Lab CHECKS** (`/checks`): paste a Solana coin to get two verdicts, one on whether its story holds up and one on whether its holders look fair. Every check is added to a public feed.

The site also has content pages (vision, technology, research articles, roadmap, ecosystem) and legal pages. These are static and work without the API.

## Architecture

This repository contains the frontend only.

```
index.html            entry HTML and fonts
vite.config.ts        Vite + React + Tailwind, plus a local stub for /api/*
demo/                 fictional fixtures for `npm run dev:demo` (local dev server only)
scripts/              Node unit tests for frontend helpers
src/
  main.tsx            app bootstrap (React Query, router)
  router.tsx          routes; the five tools are lazy-loaded
  components/         layout, navigation, shared UI
  data/               site copy, tool list, research articles, legal text
  features/
    agent/            Quantum Agent terminal, chart, API client
    swap/             Privacy Swap form, order view, local history, API client
    pqc/              PQC Lab wallet check UI and score logic
    web3/             monitors, explorer, watchlist, alerts
    checks/           Quantum Lab CHECKS API client and shared parts
    home/             home page visuals and the live market strip
  lib/                fetch wrapper, query client, clipboard helper
  pages/              one component per route
```

The browser talks only to same-origin `/api/*` routes. There are no direct calls from the browser to market data, blockchain RPC, exchange, or AI providers, and no provider key is ever sent to the browser.

| Frontend area | API routes it calls |
| --- | --- |
| Quantum Agent | `/api/agent/status`, `/api/agent/chat` (streamed NDJSON), `/api/market/klines` |
| Privacy Swap | `/api/swap/v3/*` |
| PQC Lab | `/api/web3/wallet-guard` |
| Web3 Solutions, home market strip | `/api/web3/*`, `/api/market/*` |
| Quantum Lab CHECKS | `/api/checks`, `/api/checks/:id` |

The hosted service, which is not in this repository, handles everything that needs a credential, a rate limit, or shared storage. That includes the exchange partner API, the AI model provider, market data and RPC access, the public CHECKS feed, and daily usage caps.

Settings, watchlists, alerts, agent chat history, and swap history are kept in the browser's `localStorage`.

## Run locally

Requires Node.js 22.22 or later (react-router 8 sets this minimum). npm comes with Node.

```bash
npm ci
```

```bash
npm run dev
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

`npm run dev` serves the app at http://localhost:5173. `npm run build` type-checks with `tsc -b` and writes the static site to `dist/`. You can preview that build with `npm run preview`.

Without the API, the content pages, navigation, layout, 3D visuals, and legal pages all work. Every tool page also loads. The parts that need data show their unavailable state instead:

- The home market strip shows "Price unavailable" with a Retry button.
- Quantum Agent shows as Offline and its input is disabled.
- Privacy Swap says it couldn't load the coin list.
- Web3 Solutions says it couldn't load the network list, and the monitors show Unavailable.
- Quantum Lab CHECKS says the feed couldn't be loaded, and a check detail page shows the API error.
- PQC Lab shows the API error when you run a wallet check.

The local dev and preview servers answer every `/api/*` request with HTTP 503 and a short JSON message, so the tools fail cleanly rather than trying to parse the app's HTML. Nothing points at the production API.

To see the Quantum Agent chart without the API, run:

```bash
npm run dev:demo
```

In demo mode the agent is shown as Online. Any question gets the same canned reply with a chart of a fictional "DEMO" coin. The candles are generated from a fixed formula in `demo/fixtures.ts`, labeled as demo data, and never come from a real market. Every other route, including the home page prices, still returns 503. Demo data is served only by the local Vite server and is never included in `npm run build`.

## Security and configuration

The public release needs no configuration and reads no environment variables.

Anything in the frontend bundle can be read by anyone who loads the page. That includes any `VITE_*` variable Vite would inline at build time. Never put an API key, token, private RPC URL, or database credential in this repository or in a `VITE_*` variable. Those belong to the hosted API, which keeps them on the server.

The frontend never asks for or handles seed phrases or private keys. It does not connect to wallets or sign transactions. Wallet and token addresses that you type are sent to the API to answer the lookup.

## Credits

Price charts in Quantum Agent use [TradingView Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) (Apache-2.0). The chart shows TradingView's attribution link and a credit line, as the library's license requires. See [NOTICE](NOTICE).

The brand emblem, favicons, and page illustrations used on the live site are not part of this repository. The header and footer use a text monogram instead, and the 3D and canvas visuals are drawn in code.

Names in the home page's data-sources strip refer to public services and networks the tools read from. They are plain text, and their use does not imply endorsement.

## Report an issue

Open an issue on this repository and include:

- what you did and the page URL (for example `/swap` or `/checks`)
- what you expected and what happened instead
- browser and OS, and the Node.js version if the problem is local
- console errors or failed network requests, with anything sensitive removed

Never post a seed phrase, recovery phrase, private key, API key, or access token, not even a partial one. Leave out personal data such as email addresses, and cut exchange order IDs or wallet addresses unless the bug can't be reproduced without them. If you think you've found a security problem, please don't describe it in a public issue. Send a direct message to the X or Telegram account above and ask for a private channel.
