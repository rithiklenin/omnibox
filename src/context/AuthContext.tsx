import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, getAppUrl } from '../api/supabase';
import type { User } from '../types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  googleAccessToken: string | null;
  slackAccessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  connectSlack: () => void;
  disconnectSlack: () => void;
  setSlackToken: (token: string) => void;
  signInDemo: (email: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(su: SupabaseUser): User {
  return {
    id: su.id,
    name: su.user_metadata?.full_name || su.email?.split('@')[0] || 'User',
    email: su.email || '',
    avatar: su.user_metadata?.avatar_url,
  };
}

const SLACK_TOKEN_KEY = 'omnibox_slack_token';
const GOOGLE_TOKEN_KEY = 'omnibox_google_token';
const DEMO_USER_KEY = 'omnibox_demo_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    () => localStorage.getItem(GOOGLE_TOKEN_KEY)
  );
  const [slackAccessToken, setSlackAccessToken] = useState<string | null>(
    () => localStorage.getItem(SLACK_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        const storedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (storedDemo) {
          try {
            setUser(JSON.parse(storedDemo));
          } catch {}
        }
      }
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
        localStorage.setItem(GOOGLE_TOKEN_KEY, session.provider_token);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
        localStorage.setItem(GOOGLE_TOKEN_KEY, session.provider_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes:
          'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
        redirectTo: `${getAppUrl()}/`,
      },
    });
  };

  const connectSlack = () => {
    const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_SLACK_CLIENT_ID is not set');
      alert('Slack integration is not configured. Please contact support.');
      return;
    }
    const scopes = 'channels:history,channels:read,im:history,im:read,mpim:history,mpim:read,groups:history,groups:read,users:read,chat:write';
    const redirectUri = `${getAppUrl()}/slack/callback`;
    window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const disconnectSlack = () => {
    setSlackAccessToken(null);
    localStorage.removeItem(SLACK_TOKEN_KEY);
  };

  const setSlackToken = (token: string) => {
    setSlackAccessToken(token);
    localStorage.setItem(SLACK_TOKEN_KEY, token);
  };

  const signInDemo = (email: string) => {
    const name = email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const demoUser = { id: 'demo', name, email };
    setUser(demoUser);
    setSession(null);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  };

  const logout = async () => {
    const userId = user?.id;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setGoogleAccessToken(null);
    setSlackAccessToken(null);
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(SLACK_TOKEN_KEY);
    if (userId) {
      localStorage.removeItem(`omnibox_${userId}_tasks`);
      localStorage.removeItem(`omnibox_${userId}_fingerprint`);
    }
    localStorage.removeItem('omnibox_integrations');
    localStorage.removeItem(DEMO_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        googleAccessToken,
        slackAccessToken,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        connectSlack,
        disconnectSlack,
        setSlackToken,
        signInDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
