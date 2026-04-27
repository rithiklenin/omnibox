-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OAuth tokens for each connected platform
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('gmail', 'slack', 'granola')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  platform_user_id TEXT,
  platform_metadata JSONB DEFAULT '{}',
  sync_cursor TEXT,
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Normalized messages from all platforms
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  thread_id TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_platform_id TEXT,
  subject TEXT,
  preview TEXT,
  content TEXT NOT NULL,
  channel_name TEXT,
  is_unread BOOLEAN DEFAULT true,
  received_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_user_received ON public.messages(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(user_id, is_unread) WHERE is_unread = true;

-- Extracted tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  priority_score NUMERIC(5,2) DEFAULT 50,
  due_date TIMESTAMPTZ,
  tags TEXT[],
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);

-- Contacts / sender importance
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  platform_ids JSONB DEFAULT '{}',
  importance_score NUMERIC(3,2) DEFAULT 0.5,
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON public.users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can manage their own integrations" ON public.integrations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own messages" ON public.messages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own contacts" ON public.contacts
  FOR ALL USING (user_id = auth.uid());
