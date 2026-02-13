#!/usr/bin/env node
/**
 * Delete Telegram webhook to use long polling instead
 * Run: BOT_TOKEN=your_token node scripts/delete-webhook.js
 */

const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable is required");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`;

https
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      const response = JSON.parse(data);
      if (response.ok) {
        console.log("✅ Webhook deleted successfully");
        console.log("   You can now use long polling");
      } else {
        console.error("❌ Failed to delete webhook:", response.description);
      }
    });
  })
  .on("error", (err) => {
    console.error("❌ Request failed:", err.message);
    process.exit(1);
  });
