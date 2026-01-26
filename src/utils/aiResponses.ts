import type { Message } from '../types';

export interface AIResponse {
  type: 'summary' | 'reply' | 'todos' | 'translate' | 'custom' | 'draft' | 'search';
  content: string;
  timestamp: Date;
  query?: string;
  foundMessages?: Message[];
  draftEmail?: {
    to: string;
    subject: string;
    body: string;
  };
}

// Mock AI responses based on prompt and context
export function generateAIResponse(prompt: string, message: Message | null, allMessages: Message[]): AIResponse {
  const lowerPrompt = prompt.toLowerCase();

  // Handle message search requests
  if (lowerPrompt.includes('find') || lowerPrompt.includes('search') || lowerPrompt.includes('look for') || lowerPrompt.includes('show me')) {
    // Search by person
    const fromMatch = prompt.match(/(?:from|by)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    // Search by topic/keyword
    const aboutMatch = prompt.match(/(?:about|regarding|mentioning|with|containing)\s+(.+?)(?:\s+from|\s+by|\.|$)/i);
    // Search by platform
    const platformMatch = prompt.match(/(email|slack|whatsapp|linkedin)/i);

    let foundMessages = [...allMessages];
    let searchDescription = 'messages';

    if (fromMatch) {
      const searchName = fromMatch[1].toLowerCase();
      foundMessages = foundMessages.filter(m =>
        m.sender.name.toLowerCase().includes(searchName)
      );
      searchDescription = `messages from "${fromMatch[1]}"`;
    }

    if (aboutMatch) {
      const searchTopic = aboutMatch[1].toLowerCase();
      foundMessages = foundMessages.filter(m =>
        m.preview.toLowerCase().includes(searchTopic) ||
        (m.subject && m.subject.toLowerCase().includes(searchTopic)) ||
        m.sender.name.toLowerCase().includes(searchTopic)
      );
      searchDescription = `messages about "${aboutMatch[1]}"`;
    }

    if (platformMatch) {
      const platform = platformMatch[1].toLowerCase();
      foundMessages = foundMessages.filter(m => m.platform === platform);
      searchDescription += ` on ${platformMatch[1]}`;
    }

    if (foundMessages.length === 0) {
      return {
        type: 'search',
        content: `**No messages found**\n\nI couldn't find any ${searchDescription}.\n\nTry:\n• Using different keywords\n• Checking the spelling\n• Searching across all platforms`,
        timestamp: new Date(),
        query: prompt,
        foundMessages: []
      };
    }

    const resultsList = foundMessages.slice(0, 5).map((m, i) =>
      `${i + 1}. **${m.sender.name}** (${m.platform})\n   ${m.subject || m.preview.slice(0, 50) + '...'}`
    ).join('\n\n');

    return {
      type: 'search',
      content: `**Found ${foundMessages.length} ${searchDescription}:**\n\n${resultsList}${foundMessages.length > 5 ? `\n\n*...and ${foundMessages.length - 5} more*` : ''}\n\n*Click on a message in the list to view details.*`,
      timestamp: new Date(),
      query: prompt,
      foundMessages: foundMessages.slice(0, 5)
    };
  }

  // Handle email drafting requests
  if (
    lowerPrompt.includes('draft') ||
    lowerPrompt.includes('compose') ||
    lowerPrompt.includes('email') ||
    lowerPrompt.includes('mail') ||
    lowerPrompt.includes('message to')
  ) {
    // Extract recipient name if present
    const toMatch = prompt.match(/(?:to|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    const recipient = toMatch ? toMatch[1] : 'the recipient';

    // Extract subject/topic if present
    const aboutMatch = prompt.match(/(?:about|regarding|for|re:?)\s+(.+?)(?:\.|$)/i);
    const topic = aboutMatch ? aboutMatch[1].trim() : 'your request';

    const draftEmail = {
      to: recipient,
      subject: `Re: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
      body: `Hi ${recipient.split(' ')[0]},\n\nThank you for reaching out. I wanted to follow up regarding ${topic}.\n\n[Your message here]\n\nPlease let me know if you have any questions or need any additional information.\n\nBest regards`
    };

    return {
      type: 'draft',
      content: `**Draft Email Created:**\n\n**To:** ${draftEmail.to}\n**Subject:** ${draftEmail.subject}\n\n---\n\n${draftEmail.body}\n\n---\n\n*You can copy this draft and customize it before sending.*`,
      timestamp: new Date(),
      query: prompt,
      draftEmail
    };
  }

  // Handle inbox-level prompts (no specific message selected)
  if (lowerPrompt.includes('organize') && lowerPrompt.includes('inbox')) {
    const unreadCount = allMessages.filter(m => m.isUnread).length;
    const platforms = [...new Set(allMessages.map(m => m.platform))];
    return {
      type: 'custom',
      content: `**Inbox Organization Suggestions:**\n\nYou have ${allMessages.length} messages across ${platforms.length} platforms.\n\n**Quick wins:**\n• ${unreadCount} unread messages need attention\n• Consider archiving older read messages\n• Group related conversations by project\n\n**Recommended actions:**\n1. Review and respond to urgent messages first\n2. Archive or delete newsletters you've read\n3. Create labels for recurring topics\n\n*Would you like me to help with any of these?*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('urgent') || lowerPrompt.includes('important')) {
    const urgentMessages = allMessages.filter(m => m.isUnread);
    if (urgentMessages.length === 0) {
      return {
        type: 'custom',
        content: `**No urgent messages found!**\n\nAll your messages have been read. Great job staying on top of your inbox!`,
        timestamp: new Date(),
        query: prompt
      };
    }
    return {
      type: 'search',
      content: `**Found ${urgentMessages.length} messages that may need attention:**\n\n` +
        urgentMessages.slice(0, 5).map((m, i) =>
          `${i + 1}. **${m.sender.name}** (${m.platform})\n   "${m.preview.slice(0, 60)}..."`
        ).join('\n\n') +
        `\n\n*Click on any message to see more details and get AI assistance.*`,
      timestamp: new Date(),
      query: prompt,
      foundMessages: urgentMessages.slice(0, 5)
    };
  }

  if (lowerPrompt.includes('plan') && lowerPrompt.includes('day')) {
    const unreadMessages = allMessages.filter(m => m.isUnread);
    return {
      type: 'custom',
      content: `**Your Day Plan:**\n\nBased on your inbox, here's a suggested priority order:\n\n**Morning (High Priority):**\n• Respond to ${unreadMessages.filter(m => m.platform === 'email').length} unread emails\n• Check Slack for any urgent team updates\n\n**Afternoon (Medium Priority):**\n• Review LinkedIn messages for networking opportunities\n• Respond to WhatsApp conversations\n\n**End of Day:**\n• Archive processed messages\n• Set reminders for follow-ups\n\n*Total estimated time: 45 minutes*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('summarize') && lowerPrompt.includes('unread')) {
    const unreadMessages = allMessages.filter(m => m.isUnread);
    if (unreadMessages.length === 0) {
      return {
        type: 'summary',
        content: `**All caught up!**\n\nYou have no unread messages. Your inbox is in great shape!`,
        timestamp: new Date(),
        query: prompt
      };
    }
    return {
      type: 'summary',
      content: `**Summary of ${unreadMessages.length} Unread Messages:**\n\n**By Platform:**\n• Email: ${unreadMessages.filter(m => m.platform === 'email').length} unread\n• Slack: ${unreadMessages.filter(m => m.platform === 'slack').length} unread\n• WhatsApp: ${unreadMessages.filter(m => m.platform === 'whatsapp').length} unread\n• LinkedIn: ${unreadMessages.filter(m => m.platform === 'linkedin').length} unread\n\n**Key Topics:**\n${unreadMessages.slice(0, 3).map(m => `• ${m.sender.name}: ${m.subject || m.preview.slice(0, 40) + '...'}`).join('\n')}\n\n*Select a message for detailed AI assistance.*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  // If no message selected, provide general help
  if (!message) {
    // Check if they're asking for help
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do') || lowerPrompt.includes('?')) {
      return {
        type: 'custom',
        content: `**I can help you with:**\n\n**Inbox Management:**\n• "Organize my inbox" - Get suggestions\n• "Find urgent emails" - Identify priorities\n• "Plan my day" - Task prioritization\n• "Summarize unread" - Overview of unread\n\n**Email Drafting:**\n• "Write an email to John about the project"\n• "Draft a follow-up message for Sarah"\n\n**Message Search:**\n• "Find messages from Alex"\n• "Search for emails about invoices"\n• "Show me Slack messages about the meeting"\n\n*Select a message for more options like summarize, draft reply, extract todos!*`,
        timestamp: new Date(),
        query: prompt
      };
    }

    return {
      type: 'custom',
      content: `I understand you want to "${prompt}".\n\nTo get more specific help, try:\n• "Find messages about [topic]"\n• "Write an email to [person] about [topic]"\n• "Organize my inbox"\n• "Summarize unread messages"\n\nOr select a message for detailed assistance.\n\n*This is a demo response - in a real app, this would use an actual AI model.*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  // Message-specific responses
  if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
    return {
      type: 'summary',
      content: `**Summary of message from ${message.sender.name}:**\n\nThis message is from ${message.sender.name} via ${message.platform}. The main topic appears to be ${message.subject || 'a conversation'}. Key points:\n• ${message.preview.split('.')[0]}\n• Requires your attention/response\n• Sent recently`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('reply') || lowerPrompt.includes('respond')) {
    return {
      type: 'reply',
      content: `**Draft Reply:**\n\nHi ${message.sender.name.split(' ')[0]},\n\nThank you for reaching out. I've reviewed your message and wanted to follow up.\n\n[Your response here]\n\nBest regards`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('todo') || lowerPrompt.includes('action') || lowerPrompt.includes('task')) {
    return {
      type: 'todos',
      content: `**Action Items from this message:**\n\n1. Review the content from ${message.sender.name}\n2. Respond to their request\n3. Follow up if needed\n\n*Priority: Medium*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('translate')) {
    return {
      type: 'translate',
      content: `**Translation (Spanish):**\n\n*Original:* "${message.preview}"\n\n*Traducción:* "Hola, gracias por tu mensaje. He revisado el contenido y me pondré en contacto contigo pronto."\n\n*(This is a demo translation)*`,
      timestamp: new Date(),
      query: prompt
    };
  }

  if (lowerPrompt.includes('tone') || lowerPrompt.includes('sentiment')) {
    return {
      type: 'custom',
      content: `**Tone Analysis:**\n\n• **Overall Tone:** Professional and friendly\n• **Sentiment:** Neutral to Positive\n• **Urgency Level:** ${message.isUnread ? 'Medium' : 'Low'}\n• **Formality:** Business casual\n\nThe sender appears to be ${message.isUnread ? 'expecting a timely response' : 'following up on a previous conversation'}.`,
      timestamp: new Date(),
      query: prompt
    };
  }

  // Default response for custom prompts with a message selected
  return {
    type: 'custom',
    content: `**AI Response:**\n\nBased on the message from ${message.sender.name}:\n\nI understand you want to "${prompt}". Here's my analysis:\n\nThe message discusses ${message.subject || 'the topic at hand'}. Given the context from ${message.platform}, I would suggest reviewing the full conversation thread and responding accordingly.\n\n*This is a demo response - in a real app, this would use an actual AI model.*`,
    timestamp: new Date(),
    query: prompt
  };
}
