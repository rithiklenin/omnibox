import { useState } from 'react';
import type { ActionItem } from '../types';
import type { GmailEmailData } from '../hooks/useGmailMessages';
import type { SlackMessageData } from '../hooks/useSlackMessages';
import { ActionCard } from './ActionCard';
import { PlatformIcon } from './PlatformIcon';
import { generateReply } from '../api/generateReply';
import { sendGmailReply } from '../api/sendGmailReply';
import { sendSlackReply } from '../api/sendSlackReply';

interface NeedsReplyProps {
  actions: ActionItem[];
  emails: GmailEmailData[];
  slackMessages: SlackMessageData[];
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
  onReplySent: (id: string) => void;
  loading?: boolean;
  googleAccessToken: string | null;
  slackAccessToken: string | null;
  userName: string;
}

export function NeedsReply({
  actions,
  emails,
  slackMessages,
  onMarkDone,
  onDismiss,
  onReplySent,
  loading,
  googleAccessToken,
  slackAccessToken,
  userName,
}: NeedsReplyProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<Record<string, string>>({});

  const sortedActions = [...actions].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  const unreadCount = actions.filter((a) => !a.isRead).length;

  const getEmailForAction = (action: ActionItem): GmailEmailData | undefined => {
    return emails.find((e) => e.id === action.sourceMessageId);
  };

  const getSlackMessageForAction = (action: ActionItem): SlackMessageData | undefined => {
    return slackMessages.find((m) => m.id === action.sourceMessageId);
  };

  const canReply = (action: ActionItem): boolean => {
    if (action.sourcePlatform === 'gmail') {
      return !!getEmailForAction(action) && !!googleAccessToken;
    }
    if (action.sourcePlatform === 'slack') {
      return !!getSlackMessageForAction(action) && !!slackAccessToken;
    }
    return false;
  };

  const getReplyRecipient = (action: ActionItem): string => {
    if (action.sourcePlatform === 'gmail') {
      const email = getEmailForAction(action);
      return email ? `${email.senderName} (${email.senderEmail})` : '';
    }
    if (action.sourcePlatform === 'slack') {
      const msg = getSlackMessageForAction(action);
      if (!msg) return '';
      return msg.isDm ? msg.senderName : `#${msg.channelName}`;
    }
    return '';
  };

  const handleGenerateReply = async (action: ActionItem) => {
    setGeneratingId(action.id);
    try {
      if (action.sourcePlatform === 'slack') {
        const msg = getSlackMessageForAction(action);
        if (!msg) return;
        const reply = await generateReply({
          senderName: msg.senderName,
          subject: msg.isDm ? 'Direct Message' : `#${msg.channelName}`,
          emailContent: msg.content,
          userName,
          platform: 'slack',
          channelName: msg.channelName,
        });
        setDraftReplies((prev) => ({ ...prev, [action.id]: reply }));
        setEditingReply((prev) => ({ ...prev, [action.id]: reply }));
      } else {
        const email = getEmailForAction(action);
        if (!email) return;
        const reply = await generateReply({
          senderName: email.senderName,
          subject: email.subject,
          emailContent: email.snippet,
          userName,
          platform: 'gmail',
        });
        setDraftReplies((prev) => ({ ...prev, [action.id]: reply }));
        setEditingReply((prev) => ({ ...prev, [action.id]: reply }));
      }
    } catch (err) {
      console.error('Failed to generate reply:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendReply = async (action: ActionItem) => {
    const replyText = editingReply[action.id] || draftReplies[action.id];
    if (!replyText?.trim()) return;

    setSendingId(action.id);
    try {
      if (action.sourcePlatform === 'slack') {
        const msg = getSlackMessageForAction(action);
        if (!msg || !slackAccessToken) return;
        await sendSlackReply({
          accessToken: slackAccessToken,
          channelId: msg.channelId,
          text: replyText,
          threadTs: msg.threadTs || undefined,
        });
      } else {
        const email = getEmailForAction(action);
        if (!email || !googleAccessToken) return;
        await sendGmailReply({
          accessToken: googleAccessToken,
          to: email.senderEmail,
          subject: email.subject,
          body: replyText,
          threadId: email.threadId,
          messageId: email.id,
        });
      }
      setDraftReplies((prev) => {
        const next = { ...prev };
        delete next[action.id];
        return next;
      });
      setEditingReply((prev) => {
        const next = { ...prev };
        delete next[action.id];
        return next;
      });
      onReplySent(action.id);
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Needs Reply</h1>
          </div>
          {actions.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
              {actions.length}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Source filters */}
        <div className="flex items-center gap-1">
          {(['gmail', 'slack'] as const).map((platform) => {
            const count = actions.filter((a) => a.sourcePlatform === platform).length;
            if (count === 0) return null;
            return (
              <div
                key={platform}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400"
              >
                <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Fetching your emails...</p>
          </div>
        ) : sortedActions.length > 0 ? (
          <div className="p-4 space-y-2">
            {sortedActions.map((action) => {
              const isExpanded = expandedId === action.id;
              const draft = draftReplies[action.id];
              const isGenerating = generatingId === action.id;
              const isSending = sendingId === action.id;

              return (
                <div key={action.id}>
                  <ActionCard
                    action={action}
                    onMarkDone={onMarkDone}
                    onDismiss={onDismiss}
                    onGenerateReply={() => {
                      setExpandedId(isExpanded ? null : action.id);
                      if (!isExpanded && !draft) {
                        handleGenerateReply(action);
                      }
                    }}
                    showReplyButton={canReply(action)}
                  />

                  {/* Reply panel */}
                  {isExpanded && (
                    <div className="ml-11 mt-1 mb-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-fade-in">
                      {isGenerating ? (
                        <div className="flex items-center gap-3 py-4">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Generating reply with AI...</span>
                        </div>
                      ) : draft ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <PlatformIcon platform={action.sourcePlatform} className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              To: {getReplyRecipient(action)}
                            </span>
                          </div>
                          <textarea
                            value={editingReply[action.id] ?? draft}
                            onChange={(e) =>
                              setEditingReply((prev) => ({ ...prev, [action.id]: e.target.value }))
                            }
                            rows={6}
                            className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                          />
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleSendReply(action)}
                              disabled={isSending}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors flex items-center gap-2"
                            >
                              {isSending ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  Send Reply
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleGenerateReply(action)}
                              disabled={isGenerating}
                              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => {
                                setExpandedId(null);
                                setDraftReplies((prev) => {
                                  const next = { ...prev };
                                  delete next[action.id];
                                  return next;
                                });
                              }}
                              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No draft generated.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              All caught up!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              You've replied to everything. New items will appear here when messages need your response.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
