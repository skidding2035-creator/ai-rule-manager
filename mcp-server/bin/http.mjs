#!/usr/bin/env node
import express from 'express'
import cors from 'cors'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from '../src/server.mjs'

// Local-only by default (listens on all interfaces, but nothing forwards it
// to the internet on its own). Only reachable by ChatGPT Connectors / Claude
// Desktop's remote-server mode once this is deliberately exposed (tunnel or
// deployment) — see mcp-server/README.md before doing that, since propose_rule
// writes to the database.
const app = express()
app.use(express.json())

// ChatGPT validates a custom connector's URL from the browser (not just
// server-to-server) when you click "作成する" — without CORS headers the
// browser silently blocks that check and connector creation fails with a
// generic error, even though the server itself is healthy. The `?token=`
// query param is the real access control here, so a permissive origin is
// fine — this isn't a security boundary CORS needs to enforce.
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'Accept'],
    exposedHeaders: ['mcp-session-id'],
  }),
)

// Unauthenticated on purpose — external uptime monitors (UptimeRobot etc.)
// need a path that reliably returns 200 with no token, since every /mcp
// request (even a valid one without an established session) returns a
// non-2xx status and would misreport the service as down.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

function safeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

// ChatGPT's custom-connector UI only offers OAuth or no-auth — no plain
// API-key field — so the shared secret travels as a `?token=` query param
// (the connector URL becomes a capability URL) with a Bearer-header fallback
// for clients that do support custom headers (e.g. Claude Desktop's remote
// server config). Fails closed if the server itself has no secret configured.
function checkToken(req, res, next) {
  const secret = process.env.MCP_SHARED_SECRET
  if (!secret) {
    res.status(500).json({ error: 'MCP_SHARED_SECRET is not configured on the server' })
    return
  }
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  const provided = req.query.token ?? bearer
  if (!provided || !safeEqual(String(provided), secret)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.use('/mcp', checkToken)

const transports = {}

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id']
  let transport

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId]
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport
      },
    })
    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId]
    }
    const server = createServer()
    await server.connect(transport)
  } else {
    res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request: No valid session ID provided' }, id: null })
    return
  }

  await transport.handleRequest(req, res, req.body)
})

async function handleSessionRequest(req, res) {
  const sessionId = req.headers['mcp-session-id']
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID')
    return
  }
  await transports[sessionId].handleRequest(req, res)
}

app.get('/mcp', handleSessionRequest)
app.delete('/mcp', handleSessionRequest)

// Render (and most PaaS hosts) assign the port via PORT and require the app
// to bind to it; MCP_HTTP_PORT stays as the local-dev override.
const port = process.env.PORT || process.env.MCP_HTTP_PORT || 8787
app.listen(port, () => {
  console.log(`AI Rule Manager MCP server (HTTP) listening on http://localhost:${port}/mcp`)
})
