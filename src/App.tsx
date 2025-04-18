import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/Layout/Dashboard";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// Create a client
const queryClient = new QueryClient();

// New component to handle routing logic based on auth state
const AppRoutes = () => {
  const { session, loading } = useAuth();

  if (loading) {
    // Optional: Render a loading indicator while session is being checked
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to dashboard if logged in, otherwise handled by App */} 
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace /> } />
        
        {/* Protected Routes */} 
        <Route path="/dashboard" element={session ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/auth" replace />} />
        <Route path="/leads" element={session ? <DashboardLayout><Leads /></DashboardLayout> : <Navigate to="/auth" replace />} />
        <Route path="/analytics" element={session ? <DashboardLayout><Analytics /></DashboardLayout> : <Navigate to="/auth" replace />} />
        <Route path="/conversations" element={session ? <DashboardLayout><Conversations /></DashboardLayout> : <Navigate to="/auth" replace />} />
        <Route path="/conversations/:id" element={session ? <DashboardLayout><ConversationDetail /></DashboardLayout> : <Navigate to="/auth" replace />} />
        <Route path="/settings" element={session ? <DashboardLayout><Settings /></DashboardLayout> : <Navigate to="/auth" replace />} />
        
        {/* Auth Route (handled in App component) */} 
        {/* <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/dashboard" replace />} /> */} 

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SettingsProvider>
          {/* Wrap entire app with AuthProvider */}
          <AuthProvider>
            <Toaster />
            <Sonner />
            {/* Render Auth UI or AppRoutes based on session */}
            <AuthWrapper /> 
          </AuthProvider>
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Helper component to access auth state after provider
const AuthWrapper = () => {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded shadow-md w-full max-w-md">
           <h2 className="text-2xl font-semibold text-center mb-6">DawsBot Login</h2>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            socialLayout="horizontal"
            theme="light"
          />
        </div>
      </div>
    );
  } else {
    // Render the main app routes if session exists
    return <AppRoutes />;
  }
}

export default App;
