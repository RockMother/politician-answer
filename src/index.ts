import "dotenv/config";
import http from "http";
import { createBot } from "./bot";
import { getPort, isBackgroundWorkerMode, getRetryDelay, getMaxRetries } from "./config";

/**
 * Delete webhook to ensure we can use long polling
 */
async function deleteWebhook(token: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`
    );
    const data = await response.json();
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

  const workerMode = isBackgroundWorkerMode();
  const retryDelayMs = getRetryDelay();
  const maxRetries = getMaxRetries();

  console.log(`Mode: ${workerMode ? "Background Worker" : "Web Service"}`);
  console.log(`Retry settings: max ${maxRetries} attempts, ${retryDelayMs}ms delay`);

  // ── Delete webhook before starting (prevents 409 errors) ──────────
  console.log("Preparing bot...");
  await deleteWebhook(token);

  // ── Health-check HTTP server (only in Web Service mode) ───────────
  let server: http.Server | null = null;
  
  if (!workerMode) {
    const port = getPort();
    server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    });

    server.listen(port, () => {
      console.log(`Health-check server listening on port ${port}`);
    });
  } else {
    console.log("Background Worker mode: HTTP server disabled");
  }

  // ── Start Telegram bot (long polling) ─────────────────────────────
  const bot = createBot(token);

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down...");
    bot.stop();
    if (server) {
      server.close();
    }
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  console.log("Starting PoliticianBot...");
  
  // Retry logic for 409 errors (common on Render free tier during deploys)
  let retries = maxRetries;
  while (retries > 0) {
    try {
      await bot.start({
        onStart: (botInfo) => {
          console.log(`✓ Bot @${botInfo.username} is up and running!`);
        },
      });
      break; // Success
    } catch (err: any) {
      if (err?.error_code === 409) {
        retries--;
        if (retries > 0) {
          const delaySeconds = (retryDelayMs / 1000).toFixed(1);
          console.log(`⚠ 409 Conflict: Another bot instance is running`);
          console.log(`  Waiting ${delaySeconds}s before retry (${retries} attempts left)...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          await deleteWebhook(token);
        } else {
          console.error("❌ Failed after maximum retries. This usually means:");
          console.error("   1. Multiple instances are running on Render (check dashboard)");
          console.error("   2. Bot is running locally on your computer");
          console.error("   3. Another service is using the same bot token");
          throw err;
        }
      } else {
        throw err; // Re-throw if not 409
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
