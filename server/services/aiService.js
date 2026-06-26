import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

function buildPrompt(mode, lead, messages) {
  const transcript = messages
    .map((m) => `[${m.direction}] ${m.content}`)
    .join("\n");

  if (mode === "summary") {
    return `You are a CRM assistant. Summarize this lead's conversation in 2-3 plain lines, including their current stage ("${lead.stage}").\n\nConversation:\n${transcript}`;
  }

  if (mode === "suggest_reply") {
    const channelTone =
      lead.source === "instagram"
        ? "friendly and casual, suitable for an Instagram DM"
        : "short and casual, suitable for a WhatsApp message";
    return `You are a sales agent assistant. Based on this conversation, draft ONE outbound reply message. Tone: ${channelTone}. Only output the message text, nothing else.\n\nConversation:\n${transcript}`;
  }

  throw new Error("Invalid mode");
}

export async function generateAI({ mode, lead, messages }) {
  const prompt = buildPrompt(mode, lead, messages);

  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return text.trim();
}