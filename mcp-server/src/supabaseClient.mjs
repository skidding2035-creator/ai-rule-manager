import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Reuse the exact same .env the browser app uses (same project root, same
// two vars) — no separate credentials to manage. See src/lib/supabaseClient.ts
// for the browser-side equivalent; that one reads import.meta.env, which
// doesn't exist in a plain Node process, hence this separate client.
const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
// quiet: true is load-bearing, not cosmetic — dotenv writes its startup
// message (and any promotional "tip") to stdout, which is the exact channel
// the stdio MCP transport uses for the JSON-RPC stream. Any stray stdout
// output there breaks the protocol for Claude Code/Desktop.
config({ path: path.join(repoRoot, '.env'), quiet: true })

const url = process.env.VITE_SUPABASE_URL
// The service_role key, not the anon key: once auth_migration.sql is applied,
// RLS requires a logged-in session, which this server-side process doesn't
// have. service_role bypasses RLS by design — the standard pattern for a
// trusted backend — and unlike the anon key it must never reach a browser,
// so it's read from its own unprefixed env var, kept out of the Vite bundle.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error(
    'VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in the project root .env — see mcp-server/README.md for where to get the service_role key.',
  )
}

export const supabase = createClient(url, serviceRoleKey)
