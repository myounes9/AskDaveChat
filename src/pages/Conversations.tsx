
import React, { useState, useEffect } from 'react';
import { fetchConversations } from '@/services/mock-data';
import { Conversation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
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
      
      {isLoading ? (
        <div className="text-center py-8">Loading conversations...</div>
      ) : (
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
                  <TableHead>Date</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Lead Status</TableHead>
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
                  conversations.map((conversation) => {
                    const messageCount = conversation.messages.length;
                    let duration = "Ongoing";
                    
                    if (conversation.endedAt) {
                      const durationInMinutes = Math.round(
                        (conversation.endedAt.getTime() - conversation.startedAt.getTime()) / (1000 * 60)
                      );
                      duration = `${durationInMinutes} min`;
                    }
                    
                    return (
                      <TableRow key={conversation.id}>
                        <TableCell>{formatDate(conversation.startedAt)}</TableCell>
                        <TableCell>Visitor {conversation.visitorId.split('-')[1]}</TableCell>
                        <TableCell>{messageCount}</TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>
                          {conversation.leadCollected ? (
                            <Badge className="bg-green-500">Lead Collected</Badge>
                          ) : (
                            <Badge variant="outline">No Lead</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
