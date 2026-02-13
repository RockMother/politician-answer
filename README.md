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

## Deploy to Render (free)

1. Push your code to a GitHub repo.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** Node
5. Add environment variables: `BOT_TOKEN`, `OPENAI_API_KEY`, and any optional ones.
6. Deploy.

### Preventing sleep (Render free tier spins down after 15 min)

1. Sign up at [UptimeRobot](https://uptimerobot.com) (free).
2. Add a new HTTP monitor pointing to `https://your-app.onrender.com/` with a 14-minute interval.
3. This keeps the bot alive by hitting the built-in health-check server.

## License

MIT
