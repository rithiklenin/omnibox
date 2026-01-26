import type { Message } from '../types';

export const mockMessages: Message[] = [
  // Email messages
  {
    id: 'email-1',
    platform: 'email',
    sender: {
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
    },
    subject: 'Project proposal review needed',
    preview: 'Hi, I wanted to follow up on the proposal we discussed last week. Could you review the attached...',
    content: `Hi,

I wanted to follow up on the proposal we discussed last week. Could you review the attached document and let me know your thoughts?

The key points I'd like your feedback on are:
- Budget allocation for Q2
- Timeline feasibility
- Resource requirements

Let me know if you need any clarification.

Best regards,
Sarah`,
    timestamp: '2024-01-15T10:30:00Z',
    isUnread: true,
    thread: [
      {
        id: 'email-1-1',
        sender: { name: 'Sarah Chen' },
        content: 'Hi, I wanted to follow up on the proposal we discussed last week.',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: 'email-1-2',
        sender: { name: 'You', isMe: true },
        content: 'Thanks Sarah, I\'ll take a look at it today.',
        timestamp: '2024-01-15T11:00:00Z',
      },
      {
        id: 'email-1-3',
        sender: { name: 'Sarah Chen' },
        content: 'Great! Let me know if you have any questions.',
        timestamp: '2024-01-15T11:15:00Z',
      },
    ],
  },
  {
    id: 'email-2',
    platform: 'email',
    sender: {
      name: 'Mike Johnson',
      email: 'mike.j@designstudio.io',
    },
    subject: 'Invoice #1247 - January Services',
    preview: 'Please find attached the invoice for the design work completed in January...',
    content: `Hello,

Please find attached the invoice for the design work completed in January.

Invoice Details:
- Invoice #: 1247
- Amount: $2,500.00
- Due Date: February 15, 2024

Payment can be made via bank transfer or PayPal.

Thank you for your business!

Mike Johnson
Design Studio`,
    timestamp: '2024-01-15T09:15:00Z',
    isUnread: false,
  },
  {
    id: 'email-3',
    platform: 'email',
    sender: {
      name: 'Newsletter',
      email: 'news@techweekly.com',
    },
    subject: 'This Week in Tech: AI Breakthroughs',
    preview: 'Top stories: New AI models, startup funding rounds, and product launches...',
    content: `This Week in Tech

Top Stories:
1. New AI models are revolutionizing content creation
2. Startup funding reaches record highs in Q1
3. Major product launches from tech giants

Read more on our website.

Unsubscribe | Update preferences`,
    timestamp: '2024-01-14T08:00:00Z',
    isUnread: true,
  },

  // Slack messages
  {
    id: 'slack-1',
    platform: 'slack',
    sender: {
      name: 'Alex Rivera',
    },
    subject: '#dev-team',
    preview: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR?',
    content: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR? I made some significant changes to the authentication flow.',
    timestamp: '2024-01-15T11:45:00Z',
    isUnread: true,
    thread: [
      {
        id: 'slack-1-1',
        sender: { name: 'Alex Rivera' },
        content: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR?',
        timestamp: '2024-01-15T11:45:00Z',
      },
      {
        id: 'slack-1-2',
        sender: { name: 'Jordan Lee' },
        content: 'I can take a look! Give me 30 minutes.',
        timestamp: '2024-01-15T11:50:00Z',
      },
      {
        id: 'slack-1-3',
        sender: { name: 'You', isMe: true },
        content: 'I\'ll also review it after Jordan.',
        timestamp: '2024-01-15T11:52:00Z',
      },
      {
        id: 'slack-1-4',
        sender: { name: 'Alex Rivera' },
        content: 'Awesome, thanks both! Let me know if you have questions.',
        timestamp: '2024-01-15T11:55:00Z',
      },
    ],
  },
  {
    id: 'slack-2',
    platform: 'slack',
    sender: {
      name: 'Emma Wilson',
    },
    subject: 'Direct Message',
    preview: 'Quick question - are you available for a call at 2pm?',
    content: 'Quick question - are you available for a call at 2pm? I wanted to discuss the client feedback we received.',
    timestamp: '2024-01-15T10:00:00Z',
    isUnread: false,
    thread: [
      {
        id: 'slack-2-1',
        sender: { name: 'Emma Wilson' },
        content: 'Quick question - are you available for a call at 2pm?',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        id: 'slack-2-2',
        sender: { name: 'You', isMe: true },
        content: 'Sure! I\'ll be available. Google Meet or Zoom?',
        timestamp: '2024-01-15T10:05:00Z',
      },
      {
        id: 'slack-2-3',
        sender: { name: 'Emma Wilson' },
        content: 'Let\'s do Google Meet. I\'ll send the invite.',
        timestamp: '2024-01-15T10:07:00Z',
      },
    ],
  },
  {
    id: 'slack-3',
    platform: 'slack',
    sender: {
      name: 'Bot',
    },
    subject: '#general',
    preview: 'Reminder: Team standup in 15 minutes!',
    content: 'Reminder: Team standup in 15 minutes! Join us in the main conference room or via the Zoom link.',
    timestamp: '2024-01-15T08:45:00Z',
    isUnread: false,
  },

  // WhatsApp messages
  {
    id: 'whatsapp-1',
    platform: 'whatsapp',
    sender: {
      name: 'David Park',
    },
    preview: 'The meeting location changed - we\'re now at the coffee shop on 5th street',
    content: 'The meeting location changed - we\'re now at the coffee shop on 5th street. See you there!',
    timestamp: '2024-01-15T12:00:00Z',
    isUnread: true,
    thread: [
      {
        id: 'whatsapp-1-1',
        sender: { name: 'David Park' },
        content: 'Hey, are we still meeting today?',
        timestamp: '2024-01-15T11:30:00Z',
      },
      {
        id: 'whatsapp-1-2',
        sender: { name: 'You', isMe: true },
        content: 'Yes! Looking forward to it. Same place?',
        timestamp: '2024-01-15T11:45:00Z',
      },
      {
        id: 'whatsapp-1-3',
        sender: { name: 'David Park' },
        content: 'The meeting location changed - we\'re now at the coffee shop on 5th street. See you there!',
        timestamp: '2024-01-15T12:00:00Z',
      },
    ],
  },
  {
    id: 'whatsapp-2',
    platform: 'whatsapp',
    sender: {
      name: 'Lisa Thompson',
    },
    preview: 'Thanks for the recommendation! I\'ll check it out this weekend.',
    content: 'Thanks for the recommendation! I\'ll check it out this weekend. Have you tried their brunch menu?',
    timestamp: '2024-01-14T18:30:00Z',
    isUnread: false,
  },
  {
    id: 'whatsapp-3',
    platform: 'whatsapp',
    sender: {
      name: 'Project Group',
    },
    preview: 'Shared a document: Final_Presentation.pdf',
    content: 'I just shared the final presentation document. Please review before tomorrow\'s meeting!',
    timestamp: '2024-01-14T16:00:00Z',
    isUnread: true,
  },

  // LinkedIn messages
  {
    id: 'linkedin-1',
    platform: 'linkedin',
    sender: {
      name: 'Rachel Kim',
    },
    subject: 'Job Opportunity',
    preview: 'Hi! I came across your profile and thought you\'d be a great fit for a role at our company...',
    content: `Hi!

I came across your profile and thought you'd be a great fit for a Senior Developer role at our company.

We're a growing startup in the fintech space, and we're looking for talented developers to join our team.

Would you be interested in learning more?

Best,
Rachel Kim
Tech Recruiter at FinTech Solutions`,
    timestamp: '2024-01-15T09:00:00Z',
    isUnread: true,
    thread: [
      {
        id: 'linkedin-1-1',
        sender: { name: 'Rachel Kim' },
        content: 'Hi! I came across your profile and thought you\'d be a great fit for a Senior Developer role at our company.',
        timestamp: '2024-01-15T09:00:00Z',
      },
    ],
  },
  {
    id: 'linkedin-2',
    platform: 'linkedin',
    sender: {
      name: 'Tom Bradley',
    },
    subject: 'Connection Request',
    preview: 'Great meeting you at the conference last week! Would love to stay connected.',
    content: 'Great meeting you at the conference last week! Would love to stay connected and perhaps grab coffee sometime.',
    timestamp: '2024-01-14T14:00:00Z',
    isUnread: false,
  },
  {
    id: 'linkedin-3',
    platform: 'linkedin',
    sender: {
      name: 'Jenny Martinez',
    },
    subject: 'Collaboration Opportunity',
    preview: 'I saw your recent post about freelancing. Would you be interested in partnering on a project?',
    content: `Hi there!

I saw your recent post about freelancing and loved your insights. I'm working on a similar project and thought we might be able to collaborate.

Would you be open to a quick chat to explore this further?

Thanks!
Jenny`,
    timestamp: '2024-01-13T11:00:00Z',
    isUnread: true,
  },
];
