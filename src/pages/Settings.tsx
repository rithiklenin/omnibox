import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIntegrations } from '../hooks/useIntegrations';
import type { Integration, Platform } from '../types';

const platformConfig: Record<
  Platform,
  { name: string; description: string; icon: ReactNode; connectLabel: string }
> = {
  gmail: {
    name: 'Gmail',
    description: 'Sync your Gmail inbox to surface emails that need replies and extract action items.',
    connectLabel: 'Sign in with Google',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12z" fill="#EA4335" />
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#EA4335" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  slack: {
    name: 'Slack',
    description: 'Sync your Slack messages to surface DMs and channel mentions that need replies.',
    connectLabel: 'Connect Slack',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
      </svg>
    ),
  },
};

const statusBadge: Record<Integration['status'], { label: string; className: string }> = {
  connected: { label: 'Connected', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  disconnected: { label: 'Not connected', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  syncing: { label: 'Syncing...', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  error: { label: 'Error', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function ConnectGmailModal({ onConnect, onClose }: { onConnect: (email: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          {platformConfig.gmail.icon}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect Gmail</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          In production, this would redirect to Google OAuth. For now, enter your Gmail address to simulate the connection.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && email.trim() && onConnect(email.trim())}
        />
        <div className="flex gap-3">
          <button
            onClick={() => email.trim() && onConnect(email.trim())}
            disabled={!email.trim()}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Connect
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const { user, logout, connectSlack, disconnectSlack, slackAccessToken, googleAccessToken } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { integrations, connectPlatform, disconnectIntegration } = useIntegrations();
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (googleAccessToken && user?.email) {
      connectPlatform('gmail', { email: user.email });
    }
  }, [googleAccessToken, user?.email, connectPlatform]);

  useEffect(() => {
    if (slackAccessToken) {
      connectPlatform('slack', { workspace: 'Connected' });
    }
  }, [slackAccessToken, connectPlatform]);

  const handleConnectGmail = (email: string) => {
    connectPlatform('gmail', { email });
    setConnectingPlatform(null);
  };

  const handleConnectSlack = () => {
    connectSlack();
  };

  const handleDisconnectSlack = () => {
    disconnectSlack();
    disconnectIntegration('slack');
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Profile */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Profile</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Integrations</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Connect your tools so Omni can help organize your day.</p>

          <div className="space-y-3">
            {integrations.map((integration) => {
              const config = platformConfig[integration.platform];
              if (!config) return null;
              const badge = statusBadge[integration.status];
              const isConnected = integration.status === 'connected' || integration.status === 'syncing';

              return (
                <div
                  key={integration.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{config.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
                      {isConnected && integration.platformMetadata ? (
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          {integration.platformMetadata.email ? (
                            <span>{String(integration.platformMetadata.email)}</span>
                          ) : null}
                          {integration.platformMetadata.workspace ? (
                            <span>{String(integration.platformMetadata.workspace)}</span>
                          ) : null}
                          {integration.lastSyncedAt ? (
                            <span>Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0">
                      {isConnected || (integration.platform === 'slack' && slackAccessToken) || (integration.platform === 'gmail' && googleAccessToken) ? (
                        integration.platform === 'slack' ? (
                          <button
                            onClick={handleDisconnectSlack}
                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <span className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                            Connected via Google
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (integration.platform === 'slack') {
                              handleConnectSlack();
                            } else {
                              setConnectingPlatform(integration.platform);
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          {config.connectLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Connect modals */}
      {connectingPlatform === 'gmail' && (
        <ConnectGmailModal onConnect={handleConnectGmail} onClose={() => setConnectingPlatform(null)} />
      )}
    </div>
  );
}
