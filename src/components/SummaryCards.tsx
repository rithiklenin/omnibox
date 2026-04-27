import type { ActionItem, Integration } from '../types';

interface SummaryCardsProps {
  actions: ActionItem[];
  integrations: Integration[];
}

export function SummaryCards({ actions, integrations }: SummaryCardsProps) {
  const pendingReply = actions.filter((a) => a.category === 'pending_reply').length;
  const commitments = actions.filter((a) => a.category === 'commitment').length;
  const delegated = actions.filter((a) => a.category === 'delegated').length;
  const total = actions.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Today's Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Today's Summary
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Items need your reply</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{pendingReply}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Commitments to fulfill</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{commitments}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Delegated tasks waiting</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{delegated}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total items</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connections */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Connections
          </h3>
          <a
            href="/settings"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Manage
          </a>
        </div>
        <div className="space-y-2.5">
          {integrations.map((integration) => {
            const isConnected = integration.status === 'connected' || integration.status === 'syncing';
            return (
              <div key={integration.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {integration.platform}
                  </span>
                </div>
                <span className={`text-xs ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            );
          })}
          {integrations.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No integrations configured.{' '}
              <a href="/settings" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Connect now
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
