import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ActionItem } from '../types';

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  payload: {
    headers: GmailHeader[];
  };
  internalDate: string;
}

export interface GmailEmailData {
  id: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  snippet: string;
  receivedAt: string;
  isUnread: boolean;
}

function parseGmailMessage(msg: GmailMessage): GmailEmailData {
  const headers = msg.payload?.headers || [];
  const from = headers.find((h) => h.name === 'From')?.value || '';
  const subject = headers.find((h) => h.name === 'Subject')?.value || '(no subject)';

  const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
  const senderName = senderMatch ? senderMatch[1].replace(/"/g, '').trim() : from.split('@')[0];
  const senderEmail = senderMatch ? senderMatch[2] : from;

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject,
    senderName,
    senderEmail,
    snippet: msg.snippet || '',
    receivedAt: new Date(parseInt(msg.internalDate)).toISOString(),
    isUnread: msg.labelIds?.includes('UNREAD') ?? false,
  };
}

function emailToAction(email: GmailEmailData): ActionItem {
  return {
    id: `gmail-${email.id}`,
    category: 'pending_reply',
    title: `Reply to ${email.senderName}: ${email.subject}`,
    summary: email.snippet,
    sourcePlatform: 'gmail',
    sourceMessageId: email.id,
    sender: email.senderName,
    urgency: 'medium',
    createdAt: email.receivedAt,
    isRead: !email.isUnread,
  };
}

export function useGmailMessages() {
  const { googleAccessToken, user } = useAuth();
  const [gmailActions, setGmailActions] = useState<ActionItem[]>([]);
  const [emails, setEmails] = useState<GmailEmailData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadEmails = useCallback(async () => {
    if (!googleAccessToken) return;

    setLoading(true);
    setError(null);

    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=20',
        { headers: { Authorization: `Bearer ${googleAccessToken}` } }
      );

      if (!listRes.ok) {
        const errText = await listRes.text();
        throw new Error(`Gmail API error ${listRes.status}: ${errText}`);
      }

      const listData = await listRes.json();
      const messageIds: string[] = (listData.messages || []).map((m: { id: string }) => m.id);

      if (messageIds.length === 0) {
        setGmailActions([]);
        setEmails([]);
        setLoading(false);
        return;
      }

      const messages = await Promise.all(
        messageIds.map(async (id) => {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${googleAccessToken}` } }
          );
          if (!res.ok) return null;
          return res.json() as Promise<GmailMessage>;
        })
      );

      const parsed = messages
        .filter((m): m is GmailMessage => m !== null)
        .map(parseGmailMessage)
        .filter((e) => e.senderEmail.toLowerCase() !== (user?.email || '').toLowerCase());

      setEmails(parsed);
      setGmailActions(parsed.map(emailToAction));
    } catch (err) {
      console.error('Failed to fetch Gmail messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [googleAccessToken, user?.email]);

  useEffect(() => {
    fetchUnreadEmails();
  }, [fetchUnreadEmails]);

  return { gmailActions, emails, loading, error, refetch: fetchUnreadEmails };
}
