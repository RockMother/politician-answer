import fs from "fs";
import path from "path";

const DEFAULT_PROMPT = `You are a fierce political debater. When given a political or public statement, you must take the **opposite** position and argue against it as strongly and convincingly as possible.

Rules:
- Be direct, sharp, and unapologetic in your counter-argument.
- Use facts, logic, and rhetoric to dismantle the original statement.
- Keep your reply concise — no longer than 2-3 short paragraphs, suitable for a Telegram message.
- Do NOT use hedging language like "on the other hand" or "some might say". State your opposing view as absolute truth.
- Match the language of the original message (if it's in Ukrainian, reply in Ukrainian; if English, reply in English; etc.).`;

/** In-memory prompt that can be updated at runtime via /setprompt */
let runtimePrompt: string | null = null;

function loadPromptFromFile(): string | null {
  const filePath = process.env.PROMPT_FILE || path.join(process.cwd(), "config", "prompt.txt");
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return null;
  }
}

/** Returns the current system prompt (runtime > env > file > default) */
export function getSystemPrompt(): string {
  if (runtimePrompt) return runtimePrompt;
  if (process.env.OPENAI_SYSTEM_PROMPT) return process.env.OPENAI_SYSTEM_PROMPT;
  return loadPromptFromFile() || DEFAULT_PROMPT;
}

/** Update the prompt at runtime (used by /setprompt command) */
export function setSystemPrompt(prompt: string): void {
  runtimePrompt = prompt;
}

/** Reset runtime prompt so it falls back to env/file/default again */
export function resetSystemPrompt(): void {
  runtimePrompt = null;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getAdminUserIds(): number[] {
  const raw = process.env.ADMIN_USER_IDS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !isNaN(n));
}

export function getPort(): number {
  return parseInt(process.env.PORT || "3000", 10);
}

export function isBackgroundWorkerMode(): boolean {
  return process.env.WORKER_MODE === "true" || process.env.WORKER_MODE === "1";
}

export function getRetryDelay(): number {
  return parseInt(process.env.RETRY_DELAY_MS || "10000", 10);
}

export function getMaxRetries(): number {
  return parseInt(process.env.MAX_RETRIES || "10", 10);
}
