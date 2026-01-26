import { useState, useRef, useEffect } from 'react';
import type { Platform, Message } from '../types';
import { PlatformIcon, getPlatformLabel } from './PlatformIcon';
import { mockMessages } from '../data/messages';
import { generateAIResponse, type AIResponse } from '../utils/aiResponses';

interface SidebarProps {
  activeFilter: Platform | 'all';
  onFilterChange: (filter: Platform | 'all') => void;
  unreadCounts: Record<Platform | 'all', number>;
  isOpen: boolean;
  onClose: () => void;
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  onOpenDraft: (draftEmail: NonNullable<AIResponse['draftEmail']>) => void;
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-1 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

const platforms: (Platform | 'all')[] = ['all', 'email', 'slack', 'whatsapp', 'linkedin'];

const quickActions = [
  { id: 'organize', label: 'Organize my inbox', icon: '📥' },
  { id: 'urgent', label: 'Find urgent emails', icon: '🔥' },
  { id: 'plan', label: 'Plan my day', icon: '📅' },
  { id: 'unread', label: 'Summarize unread', icon: '📋' },
];

export function Sidebar({ activeFilter, onFilterChange, unreadCounts, isOpen, onClose, selectedMessage, onSelectMessage, onOpenDraft }: SidebarProps) {
  const [aiInput, setAiInput] = useState('');
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const responsesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiResponses.length > 0) {
      responsesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiResponses]);

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiInput.trim()) {
      await processAIQuery(aiInput);
      setAiInput('');
    }
  };

  const processAIQuery = async (query: string) => {
    setIsLoading(true);
    setShowResults(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 500));

    const response = generateAIResponse(query, selectedMessage, mockMessages);
    setAiResponses(prev => [...prev, response]);
    if (response.draftEmail) {
      onOpenDraft(response.draftEmail);
    }
    setIsLoading(false);
  };

  const handleQuickAction = (action: string) => {
    processAIQuery(action);
  };

  const clearResponses = () => {
    setAiResponses([]);
    setShowResults(false);
  };

  const handleMessageClick = (message: Message) => {
    onSelectMessage(message);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-80 md:w-96 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col overflow-hidden
        `}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* AI Assistant Section - Always visible at top */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">How can I help you today?</span>
          </div>

          {/* AI Input */}
          <form onSubmit={handleAISubmit}>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-colors shadow-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Find, write, organize, ask anything..."
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              <button
                type="submit"
                disabled={!aiInput.trim()}
                className="p-1 text-gray-400 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.label)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Inline AI Results */}
          {(showResults || isLoading) && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Response</span>
                {aiResponses.length > 0 && (
                  <button
                    onClick={clearResponses}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Results Container */}
              <div className="space-y-3">
                {aiResponses.map((response, index) => (
                  <div key={index} className="animate-fade-in">
                    {/* Query bubble */}
                    {response.query && (
                      <div className="flex justify-end mb-2">
                        <div className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg rounded-br-sm text-xs max-w-[85%]">
                          {response.query}
                        </div>
                      </div>
                    )}
                    {/* Response */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-xs border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="prose prose-xs dark:prose-invert max-w-none">
                        {response.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={i} className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm">{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (line.startsWith('• ') || line.startsWith('* ')) {
                            return <p key={i} className="text-gray-600 dark:text-gray-300 ml-2 mb-0.5">{line}</p>;
                          }
                          if (line.match(/^\d+\./)) {
                            return <p key={i} className="text-gray-600 dark:text-gray-300 ml-2 mb-0.5">{line}</p>;
                          }
                          if (line.startsWith('*') && line.endsWith('*')) {
                            return <p key={i} className="text-gray-400 dark:text-gray-500 italic mt-2">{line.replace(/\*/g, '')}</p>;
                          }
                          if (line.startsWith('---')) {
                            return <hr key={i} className="my-2 border-gray-200 dark:border-gray-600" />;
                          }
                          return line ? <p key={i} className="text-gray-600 dark:text-gray-300 mb-0.5">{line}</p> : <br key={i} />;
                        })}
                      </div>

                      {/* Clickable message results */}
                      {response.foundMessages && response.foundMessages.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 mb-2">Click to view:</p>
                          <div className="space-y-1.5">
                            {response.foundMessages.map((msg) => (
                              <button
                                key={msg.id}
                                onClick={() => handleMessageClick(msg)}
                                className="w-full text-left p-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <PlatformIcon platform={msg.platform} className="w-3.5 h-3.5" />
                                  <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                    {msg.sender.name}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 ml-5">
                                  {msg.subject || msg.preview.slice(0, 40) + '...'}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Draft email actions */}
                      {response.draftEmail && (
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(response.draftEmail!.body)}
                            className="flex-1 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                          >
                            Copy Draft
                          </button>
                          <button
                            onClick={() => onOpenDraft(response.draftEmail!)}
                            className="flex-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Open Compose
                          </button>
                        </div>
                      </div>
                      )}

                      <p className="text-[10px] text-gray-400 mt-2">
                        {response.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                  </div>
                )}

                <div ref={responsesEndRef} />
              </div>
            </div>
          )}

          {/* Help text when no results */}
          {!showResults && (
            <button
              onClick={() => handleQuickAction('What can you do?')}
              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What can I ask?
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="p-4">
          {/* Platforms Filter */}
          <CollapsibleSection title="Platforms" defaultOpen={true}>
            <nav className="space-y-1">
              {platforms.map((platform) => {
                const isActive = activeFilter === platform;
                const count = unreadCounts[platform];

                return (
                  <button
                    key={platform}
                    onClick={() => {
                      onFilterChange(platform);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {platform === 'all' ? (
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      ) : (
                        <PlatformIcon platform={platform} />
                      )}
                      <span>{platform === 'all' ? 'All Messages' : getPlatformLabel(platform)}</span>
                    </div>
                    {count > 0 && (
                      <span className={`
                        px-2 py-0.5 text-xs font-medium rounded-full
                        ${isActive
                          ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </CollapsibleSection>

          {/* Quick Filters */}
          <CollapsibleSection title="Quick Filters" defaultOpen={true}>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Starred</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Urgent</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Done</span>
              </button>
            </nav>
          </CollapsibleSection>

          {/* Labels */}
          <CollapsibleSection title="Labels" defaultOpen={false}>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>Work</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span>Personal</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <span>Projects</span>
              </button>
            </nav>
          </CollapsibleSection>
        </div>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Omnibox Demo</p>
              <p className="mt-1">All data is mocked for demonstration</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
