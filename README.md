# newsletter-mcp

Open-source newsletter management tool built for AI agents. Deploy your own newsletter, then let agents like Claude Code, Grok, OpenClaw, Hermes, Buzz, or any MCP-compatible client manage it — writing content, scheduling issues, growing your subscriber list, and tracking delivery.

---

## What it is

**newsletter-mcp** is two things packaged together:

1. **A Next.js web app** — public subscribe page, issue archive, unsubscribe flow, and a password-protected management UI
2. **An MCP server** — 15 tools that any AI agent can call to manage every aspect of your newsletter

Both share the same business logic library. Configure once, run everywhere.

---

## Supported agents

Any agent that speaks [Model Context Protocol](https://modelcontextprotocol.io):

- **Claude Code** / Claude Desktop
- **Cursor**, **Windsurf**, **Zed**
- **OpenClaw**, **Hermes**, **Grok**, **Buzz**
- Any custom MCP client

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/abcucinalabs/newsletter-mcp.git
cd newsletter-mcp
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Key variables:

| Variable | Description |
|---|---|
| `NEWSLETTER_NAME` | Your newsletter's name |
| `NEWSLETTER_TAGLINE` | One-line description shown on the homepage |
| `NEWSLETTER_COLOR` | Brand accent color (hex, e.g. `#4f46e5`) |
| `RESEND_API_KEY` | From resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender email |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `GEMINI_API_KEY` | For AI-generated editorial intros (optional) |
| `UNSUBSCRIBE_SECRET` | Any long random string — signs unsubscribe tokens |
| `MANAGE_SECRET` | Password for /manage (leave empty in dev) |
| `BASE_URL` | Full public URL of the app |

### 3. Create the database tables

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it. This creates `subscribers`,
`weekly_newsletters`, and three optional tables, with RLS enabled so only the
service-role key can reach them.

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3001** — the home page is a live setup checklist. It reads your
environment and shows which of Supabase, Resend, identity, and secrets are still missing,
turning each step green as you fill it in. Work through it, then head to `/manage`.

To run the MCP server for agents:

```bash
npm run build:mcp && npm run start:mcp
```

---

## Connect an AI agent

Add to your MCP config (`claude_desktop_config.json`, etc.):

```json
{
  "mcpServers": {
    "newsletter": {
      "command": "node",
      "args": ["/path/to/newsletter-mcp/dist/mcp/index.js"],
      "env": {
        "RESEND_API_KEY": "re_...",
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ...",
        "NEWSLETTER_NAME": "My Weekly",
        "GEMINI_API_KEY": "AIza...",
        "BASE_URL": "https://your-newsletter.com"
      }
    }
  }
}
```

### Claude Code

The repo ships a project-scoped [`.mcp.json`](.mcp.json), so inside a clone you only need:

```bash
npm run build:mcp
```

Claude Code picks the server up automatically on next launch and will ask you to approve it.
The server reads `.env.local` itself, so no credentials go in the MCP config.

Then ask your agent:

```
"Create a new newsletter for next Monday"
"Add these three news items to the draft"
"Generate an editorial intro with AI"
"Send a test to me@example.com, then broadcast to all subscribers"
"How many active subscribers do we have?"
```

---

## Available MCP tools

| Tool | Description |
|---|---|
| `subscribe_user` | Subscribe an email to one or both topics |
| `unsubscribe_user` | Update preferences / fully unsubscribe |
| `list_subscribers` | List subscribers with optional status filter |
| `get_subscriber` | Get one subscriber by email |
| `create_newsletter` | Create a new weekly draft |
| `get_newsletter` | Get a newsletter by ID |
| `get_current_newsletter` | Get the current week's draft |
| `list_newsletters` | List all newsletters |
| `update_newsletter` | Update title, body, news items |
| `add_news_item` | Add a news item to a newsletter |
| `delete_newsletter` | Delete a draft |
| `generate_intro` | AI-generate editorial intro (Gemini) |
| `preview_newsletter` | Render the newsletter HTML |
| `send_newsletter` | Test send or broadcast to subscribers |

---

## Web UI routes

| Route | Description |
|---|---|
| `/` | Subscribe form + latest issue |
| `/archive` | All sent issues |
| `/newsletter/[id]` | Individual issue (rendered email) |
| `/unsubscribe` | Preference management |
| `/manage` | Dashboard — stats + agent setup (password protected) |
| `/manage/newsletters` | All newsletters |
| `/manage/newsletters/[id]` | Newsletter editor |
| `/manage/subscribers` | Subscriber list |

---

## Tech stack

- **Next.js 15** (App Router)
- **Resend v6** (email, contacts, topics, broadcasts)
- **Supabase** (database)
- **Google Gemini** (AI content generation)
- **Handlebars** (email templates)
- **@modelcontextprotocol/sdk** (MCP server)

---

## License

MIT
