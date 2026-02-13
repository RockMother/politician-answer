# PoliticianBot

A Telegram bot that generates strong opposing replies to political messages using OpenAI.

## How it works

1. Someone posts a political message in a group chat.
2. Another user **replies** to that message and **@mentions** the bot (e.g. `@YourBotUsername`).
3. The bot reads the original message, sends it to OpenAI with a system prompt, and posts a fierce counter-argument as a reply.

## Setup

### Prerequisites

- Node.js 20+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- An OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))

### Important: Configure bot for groups

⚠️ **Before adding the bot to a group, disable Privacy Mode:**

1. Open [@BotFather](https://t.me/BotFather)
2. Send `/mybots`
3. Select your bot
4. **Bot Settings** → **Group Privacy** → **Turn off**

Without this, the bot won't see messages in group chats!

### Install

```bash
git clone <your-repo-url>
cd PoliticianBot
npm install
```

### Configure

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Telegram bot token from BotFather |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4o-mini`) |
| `OPENAI_SYSTEM_PROMPT` | No | Custom system prompt (overrides file and default) |
| `PROMPT_FILE` | No | Path to prompt file (default: `config/prompt.txt`) |
| `ADMIN_USER_IDS` | No | Comma-separated Telegram user IDs for admin commands |
| `PORT` | No | Health-check server port (default: `3000`) |
| `WORKER_MODE` | No | Set to `true` to disable HTTP server (for Background Worker) |
| `MAX_RETRIES` | No | Max retry attempts for 409 errors (default: `10`) |
| `RETRY_DELAY_MS` | No | Delay between retries in ms (default: `10000`) |

> **Tip:** To find your Telegram user ID, message [@userinfobot](https://t.me/userinfobot).

### Run locally

```bash
# Development (with ts-node)
npm run dev

# Production
npm run build
npm start
```

## Bot commands

| Command | Who | Description |
|---------|-----|-------------|
| `/start` | Anyone | Show welcome message |
| `/help` | Anyone | Show usage instructions |
| `/setprompt <text>` | Admin | Set a new system prompt at runtime |
| `/resetprompt` | Admin | Reset prompt to the default |
| `/getprompt` | Admin | Show the current system prompt |

> If `ADMIN_USER_IDS` is not set, admin commands are available to everyone.

## Customizing the prompt

The system prompt controls how the bot argues. Priority order:

1. **Runtime** — set via `/setprompt` (resets on redeploy)
2. **Environment variable** — `OPENAI_SYSTEM_PROMPT`
3. **File** — `config/prompt.txt`
4. **Built-in default**

Edit `config/prompt.txt` to change the default prompt without env vars.

## Deploy to Render

You can deploy as either **Web Service** (recommended for free tier) or **Background Worker** (paid plans).

### Quick Start (Web Service + Free Tier):

1. Push your code to a GitHub repo
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** Node
   - **Instance Type:** Free
5. Add environment variables: `BOT_TOKEN`, `OPENAI_API_KEY`, etc.
6. Deploy
7. Use [UptimeRobot](https://uptimerobot.com) to ping your app every 14 min (keeps it awake)

For detailed deployment instructions and Background Worker setup, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

## Using the bot in multiple groups

One bot instance can work in **unlimited** groups and channels simultaneously! Just add the bot to any group you want.

Make sure:
- Privacy Mode is disabled in BotFather (applies to all groups)
- Only ONE instance of the bot is running (avoid 409 errors)

## Troubleshooting

### 409 Conflict Error (Common on Render Free Tier)

If you see `Conflict: terminated by other getUpdates request`:

**This is normal during deploys!** The bot automatically retries for ~2 minutes. If it persists:

```bash
# Check if webhook is set
BOT_TOKEN=your_token npm run bot:status

# Delete webhook if it exists
BOT_TOKEN=your_token npm run bot:delete-webhook

# Stop any local instances
pkill -f "node.*politician"
```

**Root cause:** Render free tier may run 2 instances during deploys, and you can't control instance count on free tier. The bot handles this automatically with retry logic.

**Permanent fix:** Use a paid plan with Background Worker (`WORKER_MODE=true`).

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging steps.

## License

MIT
