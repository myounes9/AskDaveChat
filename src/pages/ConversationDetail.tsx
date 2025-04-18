import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ArrowLeft, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; // To ensure user is logged in

// Simple interface for messages within this component
interface ConversationMessage {
  id: string;
  created_at: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
}

const ConversationDetail = () => {
  const { id: conversationId } = useParams<{ id: string }>(); // Get ID from URL
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth(); // Check if user is logged in

  useEffect(() => {
    if (!conversationId) {
      setError('No conversation ID provided.');
      setIsLoading(false);
      return;
    }
    if (!session) {
      // This page should only be accessible when logged in, 
      // routing in App.tsx should handle this, but double-check
      setError('You must be logged in to view conversations.');
      setIsLoading(false);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch messages for the specific conversation ID
        // RLS policy should ensure only accessible conversations' messages are returned
        const { data, error: queryError } = await supabase
          .from('messages')
          .select('id, created_at, role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }); // Order messages chronologically

        if (queryError) {
          throw queryError;
        }

        if (data) {
          // Basic validation/type assertion
          setMessages(data as ConversationMessage[]);
        } else {
          setMessages([]);
        }

      } catch (err: any) {
        console.error('Error loading messages:', err);
        setError(err.message || 'Failed to load messages.');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [conversationId, session]); // Re-run if ID or session changes

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild>
        <Link to="/conversations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Conversations
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Conversation Details</CardTitle>
          <CardDescription>
            Viewing messages for Conversation ID: 
            <span className="font-mono text-xs ml-1 p-1 bg-muted rounded">{conversationId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading messages...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No messages found for this conversation.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn(
                      "flex items-start gap-3",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {/* Assistant Avatar */} 
                    {msg.role === 'assistant' && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot size={18}/>
                        </span>
                    )}

                    <div className="flex flex-col gap-1">
                      <div className={cn(
                          "rounded-lg px-3 py-2 text-sm break-words max-w-xl shadow-sm",
                          msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : '',
                          msg.role === 'assistant' ? 'bg-muted rounded-bl-none' : '',
                          msg.role === 'error' ? 'bg-destructive text-destructive-foreground rounded-bl-none' : '',
                          msg.role === 'system' ? 'bg-yellow-100 text-yellow-900 border border-yellow-300 text-xs rounded-lg italic' : ''
                      )}>
                        {/* Simple display for now, consider markdown rendering later */} 
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={cn(
                          "text-xs text-muted-foreground",
                          msg.role === 'user' ? 'text-right' : 'text-left'
                      )}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>

                    {/* User Avatar */} 
                    {msg.role === 'user' && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                            <User size={18}/>
                        </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationDetail; 