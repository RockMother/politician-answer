import { Bot, Context } from "grammy";
import { generateOppositeReply } from "./openai";
import {
  getSystemPrompt,
  setSystemPrompt,
  resetSystemPrompt,
  getAdminUserIds,
} from "./config";

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // ── /start and /help ──────────────────────────────────────────────
  bot.command("start", (ctx) =>
    ctx.reply(
      "Hey! Reply to any political message in this chat and tag me " +
        `(@${ctx.me.username}) — I'll generate a strong opposing argument.`
    )
  );

  bot.command("help", (ctx) =>
    ctx.reply(
      "How to use:\n" +
        "1. Find a political post in this chat.\n" +
        "2. Reply to it and mention me in your message.\n" +
        "3. I'll respond with a fierce counter-argument.\n\n" +
        "Admin commands:\n" +
        "/setprompt <text> — set a custom system prompt\n" +
        "/resetprompt — reset to the default prompt\n" +
        "/getprompt — show the current system prompt"
    )
  );

  // ── Admin: /setprompt ─────────────────────────────────────────────
  bot.command("setprompt", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("You are not authorized to change the prompt.");
    }

    const text = ctx.match?.trim();
    if (!text) {
      return ctx.reply("Usage: /setprompt <your new system prompt>");
    }

    setSystemPrompt(text);
    return ctx.reply("System prompt updated.");
  });

  // ── Admin: /resetprompt ───────────────────────────────────────────
  bot.command("resetprompt", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("You are not authorized to reset the prompt.");
    }

    resetSystemPrompt();
    return ctx.reply("System prompt reset to default.");
  });

  // ── Admin: /getprompt ─────────────────────────────────────────────
  bot.command("getprompt", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("You are not authorized to view the prompt.");
    }

    const prompt = getSystemPrompt();
    // Telegram message limit is 4096 — truncate if needed
    const display =
      prompt.length > 4000 ? prompt.slice(0, 4000) + "\n\n[truncated]" : prompt;
    return ctx.reply(`Current system prompt:\n\n${display}`);
  });

  // ── Main handler: reply + mention → generate opposing argument ────
  bot.on("message", async (ctx) => {
    console.log("Received message:", {
      messageId: ctx.message.message_id,
      chatId: ctx.chat?.id,
      chatType: ctx.chat?.type,
      from: ctx.from?.username,
      text: ctx.message.text?.substring(0, 100),
      hasReply: !!ctx.message.reply_to_message,
    });

    if (!isBotMentionedInReply(ctx)) {
      console.log("Bot not mentioned in reply, ignoring");
      return;
    }

    console.log("Bot mentioned! Processing...");

    const originalMessage = ctx.message.reply_to_message;
    const postText =
      originalMessage?.text || originalMessage?.caption || null;

    if (!postText) {
      return ctx.reply("I can only argue against text messages.", {
        reply_parameters: { message_id: ctx.message.message_id },
      });
    }

    try {
      // Send a "typing" indicator while we wait for OpenAI
      await ctx.replyWithChatAction("typing");

      const systemPrompt = getSystemPrompt();
      const oppositeReply = await generateOppositeReply(systemPrompt, postText);

      // Reply to the ORIGINAL post (not to the user who tagged us)
      await ctx.reply(oppositeReply, {
        reply_parameters: {
          message_id: originalMessage!.message_id,
        },
      });
      
      console.log("Successfully sent reply");
    } catch (error) {
      console.error("Failed to generate reply:", error);
      await ctx.reply("Something went wrong while generating a response.", {
        reply_parameters: { message_id: ctx.message.message_id },
      });
    }
  });

  return bot;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Check if the current message is a reply to another message
 * AND mentions the bot by @username in the message entities.
 */
function isBotMentionedInReply(ctx: Context): boolean {
  const msg = ctx.message;
  if (!msg || !msg.reply_to_message) return false;

  const botUsername = ctx.me.username.toLowerCase();
  const text = msg.text || msg.caption || "";
  const entities = msg.entities || msg.caption_entities || [];

  console.log("Checking mention:", {
    hasReply: !!msg.reply_to_message,
    botUsername,
    text,
    entitiesCount: entities.length,
    entityTypes: entities.map((e) => e.type),
  });

  for (const entity of entities) {
    // Check for @mention (e.g. @BotUsername)
    if (entity.type === "mention" && text) {
      const mentionText = text
        .slice(entity.offset, entity.offset + entity.length)
        .toLowerCase();
      console.log("Found mention:", mentionText);
      if (mentionText === `@${botUsername}`) {
        return true;
      }
    }

    // Check for text_mention (clickable user mention)
    if (entity.type === "text_mention" && entity.user) {
      console.log("Found text_mention:", entity.user.username);
      if (entity.user.username?.toLowerCase() === botUsername) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if the user is in the admin list.
 * If no admins are configured, nobody can use admin commands.
 */
function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const admins = getAdminUserIds();
  // If no admins configured, allow anyone (so the first user can set it up)
  if (admins.length === 0) return true;

  return admins.includes(userId);
}
