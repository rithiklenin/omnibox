import type { ReactNode } from 'react';
import type { Integration, Platform } from '../../types';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}

const platformConfig: Record<
  Platform,
  { name: string; description: string; color: string; icon: ReactNode }
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
