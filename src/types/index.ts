export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface Conversation {
  id: string; // UUID
  thread_id: string; // TEXT, OpenAI thread ID
  created_at: string; // TIMESTAMPTZ, Supabase typically returns as ISO string
  updated_at: string; // TIMESTAMPTZ
  metadata?: { // JSONB
    userEmail?: string | null;
  } | null;
  channel?: string | null; // TEXT
  start_url?: string | null; // TEXT
  ip_address?: string | null; // INET (represented as string)
  user_agent?: string | null; // TEXT
  user_id?: string | null; // UUID, Foreign key to auth.users
  country_code?: string | null;
  city?: string | null;
  // Removed outdated fields: messages, visitorId, endedAt, leadCollected, startedAt
}

export interface Lead {
  id: string; // UUID
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  // company?: string; // Not in DB schema
  interest?: string | null;
  // source: string; // Not in DB schema, was likely from mock data
  conversation_id?: string | null; // UUID, Foreign key to conversations
  created_at: string; // TIMESTAMPTZ, Supabase typically returns as ISO string
  user_id?: string | null; // UUID, Foreign key to auth.users
  status?: string | null; // TEXT, e.g., 'new', 'contacted', 'qualified'
  raw_data?: any; // JSONB
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

export interface WidgetEvent {
  id: number;
  created_at: string;
  event_type: string;
  event_details?: Record<string, any>;
  conversation_id?: string;
  thread_id?: string;
}
