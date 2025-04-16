
import { Analytics, Lead, Conversation, Message, ChatWidgetSettings } from '@/types';

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: generateId(),
    messages: [
      {
        id: generateId(),
        content: "Hi there! How can I help you today?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
      },
      {
        id: generateId(),
        content: "I'm interested in your product pricing",
        role: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60)
      },
      {
        id: generateId(),
        content: "Our pricing starts at $99/month for the Basic package. Would you like more details about our pricing tiers?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 2)
      },
      {
        id: generateId(),
        content: "Yes, please tell me about the advanced tier",
        role: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 3)
      }
    ],
    visitorId: 'visitor-1',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    endedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 10),
    leadCollected: true
  },
  {
    id: generateId(),
    messages: [
      {
        id: generateId(),
        content: "Hi there! How can I help you today?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        id: generateId(),
        content: "Do you offer a free trial?",
        role: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60)
      },
      {
        id: generateId(),
        content: "Yes, we offer a 14-day free trial for all our plans. Would you like to sign up?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 2)
      }
    ],
    visitorId: 'visitor-2',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    leadCollected: false
  },
  {
    id: generateId(),
    messages: [
      {
        id: generateId(),
        content: "Hi there! How can I help you today?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
      },
      {
        id: generateId(),
        content: "I need technical support",
        role: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60)
      },
      {
        id: generateId(),
        content: "I'd be happy to help with technical support. Could you please provide more details about your issue?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 2)
      },
      {
        id: generateId(),
        content: "I'm having trouble integrating your API",
        role: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 3)
      }
    ],
    visitorId: 'visitor-3',
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    leadCollected: true
  }
];

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: generateId(),
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    company: "ABC Corp",
    interest: "pricing",
    source: "chatbot",
    conversationId: mockConversations[0].id,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5)
  },
  {
    id: generateId(),
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    company: "XYZ Inc",
    interest: "demo",
    source: "chatbot",
    conversationId: mockConversations[2].id,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 5)
  },
  {
    id: generateId(),
    name: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "+1 (555) 987-6543",
    interest: "support",
    source: "landing_page",
    conversationId: generateId(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
  },
  {
    id: generateId(),
    name: "Sarah Davis",
    email: "sarah.davis@example.com",
    company: "Acme Co",
    interest: "pricing",
    source: "chatbot",
    conversationId: generateId(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
  },
  {
    id: generateId(),
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+1 (555) 555-1212",
    company: "Tech Solutions",
    interest: "demo",
    source: "website",
    conversationId: generateId(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  }
];

// Mock Analytics
export const mockAnalytics: Analytics = {
  totalConversations: 102,
  totalLeads: 38,
  conversionRate: 37.25,
  averageConversationLength: 4.5,
  messagesByCountry: {
    "United States": 45,
    "United Kingdom": 32,
    "Germany": 15,
    "Canada": 8,
    "Australia": 5,
    "Other": 10
  }
};

// Default chatbot settings
export const defaultChatbotSettings: ChatWidgetSettings = {
  initialMessage: "Hi there! 👋 How can I help you today?",
  themeColor: "#10b981",
  position: 'right',
  collectLeadAfter: 3,
  requireEmailBeforeChat: false
};

// Mock API calls
export const fetchLeads = (): Promise<Lead[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockLeads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    }, 500);
  });
};

export const fetchConversations = (): Promise<Conversation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockConversations].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()));
    }, 500);
  });
};

export const fetchAnalytics = (): Promise<Analytics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAnalytics);
    }, 800);
  });
};

export const fetchChatbotSettings = (): Promise<ChatWidgetSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(defaultChatbotSettings);
    }, 300);
  });
};

export const saveChatbotSettings = (settings: ChatWidgetSettings): Promise<ChatWidgetSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(settings);
    }, 500);
  });
};

export const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
  return new Promise((resolve) => {
    const newLead: Lead = {
      ...lead,
      id: generateId(),
      createdAt: new Date()
    };
    
    setTimeout(() => {
      resolve(newLead);
    }, 300);
  });
};

export const mockAssistantResponse = async (message: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (message.toLowerCase().includes('pricing') || message.toLowerCase().includes('cost')) {
    return "Our pricing starts at $99/month for the Basic package. Would you like me to provide more details about our pricing tiers?";
  }
  
  if (message.toLowerCase().includes('demo') || message.toLowerCase().includes('trial')) {
    return "I'd be happy to arrange a demo for you! To set this up, could you please share your contact information?";
  }
  
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
    return "Hello! 👋 I'm here to help answer your questions. How can I assist you today?";
  }
  
  return "Thanks for your message. To provide you with the best assistance, could you tell me a bit more about what you're looking for?";
};
