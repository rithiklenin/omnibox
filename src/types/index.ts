export type Platform = 'email' | 'slack' | 'whatsapp' | 'linkedin';

export interface Message {
  id: string;
  platform: Platform;
  sender: {
    name: string;
    email?: string;
    avatar?: string;
  };
  subject?: string;
  preview: string;
  content: string;
  timestamp: string;
  isUnread: boolean;
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
  name: string;
  email: string;
  avatar?: string;
}
