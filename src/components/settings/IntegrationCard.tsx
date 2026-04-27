import type { Integration, Platform } from '../../types';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}

const platformConfig: Record<
  Platform,
  { name: string; description: string; color: string; icon: JSX.Element }
> = {
  gmail: {
    name: 'Gmail',
    description: 'Connect your Gmail account to sync emails and send replies',
    color: 'red',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12z" fill="#EA4335" />
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#EA4335" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  slack: {
    name: 'Slack',
    description: 'Connect Slack to monitor channels and direct messages',
    color: 'purple',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path d="M14.5 2a1.5 1.5 0 100 3h1.5v1.5a1.5 1.5 0 103 0V3.5a1.5 1.5 0 00-1.5-1.5h-3z" fill="#E01E5A" />
        <path d="M2 14.5a1.5 1.5 0 013 0V16h1.5a1.5 1.5 0 010 3H3.5A1.5 1.5 0 012 17.5v-3z" fill="#36C5F0" />
        <path d="M9.5 22a1.5 1.5 0 100-3H8v-1.5a1.5 1.5 0 10-3 0v3A1.5 1.5 0 006.5 22h3z" fill="#2EB67D" />
        <path d="M22 9.5a1.5 1.5 0 01-3 0V8h-1.5a1.5 1.5 0 010-3h3A1.5 1.5 0 0122 6.5v3z" fill="#ECB22E" />
        <path d="M5 9.5A1.5 1.5 0 016.5 8H8V6.5a1.5 1.5 0 113 0v3A1.5 1.5 0 019.5 11h-3A1.5 1.5 0 015 9.5z" fill="#36C5F0" />
        <path d="M14.5 19a1.5 1.5 0 01-1.5-1.5V16h1.5a1.5 1.5 0 010 3z" fill="#2EB67D" />
        <path d="M19 14.5a1.5 1.5 0 01-1.5 1.5H16v-1.5a1.5 1.5 0 113 0z" fill="#ECB22E" />
        <path d="M9.5 5A1.5 1.5 0 0111 6.5V8H9.5a1.5 1.5 0 010-3z" fill="#E01E5A" />
      </svg>
    ),
  },
  granola: {
    name: 'Granola',
    description: 'Import meeting notes from Granola via email forwarding',
    color: 'amber',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

const statusBadge: Record<
  Integration['status'],
  { label: string; className: string }
> = {
  connected: {
    label: 'Connected',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  disconnected: {
    label: 'Not connected',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  syncing: {
    label: 'Syncing...',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  error: {
    label: 'Error',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const config = platformConfig[integration.platform];
  const badge = statusBadge[integration.status];
  const isConnected = integration.status === 'connected' || integration.status === 'syncing';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {config.name}
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {config.description}
            </p>
            {isConnected && integration.lastSyncedAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
              </p>
            )}
            {integration.syncError && (
              <p className="text-xs text-red-500 mt-2">
                {integration.syncError}
              </p>
            )}
          </div>
        </div>

        <div>
          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
