
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  messages: Message[];
  visitorId: string;
  startedAt: Date;
  endedAt?: Date;
  leadCollected: boolean;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interest?: string;
  source: string;
  conversationId: string;
  createdAt: Date;
}

export interface Analytics {
  totalConversations: number;
  totalLeads: number;
  conversionRate: number;
  averageConversationLength: number;
  messagesByCountry: Record<string, number>;
}

export interface ChatWidgetSettings {
  initialMessage: string;
  themeColor: string;
  position: 'left' | 'right';
  collectLeadAfter: number; // messages count
  requireEmailBeforeChat: boolean;
}
