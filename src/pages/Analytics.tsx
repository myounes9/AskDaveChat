import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import { supabase } from '@/lib/supabaseClient';
import { WidgetEvent, Conversation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

export interface CountryDataPoint {
  name: string;
  value: number;
}

const Analytics = () => {
  const [analyticsEvents, setAnalyticsEvents] = useState<WidgetEvent[] | null>(null);
  const [averageDuration, setAverageDuration] = useState<number | null>(null);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number | null>(null);
  const [totalConversationsCount, setTotalConversationsCount] = useState<number | null>(null);
  const [countryData, setCountryData] = useState<CountryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      setCountryData([]);
      try {
        const [eventsResult, convResult, leadsResult] = await Promise.all([
            supabase
                .from('widget_events')
                .select('*')
                .order('created_at', { ascending: false }),
            supabase
                .from('conversations')
                .select('created_at, updated_at, country_code', { count: 'exact', head: false }),
            supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
        ]);

        if (eventsResult.error) throw eventsResult.error;
        if (convResult.error) throw convResult.error;
        if (leadsResult.error) throw leadsResult.error;

        const eventsData = eventsResult.data || [];
        console.log("Fetched widget events:", eventsData);
        setAnalyticsEvents(eventsData);

        const convData: Partial<Conversation>[] = convResult.data || [];
        const conversationCount = convResult.count || 0;
        console.log("Fetched conversations data:", convData);
        console.log("Fetched conversations count:", conversationCount);
        setTotalConversationsCount(conversationCount);

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

        const countryCounts: { [key: string]: number } = {};
        convData.forEach(conv => {
            const country = conv.country_code || 'Unknown';
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
        const processedCountryData: CountryDataPoint[] = Object.entries(countryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        console.log("Processed country data:", processedCountryData);
        setCountryData(processedCountryData);

        const leadCount = leadsResult.count || 0;
        console.log("Fetched leads count:", leadCount);
        setTotalLeadsCount(leadCount);

      } catch (err: any) {
        console.error('Error loading analytics data:', err);
        setError(`Failed to load analytics data: ${err.message || 'Unknown error'}`);
        setAnalyticsEvents(null);
        setAverageDuration(null);
        setTotalLeadsCount(null);
        setTotalConversationsCount(null);
        setCountryData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalytics();
  }, []);

  if (error) {
      return (
          <div className="space-y-6">
              <h1 className="text-3xl font-bold">Analytics</h1>
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Analytics</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      {isLoading ? (
        <Card>
            <CardHeader>
                <CardTitle>Loading Analytics...</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Fetching latest interaction data...</p>
            </CardContent>
        </Card>
      ) : (totalConversationsCount !== null && totalLeadsCount !== null) ? (
        <AnalyticsDashboard 
          events={analyticsEvents || []}
          averageDuration={averageDuration} 
          totalLeads={totalLeadsCount}
          totalConversations={totalConversationsCount}
          countryData={countryData}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              There isn't enough interaction data logged to display analytics yet. Engage with the chat widget to generate data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Once widget events are logged, you'll see detailed analytics here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
