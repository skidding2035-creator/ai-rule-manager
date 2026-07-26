# AI Rule Manager — MCP server

Exposes the rules stored in AI Rule Manager to AI platforms over [MCP](https://modelcontextprotocol.io), so they can:

- **Read** the active rules they should follow (`list_rules`, `get_rule`, `list_categories`, `list_projects`)
- **Propose** new rules (`propose_rule`) — these always land as `pending_approval` in the app's Approval Center. Nothing an AI proposes is ever auto-activated; a human has to approve it in the app first, same as any other pending rule.
- **Propose a fix to an existing rule** (`propose_rule_update`) — for when an AI fact-checks a rule it just read via `get_rule` and finds it's outdated or wrong. This never overwrites the live rule directly: it inserts a pending revision that shows up in the Approval Center, and the rule keeps serving its current content to every AI platform until a human approves or rejects the fix. Because the fact-check itself is just the connected AI reasoning over text it already has (no separate API call), this costs nothing beyond whatever you're already paying for that AI's chat/subscription.

It reads credentials from the project root's `.env`:

- `VITE_SUPABASE_URL` — same value the app uses.
- `SUPABASE_SERVICE_ROLE_KEY` — **not** the anon key. This server is a trusted backend, so it uses the service_role key (Supabase → Settings → API → Secret keys), which bypasses Row Level Security. Required once `supabase/auth_migration.sql` has been applied to the database (the anon key alone would fail every query after that, since RLS then requires a logged-in session this server doesn't have).
- `MCP_SHARED_SECRET` — required by the HTTP transport only (see the ChatGPT section below). Any random string, e.g. `openssl rand -hex 32`.

`VITE_USE_SUPABASE=true` must also be set, and the app already connected to a real Supabase project (see the root `supabase/schema.sql` / `supabase/seed.sql` setup) — this server has no mock-data fallback.

## Setup

```
cd mcp-server
npm install
```

## Claude Code (already wired up)

A project-scoped `.mcp.json` already exists at the repo root pointing at `node mcp-server/bin/stdio.mjs`. **Restart Claude Code** (or start a fresh session) in this project directory and the five tools above become available automatically — no further setup needed.

## Claude Desktop

Claude Desktop doesn't pick up a project's `.mcp.json`; add the server to its own config instead. Open (or create) Claude Desktop's config file:

- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add:

```json
{
  "mcpServers": {
    "ai-rule-manager": {
      "command": "node",
      "args": ["C:\\Users\\skidd\\OneDrive\\デスクトップ\\AI運用ツール\\mcp-server\\bin\\stdio.mjs"]
    }
  }
}
```

(Use the absolute path — Desktop doesn't run from this project's directory.) Restart Claude Desktop after saving.

## ChatGPT (Settings → Connectors)

ChatGPT connects to **remote** MCP servers only (no local stdio) — this needs `mcp-server/bin/http.mjs` running somewhere reachable over HTTPS.

This repo uses a free [ngrok](https://ngrok.com) static domain (`earring-swimmer-barista.ngrok-free.dev`) so the public URL never changes between runs — the ChatGPT connector only needs to be configured **once**, not re-pasted every time the tunnel restarts. This is a stopgap until the server has a real always-on deployment (Render/Fly.io); until then, the tunnel only works while both of the commands below are running on this machine.

1. Set `MCP_SHARED_SECRET` in `.env` (see above) — the HTTP transport rejects every request without it.
2. Start the HTTP server: `npm run start:http` (defaults to `http://localhost:8787/mcp`, local-only).
3. In a second terminal, start the tunnel: `npm run tunnel` (wraps `ngrok http --url=earring-swimmer-barista.ngrok-free.dev 8787`). This is safe to expose *because* of the token from step 1 — without it, anyone who found the URL could call `propose_rule` and spam the Approval Center.
4. In ChatGPT: Settings → Connectors → Add custom connector → paste the URL **with the token appended**: `https://earring-swimmer-barista.ngrok-free.dev/mcp?token=<your MCP_SHARED_SECRET>` (its auth-type dropdown only offers OAuth or none — leave it on "認証なし"/none, the token rides in the URL itself). Since the domain is fixed, this only needs to be entered once — future sessions just need steps 1–3 running again.

## Manual smoke test (no MCP client needed)

```
node -e "import('./src/rules.mjs').then(m => m.listRules({ platform: 'claude' })).then(r => console.log(JSON.stringify(r, null, 2)))"
```
