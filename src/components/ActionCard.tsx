import { useState } from 'react';
import type { ActionItem } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { formatRelativeTime } from '../utils/date';

interface ActionCardProps {
  action: ActionItem;
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
  onGenerateReply?: () => void;
  showReplyButton?: boolean;
}

const urgencyConfig = {
  critical: { label: '!!', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: '!', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: '', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: '', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

export function ActionCard({ action, onMarkDone, onDismiss, onGenerateReply, showReplyButton }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const urgency = urgencyConfig[action.urgency];

  return (
    <div
      className={`
        group bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 cursor-pointer
        ${action.isRead
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20'
        }
        hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm
      `}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Urgency indicator */}
          <div className="flex-shrink-0 mt-0.5">
            {(action.urgency === 'critical' || action.urgency === 'high') ? (
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${urgency.className}`}>
                {urgency.label}
              </span>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${action.urgency === 'medium' ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-medium truncate ${action.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                {action.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {action.summary}
            </p>
          </div>

          {/* Right side: platform + time */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <PlatformIcon platform={action.sourcePlatform} className="w-4 h-4" />
            {action.dueDate && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                Due {new Date(action.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {action.delegatedTo && (
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Waiting
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {formatRelativeTime(action.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {action.summary}
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-4">
            {action.sender && <span>From: {action.sender}</span>}
            {action.sender && action.sourcePlatform && <span>·</span>}
            <PlatformIcon platform={action.sourcePlatform} className="w-3 h-3" />
            <span className="capitalize">{action.sourcePlatform}</span>
            {action.dueDate && (
              <>
                <span>·</span>
                <span className="text-amber-600 dark:text-amber-400">
                  Due {new Date(action.dueDate).toLocaleDateString()}
                </span>
              </>
            )}
            {action.delegatedTo && (
              <>
                <span>·</span>
                <span>Delegated to {action.delegatedTo}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onMarkDone(action.id); }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            >
              Mark done
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(action.id); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Dismiss
            </button>
            {showReplyButton && onGenerateReply && (
              <button
                onClick={(e) => { e.stopPropagation(); onGenerateReply(); }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Draft reply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
