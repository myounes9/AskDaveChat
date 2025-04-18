import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Link as LinkIcon } from 'lucide-react';

interface SupabaseConversation {
  id: string;
  created_at: string;
  metadata?: {
    userEmail?: string;
  } | null;
  channel?: string | null;
  start_url?: string | null;
}

function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) {
    return url;
  }
  try {
    const parsedUrl = new URL(url);
    const significantPart = `${parsedUrl.hostname}${parsedUrl.pathname}`;
    if (significantPart.length <= maxLength - 3) {
        return significantPart + (parsedUrl.search || '') + (parsedUrl.hash || '');
    }
    // Simple truncation if hostname + pathname is too long
    return url.substring(0, maxLength - 3) + '...';
  } catch (e) {
    // Fallback for invalid URLs
    return url.substring(0, maxLength - 3) + '...';
  }
}

const Conversations = () => {
  const [conversations, setConversations] = useState<SupabaseConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from('conversations')
          .select('id, created_at, metadata, channel, start_url')
          .order('created_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        if (data) {
          setConversations(data);
        } else {
          setConversations([]);
        }

      } catch (err: any) {
        console.error('Error loading conversations:', err);
        setError(err.message || 'Failed to load conversations.');
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Conversations</h1>
      
      {isLoading && (
        <Card>
           <CardContent className="py-8 text-center">Loading conversations...</CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation History</CardTitle>
            <CardDescription>
              View all conversations that have taken place with your chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Started At</TableHead>
                  <TableHead>Visitor Email</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Start URL</TableHead>
                  <TableHead className="text-right">Conversation ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No conversations recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.map((conversation) => (
                    <TableRow 
                      key={conversation.id}
                      onClick={() => navigate(`/conversations/${conversation.id}`)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>{formatDate(conversation.created_at)}</TableCell>
                      <TableCell>{conversation.metadata?.userEmail || '-'}</TableCell>
                      <TableCell className="capitalize">{conversation.channel?.replace('_', ' ') || '-'}</TableCell>
                      <TableCell>
                        {conversation.start_url ? (
                          <a 
                            href={conversation.start_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={conversation.start_url}
                            className="flex items-center text-blue-600 hover:underline text-sm"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {truncateUrl(conversation.start_url, 40)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{conversation.id}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Conversations;
