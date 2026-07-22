import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ListResourcesRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { listRules, getRule, listCategories, listProjects, proposeRule } from './rules.mjs'

const PLATFORM_ENUM = ['chatgpt', 'claude', 'gemini', 'copilot', 'common']
const STATUS_ENUM = ['active', 'draft', 'pending_approval', 'stopped', 'rejected']

function textResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

function errorResult(error) {
  return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
}

// One shared server definition, registered onto whichever transport the
// entrypoint (bin/stdio.mjs or bin/http.mjs) attaches — see mcp-server/README.md
// for which transport each client (Claude Code, Claude Desktop, ChatGPT) uses.
export function createServer() {
  const server = new McpServer(
    { name: 'ai-rule-manager', version: '0.1.0' },
    { capabilities: { resources: {}, prompts: {} } },
  )

  // This server only exposes tools, but some clients (ChatGPT's connector)
  // unconditionally probe resources/list and prompts/list during setup
  // regardless of whether the server declared those capabilities. Without a
  // handler, the SDK returns a JSON-RPC "Method not found" error, which hung
  // ChatGPT's "接続する" (Connect) button indefinitely instead of completing.
  // Answering with an empty list is the correct, spec-compliant response for
  // a server with none.
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }))
  server.server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }))

  server.registerTool(
    'list_rules',
    {
      title: 'List AI Rule Manager rules',
      description:
        'Lists the rules registered in AI Rule Manager that this AI platform should follow. Defaults to active rules only. Filter by platform (returns rules targeting that platform plus rules targeting "common") and/or project.',
      inputSchema: {
        platform: z.enum(PLATFORM_ENUM).optional().describe('Filter to rules that apply to this AI platform (plus "common" rules)'),
        project: z.string().optional().describe('Filter to a specific project name (shared/"common" rules always included)'),
        status: z.enum(STATUS_ENUM).optional().describe('Defaults to "active"'),
      },
    },
    async ({ platform, project, status }) => {
      try {
        return textResult(await listRules({ platform, project, status }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_rule',
    {
      title: 'Get one rule by code',
      description: 'Fetches full detail and version history for one rule by its code (e.g. "IMG-001").',
      inputSchema: { code: z.string().describe('The rule code, e.g. "IMG-001"') },
    },
    async ({ code }) => {
      try {
        const rule = await getRule({ code })
        return rule ? textResult(rule) : errorResult(new Error(`No rule found with code "${code}"`))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_categories',
    {
      title: 'List rule categories',
      description: 'Lists valid category names and code prefixes — call this before propose_rule to pick a valid category.',
      inputSchema: {},
    },
    async () => {
      try {
        return textResult(await listCategories())
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        'Lists valid project names — call this before propose_rule if the rule should be scoped to one project rather than shared.',
      inputSchema: {},
    },
    async () => {
      try {
        return textResult(await listProjects())
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'propose_rule',
    {
      title: 'Propose a new rule',
      description:
        'Submits a new rule for human review. This ALWAYS lands as "pending_approval" in AI Rule Manager\'s Approval Center — it is never auto-activated. Use this when a new operating rule emerges naturally during a conversation and is worth persisting. Call list_categories (and list_projects, if scoping to a project) first to get valid values.',
      inputSchema: {
        title: z.string().describe('Short rule title'),
        content: z.string().describe('The full rule text — the instruction the AI should follow'),
        category: z.string().describe('Must exactly match a category name from list_categories'),
        tags: z.array(z.string()).optional().describe('Optional free-text tags'),
        platforms: z
          .array(z.enum(PLATFORM_ENUM))
          .optional()
          .describe('Which AI platforms this applies to; defaults to ["common"] (all platforms)'),
        project: z.string().optional().describe('Must exactly match a project name from list_projects; omit for a shared rule'),
      },
    },
    async ({ title, content, category, tags, platforms, project }) => {
      try {
        return textResult(await proposeRule({ title, content, category, tags, platforms, project }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  return server
}
