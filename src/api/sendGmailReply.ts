interface SendReplyParams {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  threadId: string;
  messageId: string;
}

function buildRawEmail({ to, subject, body, messageId }: SendReplyParams): string {
  const headers = [
    `To: ${to}`,
    `Subject: Re: ${subject.replace(/^Re:\s*/i, '')}`,
    `In-Reply-To: ${messageId}`,
    `References: ${messageId}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(headers)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailReply(params: SendReplyParams): Promise<void> {
  const raw = buildRawEmail(params);

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw, threadId: params.threadId }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail send error ${response.status}: ${errText}`);
  }
}
