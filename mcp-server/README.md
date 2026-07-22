# AI Rule Manager — MCP server

Exposes the rules stored in AI Rule Manager to AI platforms over [MCP](https://modelcontextprotocol.io), so they can:

- **Read** the active rules they should follow (`list_rules`, `get_rule`, `list_categories`, `list_projects`)
- **Propose** new rules (`propose_rule`) — these always land as `pending_approval` in the app's Approval Center. Nothing an AI proposes is ever auto-activated; a human has to approve it in the app first, same as any other pending rule.

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

ChatGPT connects to **remote** MCP servers only (no local stdio) — this needs `mcp-server/bin/http.mjs` running somewhere reachable over HTTPS, which this project doesn't set up by itself yet:

1. Set `MCP_SHARED_SECRET` in `.env` (see above) — the HTTP transport rejects every request without it.
2. Start the HTTP server: `npm run start:http` (defaults to `http://localhost:8787/mcp`, local-only).
3. To make it reachable by ChatGPT, expose that port publicly — either a tunnel (e.g. `ngrok http 8787`) for quick testing, or a real deployment for anything longer-lived. This is safe to do *because* of the token from step 1 — without it, anyone who found the URL could call `propose_rule` and spam the Approval Center. Still decide this step deliberately — it's not done automatically.
4. In ChatGPT: Settings → Connectors → Add custom connector → paste the URL **with the token appended**: `https://.../mcp?token=<your MCP_SHARED_SECRET>` (its auth-type dropdown only offers OAuth or none — leave it on "認証なし"/none, the token rides in the URL itself).

## Manual smoke test (no MCP client needed)

```
node -e "import('./src/rules.mjs').then(m => m.listRules({ platform: 'claude' })).then(r => console.log(JSON.stringify(r, null, 2)))"
```
