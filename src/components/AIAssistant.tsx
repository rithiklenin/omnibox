import { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { mockMessages } from '../data/messages';

interface AIAssistantProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface AIResponse {
  type: 'summary' | 'reply' | 'todos' | 'translate' | 'custom';
  content: string;
  timestamp: Date;
  query?: string;
}

const quickActions = [
  { id: 'summarize', label: 'Summarize', icon: '📝', prompt: 'Summarize this message' },
  { id: 'reply', label: 'Draft Reply', icon: '✍️', prompt: 'Draft a professional reply' },
  { id: 'todos', label: 'Extract Todos', icon: '✅', prompt: 'Extract action items and todos' },
  { id: 'translate', label: 'Translate', icon: '🌐', prompt: 'Translate to Spanish' },
  { id: 'tone', label: 'Analyze Tone', icon: '🎭', prompt: 'Analyze the tone of this message' },
];

// Mock AI responses based on message content
function generateAIResponse(prompt: string, message: Message | null, allMessages: Message[]): string {
  const lowerPrompt = prompt.toLowerCase();

  // Handle inbox-level prompts (no specific message selected)
  if (lowerPrompt.includes('organize') && lowerPrompt.includes('inbox')) {
    const unreadCount = allMessages.filter(m => m.isUnread).length;
    const platforms = [...new Set(allMessages.map(m => m.platform))];
    return `**Inbox Organization Suggestions:**\n\n` +
      `You have ${allMessages.length} messages across ${platforms.length} platforms.\n\n` +
      `**Quick wins:**\n` +
      `• ${unreadCount} unread messages need attention\n` +
      `• Consider archiving older read messages\n` +
      `• Group related conversations by project\n\n` +
      `**Recommended actions:**\n` +
      `1. ☐ Review and respond to urgent messages first\n` +
      `2. ☐ Archive or delete newsletters you've read\n` +
      `3. ☐ Create labels for recurring topics\n\n` +
      `*Would you like me to help with any of these?*`;
  }

  if (lowerPrompt.includes('urgent') || lowerPrompt.includes('important')) {
    const urgentMessages = allMessages.filter(m => m.isUnread);
    if (urgentMessages.length === 0) {
      return `**No urgent messages found!**\n\nAll your messages have been read. Great job staying on top of your inbox!`;
    }
    return `**Found ${urgentMessages.length} messages that may need attention:**\n\n` +
      urgentMessages.slice(0, 5).map((m, i) =>
        `${i + 1}. **${m.sender.name}** (${m.platform})\n   "${m.preview.slice(0, 60)}..."`
      ).join('\n\n') +
      `\n\n*Click on any message to see more details and get AI assistance.*`;
  }

  if (lowerPrompt.includes('plan') && lowerPrompt.includes('day')) {
    const unreadMessages = allMessages.filter(m => m.isUnread);
    return `**Your Day Plan:**\n\n` +
      `Based on your inbox, here's a suggested priority order:\n\n` +
      `**Morning (High Priority):**\n` +
      `• Respond to ${unreadMessages.filter(m => m.platform === 'email').length} unread emails\n` +
      `• Check Slack for any urgent team updates\n\n` +
      `**Afternoon (Medium Priority):**\n` +
      `• Review LinkedIn messages for networking opportunities\n` +
      `• Respond to WhatsApp conversations\n\n` +
      `**End of Day:**\n` +
      `• Archive processed messages\n` +
      `• Set reminders for follow-ups\n\n` +
      `*Total estimated time: 45 minutes*`;
  }

  if (lowerPrompt.includes('summarize') && lowerPrompt.includes('unread')) {
    const unreadMessages = allMessages.filter(m => m.isUnread);
    if (unreadMessages.length === 0) {
      return `**All caught up!**\n\nYou have no unread messages. Your inbox is in great shape!`;
    }
    return `**Summary of ${unreadMessages.length} Unread Messages:**\n\n` +
      `**By Platform:**\n` +
      `• Email: ${unreadMessages.filter(m => m.platform === 'email').length} unread\n` +
      `• Slack: ${unreadMessages.filter(m => m.platform === 'slack').length} unread\n` +
      `• WhatsApp: ${unreadMessages.filter(m => m.platform === 'whatsapp').length} unread\n` +
      `• LinkedIn: ${unreadMessages.filter(m => m.platform === 'linkedin').length} unread\n\n` +
      `**Key Topics:**\n` +
      unreadMessages.slice(0, 3).map(m => `• ${m.sender.name}: ${m.subject || m.preview.slice(0, 40) + '...'}`).join('\n') +
      `\n\n*Select a message for detailed AI assistance.*`;
  }

  // If no message selected, provide general help
  if (!message) {
    return `**I can help you with:**\n\n` +
      `**Without selecting a message:**\n` +
      `• "Organize my inbox" - Get suggestions for organizing\n` +
      `• "Find urgent emails" - Identify priority messages\n` +
      `• "Plan my day" - Get a task prioritization plan\n` +
      `• "Summarize unread" - Overview of unread messages\n\n` +
      `**After selecting a message:**\n` +
      `• Summarize the message\n` +
      `• Draft a reply\n` +
      `• Extract action items\n` +
      `• Translate content\n` +
      `• Analyze tone\n\n` +
      `*Select a message from the list to unlock more features!*`;
  }

  if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
    return `**Summary of message from ${message.sender.name}:**\n\n` +
      `This message is from ${message.sender.name} via ${message.platform}. ` +
      `The main topic appears to be ${message.subject || 'a conversation'}. ` +
      `Key points:\n• ${message.preview.split('.')[0]}\n• Requires your attention/response\n• Sent recently`;
  }

  if (lowerPrompt.includes('reply') || lowerPrompt.includes('draft') || lowerPrompt.includes('respond')) {
    return `**Draft Reply:**\n\n` +
      `Hi ${message.sender.name.split(' ')[0]},\n\n` +
      `Thank you for reaching out. I've reviewed your message and wanted to follow up.\n\n` +
      `[Your response here]\n\n` +
      `Best regards`;
  }

  if (lowerPrompt.includes('todo') || lowerPrompt.includes('action') || lowerPrompt.includes('task')) {
    return `**Action Items from this message:**\n\n` +
      `1. ☐ Review the content from ${message.sender.name}\n` +
      `2. ☐ Respond to their request\n` +
      `3. ☐ Follow up if needed\n\n` +
      `*Priority: Medium*`;
  }

  if (lowerPrompt.includes('translate')) {
    return `**Translation (Spanish):**\n\n` +
      `*Original:* "${message.preview}"\n\n` +
      `*Traducción:* "Hola, gracias por tu mensaje. He revisado el contenido y me pondré en contacto contigo pronto."\n\n` +
      `*(This is a demo translation)*`;
  }

  if (lowerPrompt.includes('tone') || lowerPrompt.includes('sentiment')) {
    return `**Tone Analysis:**\n\n` +
      `• **Overall Tone:** Professional and friendly\n` +
      `• **Sentiment:** Neutral to Positive\n` +
      `• **Urgency Level:** ${message.isUnread ? 'Medium' : 'Low'}\n` +
      `• **Formality:** Business casual\n\n` +
      `The sender appears to be ${message.isUnread ? 'expecting a timely response' : 'following up on a previous conversation'}.`;
  }

  // Default response for custom prompts
  if (message) {
    return `**AI Response:**\n\n` +
      `Based on the message from ${message.sender.name}:\n\n` +
      `I understand you want to "${prompt}". Here's my analysis:\n\n` +
      `The message discusses ${message.subject || 'the topic at hand'}. ` +
      `Given the context from ${message.platform}, I would suggest reviewing the full conversation thread and responding accordingly.\n\n` +
      `*This is a demo response - in a real app, this would use an actual AI model.*`;
  }

  return `**AI Response:**\n\n` +
    `I understand you want to "${prompt}".\n\n` +
    `To get more specific help, try selecting a message first, or use one of the quick actions like "Organize my inbox" or "Find urgent emails".\n\n` +
    `*This is a demo response - in a real app, this would use an actual AI model.*`;
}

