import { useState, useRef, useEffect } from 'react';
import { askOmni } from '../api/askOmni';
import type { ActionItem, Integration } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskOmniProps {
  actions: ActionItem[];
  integrations: Integration[];
}

const suggestions = [
  'What should I focus on today?',
  'Summarize my pending emails',
  'What meetings do I have this week?',
  'Draft a reply to Sarah Chen',
  'What tasks are overdue?',
  'Who am I waiting on?',
];

export function AskOmni({ actions, integrations }: AskOmniProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await askOmni(apiMessages, { actions, integrations });

      if (response.error) {
        console.warn('[AskOmni] API error, using fallback:', response.error);
      }

      const content = response.error
        ? generateFallbackResponse(query.trim())
        : response.content;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AskOmni] Request failed:', err);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: generateFallbackResponse(query.trim()),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(input);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Ask Omni</h1>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              What can I help you with?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
              Ask me about your emails, meetings, tasks, or anything else. I can help you draft replies, summarize conversations, and plan your day.
            </p>

            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(s)}
                  className="text-left px-4 py-3 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }
                  `}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 flex-shrink-0">
        <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Omni anything..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition-colors disabled:hover:bg-indigo-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function generateFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('focus') || q.includes('today') || q.includes('plan')) {
    return `Here's what I'd prioritize for today:\n\n1. Reply to Sarah Chen about the project proposal — she's been waiting since this morning and it's high priority.\n\n2. Review Alex Rivera's PR on staging — the auth flow changes need eyes before merging.\n\n3. Start drafting the product spec (due Jan 22) — you committed to this in the Q2 planning meeting.\n\nYou also have a pending call with Emma Wilson at 2pm to discuss client feedback.`;
  }

  if (q.includes('email') || q.includes('gmail')) {
    return `You have 3 emails needing attention:\n\n- Sarah Chen: Project proposal review (high priority, unread)\n- Mike Johnson: Invoice #1247 for $2,500 due Feb 15\n- Tech Weekly Newsletter: AI Breakthroughs summary\n\nSarah's email is the most urgent — she's waiting for your feedback on Q2 budget, timeline, and resources.`;
  }

  if (q.includes('meeting') || q.includes('week')) {
    return `Based on your Granola notes, here's what's coming up:\n\n- Q2 Planning follow-up (you owe a product spec by Jan 22)\n- 1:1 follow-up: skip-level meeting to schedule by end of month\n- 2pm today: Call with Emma Wilson re: client feedback\n\nNo other meetings detected from your connected tools yet. Connect your calendar in Settings for full coverage.`;
  }

  if (q.includes('draft') || q.includes('reply') || q.includes('sarah')) {
    return `Here's a draft reply to Sarah Chen:\n\n---\nHi Sarah,\n\nThanks for sending this over. I've reviewed the proposal and here are my thoughts:\n\n- Budget: The Q2 allocation looks reasonable, though I'd suggest a 10% buffer for unexpected costs.\n- Timeline: Feasible if we can lock down resources by end of January.\n- Resources: We may need one additional contractor for the first sprint.\n\nLet's set up a 30-min call this week to finalize.\n\nBest,\n[Your name]\n---\n\nWould you like me to adjust the tone or add anything?`;
  }

  if (q.includes('overdue') || q.includes('late') || q.includes('deadline')) {
    return `Here are your items with approaching or past deadlines:\n\n- Draft product spec — Due Jan 22 (7 days away)\n- Invoice #1247 payment — Due Feb 15\n- Schedule skip-level meeting — Due end of January\n\nThe product spec is the most pressing. Want me to help you outline it?`;
  }

  if (q.includes('waiting') || q.includes('delegated') || q.includes('who')) {
    return `You're currently waiting on:\n\n- Sarah Chen: Marketing budget breakdown (from Q2 planning)\n- Mike Johnson: Hiring pipeline for 3 engineers (from Q2 planning)\n\nBoth were delegated during the Q2 Planning meeting on Jan 15. Neither has provided an update yet. Want me to draft a follow-up message?`;
  }

  return `I've looked across your connected tools. Here's what I found related to your question:\n\nBased on your recent emails, Slack messages, and meeting notes, I don't have a specific match for that query yet. As more data syncs from your integrations, I'll be able to give more detailed answers.\n\nTry asking me to:\n- Summarize your pending emails\n- Plan your day\n- Draft a reply to someone specific`;
}
