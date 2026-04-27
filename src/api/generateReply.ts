const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

interface GenerateReplyParams {
  senderName: string;
  subject: string;
  emailContent: string;
  userName: string;
}

export async function generateReply({
  senderName,
  subject,
  emailContent,
  userName,
}: GenerateReplyParams): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return `Hi ${senderName},\n\nThank you for your email. I'll review this and get back to you shortly.\n\nBest,\n${userName}`;
  }

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
      system: `You are a professional email assistant. Generate a concise, friendly reply to the email below. Do NOT include a subject line. Just write the body of the reply. Sign off as "${userName}".`,
      messages: [
        {
          role: 'user',
          content: `From: ${senderName}\nSubject: ${subject}\n\n${emailContent}\n\nDraft a reply to this email.`,
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
