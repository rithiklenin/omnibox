import { useState, useMemo, useEffect } from 'react';
import type { Message, Platform } from '../types';
import { mockMessages } from '../data/messages';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { MessageViewer } from '../components/MessageViewer';
import type { AIResponse } from '../utils/aiResponses';

export function Inbox() {
  const [activeFilter, setActiveFilter] = useState<Platform | 'all'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [draftEmail, setDraftEmail] = useState<AIResponse['draftEmail'] | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter messages based on active filter
  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') {
      return mockMessages;
    }
    return mockMessages.filter((m) => m.platform === activeFilter);
  }, [activeFilter]);

  // Sort by timestamp (newest first)
  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredMessages]);

  // Calculate unread counts
  const unreadCounts = useMemo(() => {
    const counts: Record<Platform | 'all', number> = {
      all: 0,
      email: 0,
      slack: 0,
      whatsapp: 0,
      linkedin: 0,
    };

    mockMessages.forEach((message) => {
      if (message.isUnread) {
        counts.all++;
        counts[message.platform]++;
      }
    });

    return counts;
  }, []);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setDraftEmail(null);
  };

  const handleCloseViewer = () => {
    setSelectedMessage(null);
  };

  const handleOpenDraft = (draft: NonNullable<AIResponse['draftEmail']>) => {
    setSelectedMessage(null);
    setDraftEmail(draft);
  };

  const handleCloseDraft = () => {
    setDraftEmail(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-4 left-4 z-10 p-3 bg-indigo-600 text-white rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCounts={unreadCounts}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedMessage={selectedMessage}
          onSelectMessage={handleSelectMessage}
          onOpenDraft={handleOpenDraft}
        />

        {/* Message List */}
        <div className="flex-1 flex flex-col md:w-96 md:flex-none bg-white dark:bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeFilter === 'all' ? 'All Messages' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
                  {unreadCounts[activeFilter] > 0 && (
                    <span className="ml-1">({unreadCounts[activeFilter]} unread)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <MessageList
            messages={sortedMessages}
            selectedMessageId={selectedMessage?.id || null}
            onSelectMessage={handleSelectMessage}
          />
        </div>

        {/* Message Viewer */}
        {(!isMobile || selectedMessage || draftEmail) && (
          <MessageViewer
            message={selectedMessage}
            onClose={handleCloseViewer}
            isMobile={isMobile}
            draftEmail={draftEmail}
            onCloseDraft={handleCloseDraft}
          />
        )}
      </div>

    </div>
  );
}
