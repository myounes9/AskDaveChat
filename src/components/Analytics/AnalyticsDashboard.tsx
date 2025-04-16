
import React from 'react';
import { Analytics } from '@/types';
import AnalyticsCard from './AnalyticsCard';
import {
  MessageCircle,
  Users,
  PercentSquare,
  Clock,
  Globe
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
  analytics: Analytics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  const { 
    totalConversations, 
    totalLeads, 
    conversionRate, 
    averageConversationLength, 
    messagesByCountry 
  } = analytics;

  // Prepare data for the pie chart
  const countryData = Object.entries(messagesByCountry).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Conversations"
          value={totalConversations}
          icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        />
        
        <AnalyticsCard
          title="Total Leads"
          value={totalLeads}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        
        <AnalyticsCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
          description="Conversations resulting in leads"
        />
        
        <AnalyticsCard
          title="Avg. Conversation Length"
          value={`${averageConversationLength} min`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Conversations by Country</h3>
          <div className="h-[300px] w-full">
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
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Country Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
