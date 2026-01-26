import type { Message } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { formatRelativeTime } from '../utils/date';

interface MessageListProps {
  messages: Message[];
  selectedMessageId: string | null;
  onSelectMessage: (message: Message) => void;
}

export function MessageList({ messages, selectedMessageId, onSelectMessage }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No messages found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {messages.map((message) => {
        const isSelected = selectedMessageId === message.id;

        return (
          <button
            key={message.id}
            onClick={() => onSelectMessage(message)}
            className={`
              message-item w-full text-left p-4 border-b border-gray-100 dark:border-gray-700/50
              transition-colors duration-150
              ${isSelected
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
              }
              ${message.isUnread ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-850'}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Platform Icon */}
              <div className="flex-shrink-0 mt-1">
                <PlatformIcon platform={message.platform} className="w-5 h-5" />
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-medium truncate ${message.isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {message.sender.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatRelativeTime(message.timestamp)}
                  </span>
                </div>

                {message.subject && (
                  <p className={`text-sm truncate mb-1 ${message.isUnread ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                    {message.subject}
                  </p>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {message.preview}
                </p>
              </div>

              {/* Unread indicator */}
              {message.isUnread && (
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
