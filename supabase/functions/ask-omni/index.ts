// Supabase Edge Function: Ask Omni — Claude-powered AI assistant
//
// Expects: POST { messages: [{role, content}], context: { actions, integrations } }
// Requires: ANTHROPIC_API_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, context } = await req.json();

    // Build context block from user's data
    let contextBlock = '';
    if (context?.actions?.length > 0) {
      contextBlock += '\n\nCurrent action items:\n';
      for (const action of context.actions) {
        const urgencyTag = action.urgency === 'critical' ? '[CRITICAL]' : action.urgency === 'high' ? '[HIGH]' : '';
        const dueTag = action.dueDate ? ` (Due: ${new Date(action.dueDate).toLocaleDateString()})` : '';
        const delegatedTag = action.delegatedTo ? ` [Delegated to: ${action.delegatedTo}]` : '';
        const senderTag = action.sender ? ` from ${action.sender}` : '';
        contextBlock += `- [${action.category}] ${urgencyTag} ${action.title}${senderTag}${dueTag}${delegatedTag}\n  "${action.summary}"\n  Source: ${action.sourcePlatform}\n`;
      }
    }

    if (context?.integrations?.length > 0) {
      contextBlock += '\nConnected integrations:\n';
      for (const integration of context.integrations) {
        contextBlock += `- ${integration.platform}: ${integration.status}\n`;
      }
    }

    const systemMessage = SYSTEM_PROMPT + contextBlock;

    // Map messages to Claude format
    const claudeMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemMessage,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}`, details: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
