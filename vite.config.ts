import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse } from 'node:http'
import { defineConfig, type Connect, type Plugin } from 'vite'
import { DEMO_PAIR, demoChatLines, demoKlines } from './demo/fixtures.ts'

const UNAVAILABLE = 'The Quantum AI Labs API is not included in this frontend build.'

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

/**
 * The API runs as a separate hosted service and is not part of this repository.
 * Locally, every /api/* request gets a 503 JSON reply, so each tool shows its
 * "unavailable" state instead of parsing the SPA's index.html as data.
 *
 * In demo mode (`npm run dev:demo`) the Quantum Agent answers with fictional fixtures from
 * demo/fixtures.ts so its chart can be tried. Every other route still returns 503.
 */
function localApi(demo: boolean): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    const url = new URL(req.url, 'http://localhost')

    if (demo && url.pathname === '/api/agent/status') return json(res, 200, { available: true })
    if (demo && url.pathname === '/api/agent/chat' && req.method === 'POST') {
      res.setHeader('content-type', 'application/x-ndjson')
      for (const line of demoChatLines()) res.write(line)
      return res.end()
    }
    // Only the fictional DEMO pair: real pairs (BTC, ETH, SOL on the home page) stay unavailable.
    if (demo && url.pathname === '/api/market/klines' && url.searchParams.get('pair') === DEMO_PAIR) {
      return json(res, 200, demoKlines(url.searchParams.get('interval') ?? '1h'))
    }

    json(res, 503, { detail: UNAVAILABLE, message: UNAVAILABLE })
  }

  return {
    name: 'local-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), localApi(mode === 'demo')],
}))
