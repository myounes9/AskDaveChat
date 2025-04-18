import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnalyticsCard from '@/components/Analytics/AnalyticsCard';
import { MessageSquare, Users, BarChart3, ArrowUpRight, PercentSquare, Clock, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Lead, Conversation } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Helper function to format date as 'YYYY-MM-DD'
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Interface for daily lead data
interface DailyLeadData {
  name: string; // Date string (e.g., 'Mon', 'Tue' or 'YYYY-MM-DD')
  leads: number;
  conversations: number; // Added for tracking both metrics
}

// Interface for country/region data
interface CountryDataPoint {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [totalConversations, setTotalConversations] = useState<number | null>(null);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [averageDuration, setAverageDuration] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<string>('0%');
  const [dailyLeadsData, setDailyLeadsData] = useState<DailyLeadData[]>([]); // State for chart data
  const [countryData, setCountryData] = useState<CountryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoISOString = sevenDaysAgo.toISOString();

        // Fetch recent leads, total conversations, total leads, and leads from the last 7 days
        const [recentLeadsResult, convCountResult, totalLeadsResult, weeklyLeadsResult, recentConvResult, weeklyConvResult] = await Promise.all([
          supabase
            .from('leads')
            .select('id, name, email, interest, created_at, status')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('conversations')
            .select('id, created_at, updated_at', { count: 'exact', head: false }),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true }),
          supabase // Fetch leads for the chart
            .from('leads')
            .select('id, created_at')
            .gte('created_at', sevenDaysAgoISOString) // Filter by date
            .order('created_at', { ascending: true }),
          supabase // Fetch recent conversations
            .from('conversations')
            .select('id, thread_id, created_at, updated_at, metadata, channel, country_code, city') // Fetch required and desired optional fields
            .order('created_at', { ascending: false })
            .limit(5),
          supabase // Fetch weekly conversations
            .from('conversations')
            .select('id, created_at')
            .gte('created_at', sevenDaysAgoISOString)
            .order('created_at', { ascending: true })
        ]);

        if (recentLeadsResult.error) throw new Error(`Recent leads fetch error: ${recentLeadsResult.error.message}`);
        if (convCountResult.error) throw new Error(`Conversations count error: ${convCountResult.error.message}`);
        if (totalLeadsResult.error) throw new Error(`Total leads count error: ${totalLeadsResult.error.message}`);
        if (weeklyLeadsResult.error) throw new Error(`Weekly leads fetch error: ${weeklyLeadsResult.error.message}`);
        if (recentConvResult.error) throw new Error(`Recent conversations fetch error: ${recentConvResult.error.message}`);
        if (weeklyConvResult.error) throw new Error(`Weekly conversations fetch error: ${weeklyConvResult.error.message}`);

        setRecentLeads(recentLeadsResult.data || []);
        setRecentConversations((recentConvResult.data as Conversation[]) || []);
        setTotalLeads(totalLeadsResult.count ?? 0);
        setTotalConversations(convCountResult.count ?? 0);

        // Calculate conversion rate
        const convCount = convCountResult.count ?? 0;
        const leadsCount = totalLeadsResult.count ?? 0;
        
        if (convCount > 0) {
          const rate = (leadsCount / convCount) * 100;
          setConversionRate(`${rate.toFixed(1)}%`);
        } else {
          setConversionRate('0%');
        }

        // Calculate average conversation duration
        const convData = convCountResult.data as any[] || [];
        if (convData && convData.length > 0) {
          let totalDurationMinutes = 0;
          let validConversationsCount = 0;

          convData.forEach(conv => {
            if (conv.created_at && conv.updated_at) {
              try {
                const startTime = new Date(conv.created_at).getTime();
                const endTime = new Date(conv.updated_at).getTime();
                const durationMs = endTime - startTime;
                
                if (durationMs > 0) {
                  totalDurationMinutes += durationMs / (1000 * 60);
                  validConversationsCount++;
                }
              } catch (parseError) {
                console.warn("Error parsing conversation dates:", parseError);
              }
            }
          });

          if (validConversationsCount > 0) {
            const avg = totalDurationMinutes / validConversationsCount;
            setAverageDuration(parseFloat(avg.toFixed(1)));
          } else {
            setAverageDuration(0);
          }
        } else {
          setAverageDuration(0);
        }

        // Process weekly leads and conversations for the chart
        const leadsByDay: { [key: string]: number } = {};
        const convByDay: { [key: string]: number } = {};
        const dateMap: { [key: string]: string } = {}; // To store formatted date names

        // Initialize the last 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = formatDate(date);
          leadsByDay[dateString] = 0;
          convByDay[dateString] = 0;
          // Format date for display
          dateMap[dateString] = date.toLocaleDateString(undefined, { weekday: 'short' });
        }

        // Count leads per day
        (weeklyLeadsResult.data || []).forEach(lead => {
          if (lead.created_at) {
            const leadDate = new Date(lead.created_at);
            const dateString = formatDate(leadDate);
            if (leadsByDay.hasOwnProperty(dateString)) {
              leadsByDay[dateString]++;
            }
          }
        });

        // Count conversations per day
        (weeklyConvResult.data || []).forEach(conv => {
          if (conv.created_at) {
            const convDate = new Date(conv.created_at);
            const dateString = formatDate(convDate);
            if (convByDay.hasOwnProperty(dateString)) {
              convByDay[dateString]++;
            }
          }
        });

        // Format data for recharts, ensuring chronological order
        const formattedChartData = Object.keys(leadsByDay)
          .sort() // Sort keys (YYYY-MM-DD) chronologically
          .map(dateString => ({
            name: dateMap[dateString], // Use the formatted name (e.g., 'Mon')
            leads: leadsByDay[dateString],
            conversations: convByDay[dateString],
          }));

        setDailyLeadsData(formattedChartData);

        // Prepare country/region data
        const countryCounts: { [key: string]: number } = {};
        (recentConvResult.data || []).forEach(conv => {
          const country = conv.country_code || 'Unknown';
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
        
        const countryDataPoints = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);  // Limit to top 5 countries
        
        setCountryData(countryDataPoints);

      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    console.log("Dashboard data:", {
      totalConversations,
      totalLeads,
      isLoading,
      hasData: dailyLeadsData.length > 0,
      hasCountryData: countryData.length > 0,
      error
    });
  }, [totalConversations, totalLeads, isLoading, dailyLeadsData, countryData, error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {error && (
          <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      
      {/* KPI Cards (4 in a row with additional metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/conversations" className="hover:shadow-md rounded-lg transition-shadow">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : totalConversations ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">View all conversations</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/leads" className="hover:shadow-md rounded-lg transition-shadow">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : totalLeads ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">View all leads</p>
            </CardContent>
          </Card>
        </Link>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <PercentSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : conversionRate}
            </div>
            <p className="text-xs text-muted-foreground">Leads / Conversations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : averageDuration !== null ? `${averageDuration} min` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Average time per session</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section - Leads & Conversations by Day and Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads & Conversations Per Day Chart (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leads & Conversations (Last 7 Days)</CardTitle>
            <CardDescription>Daily activity over the past week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pl-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : error ? (
              <div className="flex justify-center items-center h-full text-destructive">Failed to load chart data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyLeadsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="conversations" name="Conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Region/Country Distribution (1/3 width) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Visitor Regions
            </CardTitle>
            <CardDescription>Top visitor countries</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {countryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Conversations']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Card */}
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
              Most recent leads captured through the chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads collected yet. Your captured leads will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{lead.name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{lead.email || 'No Email'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Unknown Date'}
                      </p>
                      {lead.interest && (
                          <p className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 inline-block mt-1 capitalize">
                            {lead.interest.replace(/_/g, ' ')}
                          </p>
                      )}
                      {lead.status && (
                        <p className={`text-xs mt-1 capitalize ${lead.status === 'new' ? 'text-green-500' : ''}`}>
                          {lead.status}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Latest Conversations</CardTitle>
              <Link to="/conversations">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              Most recent conversations started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : recentConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No conversations started yet.
              </div>
            ) : (
              <div className="space-y-4">
                {recentConversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm truncate" title={conv.id}>Conv ID: ...{conv.id.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground capitalize">Channel: {conv.channel || 'Unknown'}</p>
                      <div className="flex text-xs text-muted-foreground space-x-2">
                        <span>{conv.metadata?.userEmail || 'Anon'}</span>
                        {conv.country_code && (
                          <span title={conv.city || undefined}>📍 {conv.country_code}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'Unknown Date'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                         {conv.created_at ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
