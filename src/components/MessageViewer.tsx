import { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { PlatformIcon, getPlatformLabel } from './PlatformIcon';
import { formatRelativeTime, formatFullDate } from '../utils/date';

interface MessageViewerProps {
  message: Message | null;
  onClose: () => void;
  isMobile: boolean;
}

export function MessageViewer({ message, onClose, isMobile }: MessageViewerProps) {
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message]);

  if (!message) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Select a message to view</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Choose a message from the list to see its contents</p>
        </div>
      </div>
    );
  }

  const handleReply = () => {
    if (replyText.trim()) {
      alert(`Reply sent: "${replyText}"\n\n(This is a demo - no actual message was sent)`);
      setReplyText('');
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <PlatformIcon platform={message.platform} className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {getPlatformLabel(message.platform)}
            </span>
          </div>
        </div>
        {!isMobile && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Message Info */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
              {message.sender.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{message.sender.name}</p>
            {message.sender.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{message.sender.email}</p>
            )}
          </div>
        </div>
        {message.subject && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
            {message.subject}
          </h2>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {formatFullDate(message.receivedAt)}
        </p>
      </div>

      {/* Thread / Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {message.thread && message.thread.length > 0 ? (
          message.thread.map((threadMessage) => (
            <div
              key={threadMessage.id}
              className={`flex ${threadMessage.sender.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] p-3 rounded-lg animate-fade-in
                  ${threadMessage.sender.isMe
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }
                `}
              >
                {!threadMessage.sender.isMe && (
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {threadMessage.sender.name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{threadMessage.content}</p>
                <p className={`text-xs mt-2 ${threadMessage.sender.isMe ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatRelativeTime(threadMessage.timestamp)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40 animate-slide-in-right">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 border-l border-gray-200 dark:border-gray-700 animate-slide-in-right">
      {content}
    </div>
  );
}
