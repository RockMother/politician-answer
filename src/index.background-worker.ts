/**
 * Alternative entry point for Render Background Worker
 * (no HTTP server needed)
 * 
 * To use this instead of index.ts:
 * 1. Rename this file to index.ts (backup the original first)
 * 2. Or change package.json start script to: "ts-node src/index.background-worker.ts"
 */

import "dotenv/config";
import { createBot } from "./bot";

/**
 * Delete webhook to ensure we can use long polling
 */
async function deleteWebhook(token: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`
    );
    const data = await response.json() as { ok: boolean; description?: string };
    if (data.ok) {
      console.log("✓ Webhook deleted (if any existed)");
    } else {
      console.warn("⚠ Could not delete webhook:", data.description);
    }
  } catch (err) {
    console.warn("⚠ Failed to delete webhook:", err);
  }
}

async function main(): Promise<void> {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  // ── Delete webhook before starting (prevents 409 errors) ──────────
  console.log("Preparing bot...");
  await deleteWebhook(token);

  // ── Start Telegram bot (long polling) ─────────────────────────────
  const bot = createBot(token);

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down...");
    bot.stop();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  console.log("Starting PoliticianBot (Background Worker mode)...");
  
  // Retry logic for 409 errors
  let retries = 3;
  while (retries > 0) {
    try {
      await bot.start({
        onStart: (botInfo) => {
          console.log(`Bot @${botInfo.username} is up and running!`);
        },
      });
      break; // Success
    } catch (err: any) {
      if (err?.error_code === 409 && retries > 1) {
        retries--;
        console.log(`⚠ 409 Conflict detected. Waiting 5 seconds before retry (${retries} attempts left)...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await deleteWebhook(token);
      } else {
        throw err; // Re-throw if not 409 or out of retries
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
