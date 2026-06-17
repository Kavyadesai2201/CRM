// /server/services/aiService.js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL     = process.env.AI_MODEL    || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS, 10) || 400;

const SYSTEM_PROMPTS = {
  summary:
    'You are a CRM assistant. Summarize this lead\'s conversation and current pipeline stage ' +
    'into 2-3 plain lines that a sales agent can skim quickly. Be factual and concise. ' +
    'No preamble, no headers, no bullet points — just plain text.',

  suggest_reply:
    'You are a sales assistant drafting a reply on behalf of an agent. ' +
    'Write ONE outbound message draft. ' +
    'WhatsApp tone = casual and short (1-3 sentences max). ' +
    'Instagram tone = friendly and conversational. ' +
    'No preamble, no label, no explanation — output only the draft message text itself.',
};

/**
 * Call Anthropic to generate a summary or reply draft for a lead.
 *
 * @param {Object} opts
 * @param {'summary'|'suggest_reply'} opts.mode
 * @param {Object} opts.lead   — lead row from DB
 * @param {Array}  opts.messages — up to 30 message rows, chronological
 * @returns {Promise<string>}
 */
export async function generateAI({ mode, lead, messages }) {
  const systemPrompt = SYSTEM_PROMPTS[mode];
  if (!systemPrompt) throw new Error(`Unknown AI mode: ${mode}`);

  const channel = messages.find(m => m.channel)?.channel ?? 'whatsapp';
  const thread  = messages.length
    ? messages.map(m => `[${m.direction}] ${m.content}`).join('\n')
    : '(no messages yet)';

  const userContent = mode === 'summary'
    ? `Lead: ${lead.name}${lead.company ? ` (${lead.company})` : ''} — Stage: ${lead.stage}\n\nConversation thread:\n${thread}`
    : `Lead: ${lead.name} — Channel: ${channel}\n\nConversation thread:\n${thread}\n\nDraft the next outbound reply.`;

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userContent }],
  });

  return response.content[0].text.trim();
}
