import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ActionItem } from '../types';

export interface SlackMessageData {
  id: string;
  channelId: string;
  channelName: string;
  senderName: string;
  senderPlatformId: string;
  content: string;
  preview: string;
  threadTs: string | null;
  receivedAt: string;
  isUnread: boolean;
  isDm: boolean;
}

function slackMessageToAction(msg: SlackMessageData): ActionItem {
  const title = msg.isDm
    ? `Reply to ${msg.senderName}`
    : `Reply to ${msg.senderName} in #${msg.channelName}`;

  return {
    id: `slack-${msg.id}`,
    category: 'pending_reply',
    title,
    summary: msg.preview,
    sourcePlatform: 'slack',
    sourceMessageId: msg.id,
    sender: msg.senderName,
    urgency: 'medium',
    createdAt: msg.receivedAt,
    isRead: !msg.isUnread,
  };
}

export function useSlackMessages() {
  const { slackAccessToken, user } = useAuth();
  const [slackActions, setSlackActions] = useState<ActionItem[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlackMessages = useCallback(async () => {
    if (!slackAccessToken) return;

    setLoading(true);
    setError(null);

    try {
      const userCache: Record<string, string> = {};
      const usersRes = await fetch('https://slack.com/api/users.list?limit=200', {
        headers: { Authorization: `Bearer ${slackAccessToken}` },
      });
      const usersData = await usersRes.json();
      if (usersData.ok) {
        for (const u of usersData.members || []) {
          userCache[u.id] = u.real_name || u.name || u.id;
        }
      }

      let authUserId: string | null = null;
      const authRes = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${slackAccessToken}` },
      });
      const authData = await authRes.json();
      if (authData.ok) {
        authUserId = authData.user_id;
      }

      const convRes = await fetch(
        'https://slack.com/api/conversations.list?types=public_channel,private_channel,im,mpim&limit=50',
        { headers: { Authorization: `Bearer ${slackAccessToken}` } }
      );
      const convData = await convRes.json();
      if (!convData.ok) {
        throw new Error(`Slack API error: ${convData.error}`);
      }

      const allMessages: SlackMessageData[] = [];
      const oneDayAgo = String((Date.now() - 24 * 60 * 60 * 1000) / 1000);

      for (const channel of (convData.channels || []).slice(0, 20)) {
        const histUrl = new URL('https://slack.com/api/conversations.history');
        histUrl.searchParams.set('channel', channel.id);
        histUrl.searchParams.set('oldest', oneDayAgo);
        histUrl.searchParams.set('limit', '10');

        const histRes = await fetch(histUrl.toString(), {
          headers: { Authorization: `Bearer ${slackAccessToken}` },
        });
        const histData = await histRes.json();
        if (!histData.ok) continue;

        for (const msg of histData.messages || []) {
          if (msg.subtype && msg.subtype !== 'bot_message') continue;
          if (msg.user === authUserId) continue;

          const text = msg.text || '';
          const isDm = !!channel.is_im;

          allMessages.push({
            id: `${channel.id}-${msg.ts}`,
            channelId: channel.id,
            channelName: channel.name || 'DM',
            senderName: userCache[msg.user] || msg.username || 'Unknown',
            senderPlatformId: msg.user || '',
            content: text,
            preview: text.slice(0, 200),
            threadTs: msg.thread_ts || null,
            receivedAt: new Date(parseFloat(msg.ts) * 1000).toISOString(),
            isUnread: true,
            isDm,
          });
        }
      }

      allMessages.sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );

      const limited = allMessages.slice(0, 20);
      setSlackMessages(limited);
      setSlackActions(limited.map(slackMessageToAction));
    } catch (err) {
      console.error('Failed to fetch Slack messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Slack messages');
    } finally {
      setLoading(false);
    }
  }, [slackAccessToken, user?.email]);

  useEffect(() => {
    fetchSlackMessages();
  }, [fetchSlackMessages]);

  return { slackActions, slackMessages, loading, error, refetch: fetchSlackMessages };
}
