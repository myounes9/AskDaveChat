import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  LogOut,
  MessageCircleMore,
  PanelLeft,
  Menu,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from '@/components/ui/toaster';
import ChatWidget from '../ChatWidget';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase } from '@/lib/supabaseClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard /> },
    { name: 'Conversations', href: '/conversations', icon: <MessageSquare /> },
    { name: 'Leads', href: '/leads', icon: <Users /> },
    { name: 'Analytics', href: '/analytics', icon: <BarChart3 /> },
    { name: 'Settings', href: '/settings', icon: <Settings /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const SidebarNavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              location.pathname === item.href && "bg-muted text-primary font-semibold",
              isSidebarOpen ? "justify-start gap-3" : "justify-center h-9 w-9"
            )}
          >
            {React.cloneElement(item.icon, { className: "h-5 w-5" })}
            {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            <span className={cn("sr-only", isSidebarOpen && "hidden")}>{item.name}</span>
          </Link>
        </TooltipTrigger>
        {!isSidebarOpen && (
          <TooltipContent side="right" sideOffset={5}>
            {item.name}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  const MobileNavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <Link
        key={item.href}
        to={item.href}
        className={cn(
            "flex items-center gap-4 px-2.5",
            location.pathname === item.href ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
    >
        {React.cloneElement(item.icon, { className: "h-5 w-5" })}
        {item.name}
    </Link>
  );

  return (
    <div className="min-h-screen w-full flex bg-muted/40">
      <aside className={cn(
          "hidden md:flex flex-col fixed inset-y-0 z-10 h-full border-r bg-background transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64 px-4" : "w-16 px-2 items-center"
      )}>
        <div className={cn(
            "flex h-16 shrink-0 items-center border-b",
            isSidebarOpen ? "px-2 justify-between" : "justify-center"
          )}>
           {isSidebarOpen && (
             <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
               <Bot className="h-6 w-6 text-primary" />
               <span>DawsBot</span>
             </Link>
           )}
           {!isSidebarOpen && (
                <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground" title="DawsBot">
                    <Bot className="h-5 w-5" />
                    <span className="sr-only">DawsBot</span>
                </Link>
            )}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("ml-auto", isSidebarOpen ? "md:ml-2" : "hidden")}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
        <nav className={cn("flex-1 flex flex-col gap-1 py-4", !isSidebarOpen && "items-center")}>
          {navItems.map((item) => (
            <SidebarNavLink key={item.href} item={item} />
          ))}
        </nav>
        
        {/* Collapsible button */}
        {!isSidebarOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)} 
            className="h-9 w-9 mb-1"
          >
            <PanelLeft className="h-5 w-5 rotate-180" />
            <span className="sr-only">Expand sidebar</span>
          </Button>
        )}
        
        <div className={cn("border-t", !isSidebarOpen && "flex justify-center w-full")}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {isSidebarOpen ? (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full mt-4 mb-2"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Logout</span>
                  </Button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-lg h-9 w-9 mt-4 mb-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                  </button>
                )}
              </TooltipTrigger>
              {!isSidebarOpen && (
                <TooltipContent side="right" sideOffset={5}>
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-16"
        )}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <Sheet>
             <SheetTrigger asChild>
               <Button size="icon" variant="outline" className="md:hidden">
                 <Menu className="h-5 w-5" />
                 <span className="sr-only">Toggle Menu</span>
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="sm:max-w-xs">
               <nav className="grid gap-4 text-lg font-medium p-4">
                <Link
                  to="/"
                  className="group flex items-center gap-2 h-10 text-lg font-semibold"
                >
                  <Bot className="h-6 w-6 text-primary transition-all group-hover:scale-110" />
                  <span>DawsBot</span>
                </Link>
                 {navItems.map((item) => <MobileNavLink key={item.href} item={item} />)}
                 <button 
                   onClick={handleLogout}
                   className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground mt-auto"
                 >
                   <LogOut className="h-5 w-5" />
                   Logout
                 </button>
               </nav>
             </SheetContent>
           </Sheet>

           <h2 className="text-lg font-semibold flex-1 ml-auto">
             {navItems.find(item => location.pathname.startsWith(item.href) && item.href !== '/' )?.name || 'Dashboard'}
           </h2>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        {isChatOpen ? (
          <ChatWidget 
             onClose={() => setIsChatOpen(false)} 
             configIdentifier="default"
          />
        ) : (
          <Button 
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg" 
            onClick={() => setIsChatOpen(true)}
            aria-label="Open chat"
          >
            <MessageCircleMore className="h-6 w-6" />
          </Button>
        )}
      </div>

      <Toaster />
    </div>
  );
};

export default DashboardLayout;
