#!/usr/bin/env node
/**
 * Check bot webhook status and info
 * Run: BOT_TOKEN=your_token node scripts/check-bot-status.js
 */

const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable is required");
  process.exit(1);
}

function makeRequest(method) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("🤖 Checking bot status...\n");

  // Check bot info
  const botInfo = await makeRequest("getMe");
  if (botInfo.ok) {
    console.log("✅ Bot Info:");
    console.log(`   Username: @${botInfo.result.username}`);
    console.log(`   Name: ${botInfo.result.first_name}`);
    console.log(`   ID: ${botInfo.result.id}`);
  }

  console.log();

  // Check webhook info
  const webhookInfo = await makeRequest("getWebhookInfo");
  if (webhookInfo.ok) {
    const info = webhookInfo.result;
    console.log("🔗 Webhook Status:");
    console.log(`   URL: ${info.url || "(none - using long polling)"}`);
    console.log(`   Pending updates: ${info.pending_update_count || 0}`);
    
    if (info.last_error_date) {
      const errorDate = new Date(info.last_error_date * 1000);
      console.log(`   ⚠️  Last error: ${info.last_error_message}`);
      console.log(`   ⚠️  Error time: ${errorDate.toISOString()}`);
    }

    if (info.url) {
      console.log("\n⚠️  WARNING: Webhook is set! This will conflict with long polling.");
      console.log("   Run: BOT_TOKEN=your_token node scripts/delete-webhook.js");
    } else {
      console.log("\n✅ No webhook set. Long polling should work.");
    }
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
