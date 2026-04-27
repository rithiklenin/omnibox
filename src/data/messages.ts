import type { Message } from '../types';

export const mockMessages: Message[] = [
  {
    id: 'gmail-1',
    platform: 'gmail',
    externalId: 'msg-001',
    threadId: 'thread-001',
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
    receivedAt: '2024-01-15T10:30:00Z',
    isUnread: true,
    thread: [
      {
        id: 'gmail-1-1',
        sender: { name: 'Sarah Chen' },
        content: 'Hi, I wanted to follow up on the proposal we discussed last week.',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: 'gmail-1-2',
        sender: { name: 'You', isMe: true },
        content: "Thanks Sarah, I'll take a look at it today.",
        timestamp: '2024-01-15T11:00:00Z',
      },
      {
        id: 'gmail-1-3',
        sender: { name: 'Sarah Chen' },
        content: 'Great! Let me know if you have any questions.',
        timestamp: '2024-01-15T11:15:00Z',
      },
    ],
  },
  {
    id: 'gmail-2',
    platform: 'gmail',
    externalId: 'msg-002',
    threadId: 'thread-002',
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
    receivedAt: '2024-01-15T09:15:00Z',
    isUnread: false,
  },
  {
    id: 'gmail-3',
    platform: 'gmail',
    externalId: 'msg-003',
    threadId: 'thread-003',
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
    receivedAt: '2024-01-14T08:00:00Z',
    isUnread: true,
  },
  {
    id: 'gmail-1a',
    platform: 'gmail',
    externalId: 'msg-004',
    threadId: 'thread-004',
    sender: {
      name: 'Alex Rivera',
      email: 'alex@company.com',
    },
    subject: 'PR Review: Authentication Flow Updates',
    preview: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR?',
    content: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR? I made some significant changes to the authentication flow.',
    receivedAt: '2024-01-15T11:45:00Z',
    isUnread: true,
    thread: [
      {
        id: 'gmail-1a-1',
        sender: { name: 'Alex Rivera' },
        content: 'Hey team! Just pushed the latest updates to staging. Can someone review the PR?',
        timestamp: '2024-01-15T11:45:00Z',
      },
      {
        id: 'gmail-1a-2',
        sender: { name: 'Jordan Lee' },
        content: 'I can take a look! Give me 30 minutes.',
        timestamp: '2024-01-15T11:50:00Z',
      },
      {
        id: 'gmail-1a-3',
        sender: { name: 'You', isMe: true },
        content: "I'll also review it after Jordan.",
        timestamp: '2024-01-15T11:52:00Z',
      },
    ],
  },
  {
    id: 'gmail-1b',
    platform: 'gmail',
    externalId: 'msg-005',
    threadId: 'thread-005',
    sender: {
      name: 'Emma Wilson',
      email: 'emma@company.com',
    },
    subject: 'Client Feedback Discussion',
    preview: 'Quick question - are you available for a call at 2pm?',
    content: 'Quick question - are you available for a call at 2pm? I wanted to discuss the client feedback we received.',
    receivedAt: '2024-01-15T10:00:00Z',
    isUnread: false,
    thread: [
      {
        id: 'gmail-1b-1',
        sender: { name: 'Emma Wilson' },
        content: 'Quick question - are you available for a call at 2pm?',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        id: 'gmail-1b-2',
        sender: { name: 'You', isMe: true },
        content: "Sure! I'll be available. Google Meet or Zoom?",
        timestamp: '2024-01-15T10:05:00Z',
      },
    ],
  },
  {
    id: 'gmail-1c',
    platform: 'gmail',
    externalId: 'msg-006',
    threadId: 'thread-006',
    sender: {
      name: 'Bot',
    },
    subject: 'Team Standup Reminder',
    preview: 'Reminder: Team standup in 15 minutes!',
    content: 'Reminder: Team standup in 15 minutes! Join us in the main conference room or via the Zoom link.',
    receivedAt: '2024-01-15T08:45:00Z',
    isUnread: false,
  },
  {
    id: 'gmail-2a',
    platform: 'gmail',
    externalId: 'msg-007',
    threadId: 'thread-007',
    sender: {
      name: 'Project Manager',
      email: 'pm@company.com',
    },
    subject: 'Q2 Planning - Action Items',
    preview: 'Key decisions: Launch new product line by end of Q2, allocate 30% of budget to marketing...',
    content: `Q2 Planning Summary
Date: Jan 15, 2024
Attendees: Sarah, Mike, Alex, You

Key Decisions:
- Launch new product line by end of Q2
- Allocate 30% of budget to marketing
- Hire 3 additional engineers

Action Items:
- You: Draft product spec by Jan 22
- Sarah: Prepare marketing budget breakdown
- Mike: Create hiring pipeline

Next Meeting: Jan 22, 2024`,
    receivedAt: '2024-01-15T14:00:00Z',
    isUnread: true,
  },
  {
    id: 'gmail-2b',
    platform: 'gmail',
    externalId: 'msg-008',
    threadId: 'thread-008',
    sender: {
      name: 'Manager',
      email: 'manager@company.com',
    },
    subject: '1:1 Follow-up: Career Growth',
    preview: 'Discussion about career growth, upcoming projects, and team dynamics...',
    content: `Meeting Notes: 1:1 with Manager
Date: Jan 14, 2024

Topics Discussed:
- Career growth path and goals for 2024
- Upcoming project assignments
- Team dynamics and collaboration

Follow-ups:
- Schedule skip-level meeting by end of month
- Review updated job ladder document
- Prepare self-review draft`,
    receivedAt: '2024-01-14T15:00:00Z',
    isUnread: false,
  },
];
