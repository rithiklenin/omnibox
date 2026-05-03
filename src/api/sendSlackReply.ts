interface SendSlackReplyParams {
  accessToken: string;
  channelId: string;
  text: string;
  threadTs?: string;
}

export async function sendSlackReply({
  accessToken,
  channelId,
  text,
  threadTs,
}: SendSlackReplyParams): Promise<void> {
  const body: Record<string, string> = {
    channel: channelId,
    text,
  };
  if (threadTs) {
    body.thread_ts = threadTs;
  }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}
