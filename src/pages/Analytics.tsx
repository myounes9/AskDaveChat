
import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import { Analytics as AnalyticsType } from '@/types';
import { fetchAnalytics } from '@/services/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      {isLoading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : analytics ? (
        <AnalyticsDashboard analytics={analytics} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              There isn't enough data to display analytics yet. Start collecting conversations and leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Once your chatbot starts generating leads, you'll see detailed analytics here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
