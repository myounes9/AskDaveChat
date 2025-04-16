
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LeadForm, { LeadFormData } from './LeadForm';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Create a simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15);

interface ChatWidgetProps {
  initialMessage?: string;
  themeColor?: string;
  position?: 'left' | 'right';
  botName?: string;
  collectLeadAfter?: number;
  onLeadCollected?: (leadData: LeadFormData & { conversationId: string }) => void;
  onMessageSent?: (message: Message) => void;
}

const mockAssistantResponse = async (message: string): Promise<string> => {
  // In a real application, this would call the OpenAI API
  // For this demo, we'll return mock responses
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
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

const ChatWidget: React.FC<ChatWidgetProps> = ({
  initialMessage = "Hi there! 👋 How can I help you today?",
  themeColor = "#10b981",
  position = 'right',
  botName = "Assistant",
  collectLeadAfter = 3,
  onLeadCollected,
  onMessageSent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCollected, setLeadCollected] = useState(false);
  const [conversationId] = useState(generateId());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Send initial welcome message
    if (isOpen && messages.length === 0) {
      const initialMsg: Message = {
        id: generateId(),
        content: initialMessage,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([initialMsg]);
    }
  }, [isOpen, initialMessage, messages.length]);

  useEffect(() => {
    // Check if we should show the lead form
    if (
      !leadCollected && 
      messages.filter(m => m.role === 'user').length >= collectLeadAfter
    ) {
      setShowLeadForm(true);
    }
  }, [messages, collectLeadAfter, leadCollected]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showLeadForm]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (onMessageSent) {
      onMessageSent(userMessage);
    }
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Get response from assistant
      const response = await mockAssistantResponse(content);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (onMessageSent) {
        onMessageSent(assistantMessage);
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      toast({
        title: "Error",
        description: "Unable to get a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleLeadSubmit = (data: LeadFormData) => {
    setLeadCollected(true);
    setShowLeadForm(false);
    
    if (onLeadCollected) {
      onLeadCollected({
        ...data,
        conversationId
      });
    }
    
    // Thank the user
    const thankYouMessage: Message = {
      id: generateId(),
      content: `Thank you ${data.name}! I've received your information and one of our team members will reach out to you soon.`,
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, thankYouMessage]);
    
    toast({
      title: "Lead Information Collected",
      description: "Thank you for providing your details.",
    });
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(prev => !prev);
  };

  // Style variables based on props
  const positionStyle = position === 'right'
    ? { right: '20px' }
    : { left: '20px' };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          style={{ backgroundColor: themeColor, ...positionStyle }}
          className="fixed bottom-6 rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="fixed bottom-6 w-80 sm:w-96 shadow-xl overflow-hidden transition-all flex flex-col"
          style={{ 
            ...positionStyle,
            height: isMinimized ? '60px' : '500px',
            maxHeight: '80vh'
          }}
        >
          <CardHeader 
            className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer"
            style={{ backgroundColor: themeColor, color: 'white' }}
            onClick={isMinimized ? toggleMinimize : undefined}
          >
            <h3 className="font-medium text-base">{botName}</h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white hover:bg-white/20" 
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white hover:bg-white/20" 
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-grow overflow-y-auto p-4">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                
                {showLeadForm && !leadCollected && (
                  <LeadForm 
                    onSubmit={handleLeadSubmit} 
                    onCancel={() => setShowLeadForm(false)}
                  />
                )}
                
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-secondary text-secondary-foreground rounded-lg rounded-tl-none p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </CardContent>
              
              <CardFooter className="p-0">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  disabled={showLeadForm && !leadCollected} 
                />
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default ChatWidget;
