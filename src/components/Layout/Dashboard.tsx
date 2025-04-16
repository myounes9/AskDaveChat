
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />
    },
    {
      name: 'Conversations',
      href: '/conversations',
      icon: <MessageSquare className="mr-2 h-4 w-4" />
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: <Users className="mr-2 h-4 w-4" />
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="mr-2 h-4 w-4" />
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="mr-2 h-4 w-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-sidebar border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            LeadSpark
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="h-16 flex items-center px-6 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