export function AIAssistant({ message, isOpen, onClose, initialPrompt }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responsesEndRef = useRef<HTMLDivElement>(null);
  const processedInitialPrompt = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    responsesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses]);

  // Handle initial prompt from sidebar
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt !== processedInitialPrompt.current) {
      processedInitialPrompt.current = initialPrompt;
      handleSubmit(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Reset processed prompt when modal closes
  useEffect(() => {
    if (!isOpen) {
      processedInitialPrompt.current = null;
    }
  }, [isOpen]);

  const handleSubmit = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    if (!promptToUse.trim()) return;

    setIsLoading(true);
    setPrompt('');

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateAIResponse(promptToUse, message, mockMessages);
    setResponses(prev => [...prev, {
      type: 'custom',
      content: response,
      timestamp: new Date(),
      query: promptToUse,
    }]);

    setIsLoading(false);
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    handleSubmit(action.prompt);
  };

  const clearHistory = () => {
    setResponses([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {message ? `Analyzing: ${message.sender.name}` : 'Ask me anything about your inbox'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {responses.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Clear history"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {message ? 'Quick actions for this message:' : 'Quick actions for your inbox:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {message ? (
              quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => handleSubmit('Organize my inbox')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span>📥</span>
                  <span>Organize inbox</span>
                </button>
                <button
                  onClick={() => handleSubmit('Find urgent emails')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span>🔥</span>
                  <span>Find urgent</span>
                </button>
                <button
                  onClick={() => handleSubmit('Plan my day')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span>📅</span>
                  <span>Plan my day</span>
                </button>
                <button
                  onClick={() => handleSubmit('Summarize unread')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <span>📋</span>
                  <span>Summarize unread</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Responses */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin min-h-[200px]">
          {responses.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">How can I help you today?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {message
                  ? `Ask me anything about the message from ${message.sender.name}, or use the quick actions above.`
                  : 'Ask me to organize your inbox, find important messages, or select a message for more options.'}
              </p>
            </div>
          ) : (
            responses.map((response, index) => (
              <div key={index} className="space-y-2 animate-fade-in">
                {response.query && (
                  <div className="flex justify-end">
                    <div className="bg-indigo-500 text-white px-4 py-2 rounded-xl rounded-br-sm max-w-[80%]">
                      <p className="text-sm">{response.query}</p>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {response.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold text-gray-900 dark:text-white mb-2">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('• ') || line.startsWith('* ')) {
                        return <p key={i} className="text-gray-700 dark:text-gray-300 ml-4">{line}</p>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="text-gray-700 dark:text-gray-300 ml-4">{line}</p>;
                      }
                      if (line.startsWith('*') && line.endsWith('*')) {
                        return <p key={i} className="text-gray-500 dark:text-gray-400 italic text-sm mt-2">{line.replace(/\*/g, '')}</p>;
                      }
                      return line ? <p key={i} className="text-gray-700 dark:text-gray-300">{line}</p> : <br key={i} />;
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {response.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-3 p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
            </div>
          )}
          <div ref={responsesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send • Keyboard shortcut: ⌘K to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
