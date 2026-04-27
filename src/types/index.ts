export type Platform = 'gmail';

export interface Message {
  id: string;
  platform: Platform;
  externalId: string;
  threadId: string | null;
  sender: {
    name: string;
    email?: string;
    platformId?: string;
  };
  subject?: string;
  preview: string;
  content: string;
  channelName?: string;
  isUnread: boolean;
  receivedAt: string;
  thread?: ThreadMessage[];
}

export interface ThreadMessage {
  id: string;
  sender: {
    name: string;
    isMe?: boolean;
  };
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface Integration {
  id: string;
  platform: Platform;
  status: IntegrationStatus;
  lastSyncedAt: string | null;
  platformMetadata: Record<string, unknown>;
  syncError?: string;
}

export interface Task {
  id: string;
  sourceMessageId: string | null;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done' | 'dismissed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
  dueDate?: string;
  tags: string[];
  createdAt: string;
}

export type ActionCategory = 'pending_reply' | 'commitment' | 'delegated' | 'fyi';

export interface ActionItem {
  id: string;
  category: ActionCategory;
  title: string;
  summary: string;
  sourcePlatform: Platform;
  sourceMessageId?: string;
  sender?: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: string;
  delegatedTo?: string;
  createdAt: string;
  isRead: boolean;
}
