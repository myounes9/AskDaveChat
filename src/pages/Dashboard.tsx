
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ChatWidget from '@/components/ChatWidget/ChatWidget';
import AnalyticsCard from '@/components/Analytics/AnalyticsCard';
import { MessageSquare, Users, BarChart3, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLeads, fetchAnalytics } from '@/services/mock-data';
import { Analytics, Lead } from '@/types';

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [leadsData, analyticsData] = await Promise.all([
          fetchLeads(),
          fetchAnalytics()
        ]);
        
        setLeads(leadsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Demo chatbot widget */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Live Preview:</span>
          <ChatWidget 
            themeColor="#10b981"
            botName="LeadSpark"
            collectLeadAfter={2}
            onLeadCollected={(data) => console.log('Lead collected:', data)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : analytics?.totalConversations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : analytics?.totalLeads || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : `${analytics?.conversionRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="recent-leads" className="w-full">
        <TabsList>
          <TabsTrigger value="recent-leads">Recent Leads</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="recent-leads" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Leads</CardTitle>
                <Link to="/leads">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Recent leads captured through your chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads collected yet. Your captured leads will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 inline-block mt-1">
                          {lead.interest}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect your chatbot with other systems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                        <rect width="256" height="256" fill="none" />
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8H112a8,8,0,0,1-8-8V144H88a8,8,0,0,1-5.66-13.66l40-40a8,8,0,0,1,11.32,0l40,40A8,8,0,0,1,168,144H152Zm-8-24v16h-16V152Zm-36-8h20v-4.69L128,117.66l-8,8Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">CRM Integration</h4>
                      <p className="text-sm text-muted-foreground">Connect to your CRM to automatically sync leads</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                        <rect width="256" height="256" fill="none" />
                        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,176H52.57L90.23,128,104,144.43a16,16,0,0,0,24,0L142.23,128ZM216,192H171.69l-37.35-41.5,18.43-16.88a16,16,0,0,1,21.68,0ZM40,192V69.66l41.07,37.56L40,192Zm176-86.23L175,68h41Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Email Integration</h4>
                      <p className="text-sm text-muted-foreground">Get notified via email when new leads are captured</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                        <rect width="256" height="256" fill="none" />
                        <path d="M172,120a44,44,0,1,1-44-44A44,44,0,0,1,172,120Zm60,8A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-153.8,58.4A81.19,81.19,0,0,1,128,136a80.43,80.43,0,0,1,65.8,34.4A87.63,87.63,0,0,0,216,128Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Zapier Integration</h4>
                      <p className="text-sm text-muted-foreground">Connect to 3000+ apps via Zapier</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
