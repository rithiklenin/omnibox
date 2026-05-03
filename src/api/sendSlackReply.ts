import { slackApi } from './slackProxy';

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
  const params: Record<string, string> = {
    channel: channelId,
    text,
  };
  if (threadTs) {
    params.thread_ts = threadTs;
  }

  const data = await slackApi(accessToken, 'chat.postMessage', params) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}
