import { supabase } from './supabase';
import type { ActionItem, Integration } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AskOmniContext {
  actions: ActionItem[];
  integrations: Integration[];
}

interface AskOmniResponse {
  content: string;
  error?: string;
}

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Omni, an AI Chief of Staff. You help professionals manage their day by organizing information from their email (Gmail), Slack messages, and meeting notes (Granola).

Your personality:
- Concise and direct — no fluff
- Action-oriented — always suggest next steps
- Warm but professional

You have access to the user's current action items and integration status, provided as context below.

When the user asks you to:
- Plan their day: Prioritize by urgency and deadlines, group related items
- Summarize messages: Be brief, highlight what needs action
- Draft replies: Match a professional but friendly tone, keep it concise
- Track delegated items: Note who owes what and suggest follow-ups
- Find information: Search across all their connected tools

Always reference specific names, dates, and details from the context when available. If you don't have enough information, say so honestly and suggest connecting more tools in Settings.

Format your responses with clear structure. Use line breaks between sections. Don't use markdown headers — just plain text with line breaks.`;

function buildContextBlock(context: AskOmniContext): string {
  let block = '';
  if (context.actions.length > 0) {
    block += '\n\nCurrent action items:\n';
    for (const action of context.actions) {
      const urgencyTag = action.urgency === 'critical' ? '[CRITICAL]' : action.urgency === 'high' ? '[HIGH]' : '';
      const dueTag = action.dueDate ? ` (Due: ${new Date(action.dueDate).toLocaleDateString()})` : '';
      const delegatedTag = action.delegatedTo ? ` [Delegated to: ${action.delegatedTo}]` : '';
      const senderTag = action.sender ? ` from ${action.sender}` : '';
      block += `- [${action.category}] ${urgencyTag} ${action.title}${senderTag}${dueTag}${delegatedTag}\n  "${action.summary}"\n  Source: ${action.sourcePlatform}\n`;
    }
  }

  if (context.integrations.length > 0) {
    block += '\nConnected integrations:\n';
    for (const integration of context.integrations) {
      block += `- ${integration.platform}: ${integration.status}\n`;
    }
  }

  return block;
}

async function callClaudeDirectly(
  messages: ChatMessage[],
  context: AskOmniContext
): Promise<AskOmniResponse> {
  const contextBlock = buildContextBlock(context);

  console.log('[AskOmni] Calling Claude API directly...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[AskOmni] Claude API error:', response.status, errText);
    return { content: '', error: `Claude API error: ${response.status} — ${errText}` };
  }

  const data = await response.json();
  console.log('[AskOmni] Claude response received');
  return { content: data.content?.[0]?.text || 'Sorry, I could not generate a response.' };
}

async function callViaEdgeFunction(
  messages: ChatMessage[],
  context: AskOmniContext
): Promise<AskOmniResponse> {
  const { data, error } = await supabase.functions.invoke('ask-omni', {
    body: { messages, context },
  });

  if (error) {
    return { content: '', error: error.message };
  }

  return { content: data.content };
}

export async function askOmni(
  messages: ChatMessage[],
  context: AskOmniContext
): Promise<AskOmniResponse> {
  // If we have a direct API key (local dev), call Claude directly
  if (ANTHROPIC_API_KEY) {
    return callClaudeDirectly(messages, context);
  }

  // Otherwise try the Supabase Edge Function
  try {
    return await callViaEdgeFunction(messages, context);
  } catch {
    return { content: '', error: 'No AI backend configured. Set VITE_ANTHROPIC_API_KEY in .env for local dev, or deploy the ask-omni Edge Function.' };
  }
}
