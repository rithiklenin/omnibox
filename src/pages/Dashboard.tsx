import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIntegrations } from '../hooks/useIntegrations';
import { useGmailMessages } from '../hooks/useGmailMessages';
import { extractTasksFromEmails, type ExtractedTask } from '../api/extractTasks';
import { mockActions } from '../data/actions';
import { AskOmni } from '../components/AskOmni';
import { NeedsReply } from '../components/NeedsReply';
import { TaskBoard } from '../components/TaskBoard';

type ActiveView = 'ask_omni' | 'needs_reply' | 'task_board';

function getUserStorageKey(userId: string, key: string): string {
  return `omnibox_${userId}_${key}`;
}

function loadStoredTasks(userId: string): ExtractedTask[] {
  try {
    const stored = localStorage.getItem(getUserStorageKey(userId, 'tasks'));
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveStoredTasks(userId: string, tasks: ExtractedTask[]) {
  localStorage.setItem(getUserStorageKey(userId, 'tasks'), JSON.stringify(tasks));
}

function loadStoredFingerprint(userId: string): string {
  return localStorage.getItem(getUserStorageKey(userId, 'fingerprint')) || '';
}


export function Dashboard() {
  const { user, logout, googleAccessToken } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { integrations, fetchIntegrations } = useIntegrations();
  const { gmailActions, emails, loading: gmailLoading } = useGmailMessages();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<ActiveView>('needs_reply');
  const userId = user?.id || 'anonymous';
  const [tasks, setTasks] = useState<ExtractedTask[]>(() => loadStoredTasks(userId));
  const [tasksLoading, setTasksLoading] = useState(false);
  const [lastEmailFingerprint, setLastEmailFingerprint] = useState(() => loadStoredFingerprint(userId));

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Clear tasks and reload when user changes
  useEffect(() => {
    setTasks(loadStoredTasks(userId));
    setLastEmailFingerprint(loadStoredFingerprint(userId));
    setDismissedIds(new Set());
  }, [userId]);

  useEffect(() => {
    saveStoredTasks(userId, tasks);
  }, [userId, tasks]);

  // Clear stale tasks immediately when emails change, then re-extract
  useEffect(() => {
    if (gmailLoading) return;

    const fingerprint = emails.length > 0
      ? emails.map((e) => e.id).sort().join(',')
      : '';

    if (fingerprint === lastEmailFingerprint) return;

    // Immediately clear old tasks so badge/UI updates right away
    setTasks([]);
    setLastEmailFingerprint(fingerprint);
    localStorage.setItem(getUserStorageKey(userId, 'fingerprint'), fingerprint);

    if (emails.length === 0) return;

    setTasksLoading(true);

    extractTasksFromEmails(
      emails.map((e) => ({
        id: e.id,
        subject: e.subject,
        sender: e.senderName,
        snippet: e.snippet,
        receivedAt: e.receivedAt,
      }))
    )
      .then((extractedTasks) => {
        setTasks(extractedTasks);
      })
      .catch((err) => console.error('Task extraction failed:', err))
      .finally(() => setTasksLoading(false));
  }, [emails, gmailLoading, lastEmailFingerprint]);

  const actions = useMemo(() => {
    const base = googleAccessToken ? gmailActions : mockActions;
    return base.filter((a) => !dismissedIds.has(a.id));
  }, [googleAccessToken, gmailActions, dismissedIds]);

  const needsReplyActions = useMemo(
    () => actions.filter((a) => a.category === 'pending_reply'),
    [actions]
  );

  const handleMarkDone = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleReplySent = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleUpdateTask = useCallback((id: string, updates: Partial<ExtractedTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const pendingTaskCount = tasks.filter((t) => !t.done).length;

  const navItems = [
    {
      id: 'ask_omni' as const,
      label: 'Ask Omni',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'needs_reply' as const,
      label: 'Needs Reply',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      badge: needsReplyActions.length,
    },
    {
      id: 'task_board' as const,
      label: 'Task Board',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: pendingTaskCount,
    },
  ];

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left sidebar */}
      <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">OMNIBOX</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`
                    ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full
                    ${isActive
                      ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* User */}
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'ask_omni' && <AskOmni actions={actions} integrations={integrations} />}
        {activeView === 'needs_reply' && (
          <NeedsReply
            actions={needsReplyActions}
            emails={emails}
            onMarkDone={handleMarkDone}
            onDismiss={handleDismiss}
            onReplySent={handleReplySent}
            loading={gmailLoading}
            googleAccessToken={googleAccessToken}
            userName={user?.name || 'Me'}
          />
        )}
        {activeView === 'task_board' && (
          <TaskBoard
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            loading={tasksLoading}
          />
        )}
      </div>
    </div>
  );
}
