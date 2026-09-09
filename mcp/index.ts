/**
 * Newsletter MCP Server — stdio transport.
 * Run with: node dist/mcp/index.js
 *
 * 15 tools: subscribe_user, unsubscribe_user, list_subscribers, get_subscriber,
 *           create_newsletter, get_newsletter, get_current_newsletter, list_newsletters,
 *           update_newsletter, add_news_item, delete_newsletter,
 *           generate_intro, preview_newsletter, send_newsletter, get_email_stats
 */

import path from "node:path"
import dotenv from "dotenv"

// Load the same env files the Next.js app uses, resolved from the project root
// (dist/mcp/index.js -> ../../). Values already in the environment win, so an
// MCP client can still override anything via its own `env` block.
const projectRoot = path.resolve(__dirname, "../..")
for (const f of [".env.local", ".env"]) {
  dotenv.config({ path: path.join(projectRoot, f) })
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

import { subscribeUser, unsubscribeUser, listSubscribers, getSubscriber } from "./tools/subscribers.js"
import { createNewsletter, getNewsletter, getCurrentNewsletter, listNewsletters, updateNewsletter, addNewsItem, deleteNewsletter } from "./tools/newsletters.js"
import { generateIntro, previewNewsletter, sendNewsletter, getEmailStats } from "./tools/send.js"

const TOOLS = [
  { name: "subscribe_user", description: "Add a subscriber. Creates Resend contact, sets topic prefs, mirrors to Supabase, optionally sends welcome email.", inputSchema: { type: "object", properties: { email: { type: "string" }, dailyInsights: { type: "boolean" }, weeklyUpdates: { type: "boolean" }, sendWelcomeEmail: { type: "boolean" } }, required: ["email"] } },
  { name: "unsubscribe_user", description: "Opt a subscriber out of Daily Insights and/or Weekly Updates.", inputSchema: { type: "object", properties: { email: { type: "string" }, daily: { type: "boolean" }, weekly: { type: "boolean" }, token: { type: "string" }, exp: { type: "string" } }, required: ["email"] } },
  { name: "list_subscribers", description: "List subscribers with optional status filter and pagination.", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["active", "unsubscribed", "all"] }, limit: { type: "number" }, offset: { type: "number" } } } },
  { name: "get_subscriber", description: "Look up one subscriber by email.", inputSchema: { type: "object", properties: { email: { type: "string" } }, required: ["email"] } },
  { name: "create_newsletter", description: "Create a weekly newsletter draft. Idempotent — returns existing if week already has one.", inputSchema: { type: "object", properties: { weekStart: { type: "string", description: "ISO date for Monday of the week" } } } },
  { name: "get_newsletter", description: "Get a newsletter by ID.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "get_current_newsletter", description: "Get (or create) this week's newsletter draft.", inputSchema: { type: "object", properties: {} } },
  { name: "list_newsletters", description: "List newsletters, optionally filtered by status.", inputSchema: { type: "object", properties: { status: { type: "string", enum: ["draft", "sent", "all"] }, limit: { type: "number" }, offset: { type: "number" } } } },
  { name: "update_newsletter", description: "Update newsletter fields (editorial intro, news items, audience, status).", inputSchema: { type: "object", properties: { id: { type: "string" }, chefsTableTitle: { type: "string" }, chefsTableBody: { type: "string" }, newsItems: { type: "array" }, recipeIds: { type: "array", items: { type: "string" } }, cookingItems: { type: "array" }, systemPrompt: { type: "string" }, audienceId: { type: "string" }, status: { type: "string", enum: ["draft", "sent"] } }, required: ["id"] } },
  { name: "add_news_item", description: "Append one news item to a newsletter.", inputSchema: { type: "object", properties: { newsletterId: { type: "string" }, title: { type: "string" }, url: { type: "string" }, summary: { type: "string" }, source: { type: "string" } }, required: ["newsletterId", "title"] } },
  { name: "delete_newsletter", description: "Delete a draft newsletter.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "generate_intro", description: "AI-generate the editorial intro via Gemini using current news/reading/cooking context.", inputSchema: { type: "object", properties: { newsletterId: { type: "string" }, customPrompt: { type: "string" } }, required: ["newsletterId"] } },
  { name: "preview_newsletter", description: "Render and return the full newsletter HTML.", inputSchema: { type: "object", properties: { newsletterId: { type: "string" }, baseUrl: { type: "string" } }, required: ["newsletterId"] } },
  { name: "send_newsletter", description: "Send the newsletter. testEmail sends a proof; omit to broadcast to the full audience.", inputSchema: { type: "object", properties: { newsletterId: { type: "string" }, testEmail: { type: "string" }, baseUrl: { type: "string" } }, required: ["newsletterId"] } },
  { name: "get_email_stats", description: "Get email event stats (opens, clicks, bounces) from the webhook log.", inputSchema: { type: "object", properties: { broadcastId: { type: "string" }, eventType: { type: "string" }, since: { type: "string" }, limit: { type: "number" } } } },
]

async function main() {
  const server = new Server({ name: "newsletter-mcp", version: "1.0.0" }, { capabilities: { tools: {} } })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (args ?? {}) as any
    try {
      let result: unknown
      switch (name) {
        case "subscribe_user": result = await subscribeUser(a); break
        case "unsubscribe_user": result = await unsubscribeUser(a); break
        case "list_subscribers": result = await listSubscribers(a); break
        case "get_subscriber": result = await getSubscriber(a.email); break
        case "create_newsletter": result = await createNewsletter(a); break
        case "get_newsletter": result = await getNewsletter(a.id); break
        case "get_current_newsletter": result = await getCurrentNewsletter(); break
        case "list_newsletters": result = await listNewsletters(a); break
        case "update_newsletter": result = await updateNewsletter(a); break
        case "add_news_item": result = await addNewsItem(a.newsletterId, a); break
        case "delete_newsletter": result = await deleteNewsletter(a.id); break
        case "generate_intro": result = await generateIntro(a); break
        case "preview_newsletter": result = await previewNewsletter(a.newsletterId, a.baseUrl); break
        case "send_newsletter": result = await sendNewsletter(a); break
        case "get_email_stats": result = await getEmailStats(a); break
        default: throw new Error(`Unknown tool: ${name}`)
      }
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true }
    }
  })

  await server.connect(new StdioServerTransport())
  console.error("Newsletter MCP server running on stdio")
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1) })
