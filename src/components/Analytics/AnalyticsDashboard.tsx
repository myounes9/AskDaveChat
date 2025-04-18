import React from 'react';
import { WidgetEvent } from '@/types';
import { CountryDataPoint } from '@/pages/Analytics';
import AnalyticsCard from './AnalyticsCard';
import {
  MessageCircle,
  Users,
  PercentSquare,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  events: WidgetEvent[];
  averageDuration: number | null;
  totalLeads: number | null;
  totalConversations: number | null;
  countryData: CountryDataPoint[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FA8072', '#7B68EE'];

interface EventTypeDataPoint {
    name: string;
    value: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ events, averageDuration, totalLeads, totalConversations, countryData }) => {
  const calculateConversionRate = (conversationsCount: number | null, leadsCount: number | null) => {
    const safeConversationsCount = conversationsCount ?? 0;
    const safeLeadsCount = leadsCount ?? 0;
    
    if (safeConversationsCount === 0) {
        return 0;
    }

    const rate = (safeLeadsCount / safeConversationsCount) * 100;
    return parseFloat(rate.toFixed(1));
  };

  const conversionRate = calculateConversionRate(totalConversations, totalLeads);

  const displayTotalConversations = totalConversations ?? 0;
  const displayTotalLeads = totalLeads ?? 0;

  const aggregateEventTypes = (eventList: WidgetEvent[]): EventTypeDataPoint[] => {
    if (!eventList || eventList.length === 0) return [];

    const typeCounts: { [key: string]: number } = {};
    eventList.forEach(event => {
        const eventType = event.event_type || 'Unknown';
        typeCounts[eventType] = (typeCounts[eventType] || 0) + 1;
    });

    return Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  };
  const eventTypeData = aggregateEventTypes(events);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Interaction Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Conversations"
          value={displayTotalConversations}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
          description="Total chat sessions recorded"
        />
        
        <AnalyticsCard
          title="Total Leads"
          value={displayTotalLeads}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Leads recorded in database"
        />
        
        <AnalyticsCard
          title="Lead Conversion Rate"
          value={`${conversionRate}%`}
          icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
          description="Leads / Total Conversations"
        />
        
        <AnalyticsCard
          title="Avg. Conversation Length"
          value={averageDuration !== null ? `${averageDuration} min` : 'N/A'}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Average time per session"
        />
      </div>

      {countryData && countryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Conversations by Country (Code)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {countryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} conversations`, name]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Country Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countryData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={60}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                     formatter={(value: number, name: string) => [`${value} conversations`, name]}
                   />
                  <Bar dataKey="value" fill="#10b981" barSize={20}>
                      {countryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {eventTypeData && eventTypeData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 mt-6">
           <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 flex items-center"><PieChartIcon className="h-5 w-5 mr-2" /> Event Type Distribution</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-event-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]} />
                  <Legend 
                    formatter={(value) => value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
