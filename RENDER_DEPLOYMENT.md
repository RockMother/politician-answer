# Render Deployment Guide

This bot can be deployed on Render as either a **Web Service** or **Background Worker**.

## Option 1: Web Service (Recommended for Free Tier)

### Why Web Service?

- ✅ Can be kept awake with UptimeRobot (free tier auto-sleeps after 15 min)
- ✅ Health check endpoint available
- ✅ Auto-retry mechanism handles temporary 409 conflicts

### Setup:

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. Add environment variables:
   ```
   BOT_TOKEN=your_bot_token
   OPENAI_API_KEY=your_openai_key
   OPENAI_MODEL=gpt-4o-mini (optional)
   ADMIN_USER_IDS=123456789 (optional)
   MAX_RETRIES=10 (optional, default: 10)
   RETRY_DELAY_MS=10000 (optional, default: 10000)
   ```

6. Deploy

### Important: Free Tier Limitations

⚠️ **On Render free tier you cannot control instance count**. During deploys, Render may temporarily run 2 instances, causing 409 errors. The bot now automatically:
- Retries up to 10 times with 10-second delays
- Deletes webhook before each retry
- Eventually succeeds once old instance shuts down

You'll see logs like:
```
⚠ 409 Conflict: Another bot instance is running
  Waiting 10.0s before retry (9 attempts left)...
```

This is **normal** during deploys and will resolve automatically.

### Keep it awake (Free tier):

1. Sign up at [UptimeRobot](https://uptimerobot.com)
2. Add HTTP(s) monitor
3. URL: `https://your-app.onrender.com/`
4. Interval: 14 minutes
5. This prevents the bot from sleeping

### Check Health:

Visit `https://your-app.onrender.com/` - should see "OK"

---

## Option 2: Background Worker (Paid Plans Recommended)

### Why Background Worker?

- ✅ Cleaner - no HTTP server overhead
- ✅ More appropriate for long-polling bots
- ✅ **No instance count issues** - always runs exactly 1 instance
- ❌ **Sleeps after 15 min on free tier** (no way to keep awake)

### Setup:

1. Go to [render.com](https://render.com)
2. Create new **Background Worker**
3. Connect your GitHub repo
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

5. Add environment variables:
   ```
   BOT_TOKEN=your_bot_token
   OPENAI_API_KEY=your_openai_key
   OPENAI_MODEL=gpt-4o-mini (optional)
   ADMIN_USER_IDS=123456789 (optional)
   WORKER_MODE=true (disables HTTP server)
   ```

   ⚠️ **Important:** Set `WORKER_MODE=true` to disable the HTTP server

6. Deploy

### Advantages over Web Service:

- 🎯 **No 409 conflicts during deploys** - Background Workers don't have multiple instances
- 🚀 Faster startup (no HTTP server)
- 💰 More appropriate service type for paid plans

---

## Troubleshooting 409 Errors

The code now automatically:
- Deletes webhook on startup
- Retries 3 times with 5-second delays
- Clears pending updates

If you still get 409 errors:

1. Make sure **only ONE instance** is running:
   - Check Render dashboard: Instance Count = 1
   - Stop any local instances (`npm run dev`)

2. Manually check webhook status:
   ```bash
   BOT_TOKEN=your_token npm run bot:status
   ```

3. Force delete webhook:
   ```bash
   BOT_TOKEN=your_token npm run bot:delete-webhook
   ```

4. Restart the service on Render

---

## Recommended Setup

For **free tier**: Use **Web Service + UptimeRobot**

For **paid plans**: Use **Background Worker** (cleaner, no HTTP server needed)
