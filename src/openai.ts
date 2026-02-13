import OpenAI from "openai";
import { getOpenAIModel } from "./config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TELEGRAM_LENGTH = 4096;

/**
 * Generate a strong opposing reply to the given political statement.
 * Uses the configurable system prompt and OpenAI chat completion.
 */
export async function generateOppositeReply(
  systemPrompt: string,
  postText: string
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: getOpenAIModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: postText },
    ],
    temperature: 0.9,
    max_tokens: 1024,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("OpenAI returned an empty response");
  }

  // Truncate if the reply exceeds Telegram's message length limit
  if (reply.length > MAX_TELEGRAM_LENGTH) {
    return reply.slice(0, MAX_TELEGRAM_LENGTH - 3) + "...";
  }

  return reply;
}
