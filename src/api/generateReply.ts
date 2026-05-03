const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

interface GenerateReplyParams {
  senderName: string;
  subject: string;
  emailContent: string;
  userName: string;
  platform?: 'gmail' | 'slack';
  channelName?: string;
}

export async function generateReply({
  senderName,
  subject,
  emailContent,
  userName,
  platform = 'gmail',
  channelName,
}: GenerateReplyParams): Promise<string> {
  const isSlack = platform === 'slack';

  if (!ANTHROPIC_API_KEY) {
    if (isSlack) {
      return `Hey ${senderName}, thanks for the message! I'll take a look and get back to you shortly.`;
    }
    return `Hi ${senderName},\n\nThank you for your email. I'll review this and get back to you shortly.\n\nBest,\n${userName}`;
  }

  const systemPrompt = isSlack
    ? `You are a professional Slack message assistant. Generate a concise, friendly reply to the Slack message below. Keep it casual and appropriate for Slack — no formal sign-offs, no subject lines. Use short paragraphs. Do not use email conventions.`
    : `You are a professional email assistant. Generate a concise, friendly reply to the email below. Do NOT include a subject line. Just write the body of the reply. Sign off as "${userName}".`;

  const userContent = isSlack
    ? `From: ${senderName}${channelName ? ` in #${channelName}` : ''}\n\n${emailContent}\n\nDraft a reply to this Slack message.`
    : `From: ${senderName}\nSubject: ${subject}\n\n${emailContent}\n\nDraft a reply to this email.`;

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
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Could not generate reply.';
}
