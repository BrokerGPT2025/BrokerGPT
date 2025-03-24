import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { ChatProvider } from '@/context/ChatContext';
import ChatPage from '@/pages/ChatPage';
import ClientListPage from '@/pages/ClientListPage';
import ClientProfilePage from '@/pages/ClientProfilePage';
import CarriersPage from '@/pages/CarriersPage';
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/Sidebar";
import SimpleClientSelector from '@/components/SimpleClientSelector';

// Layout component that applies the sidebar to routes that need it
function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Only show sidebar for non-chat pages
  const showSidebar = location !== "/";
  
  if (!showSidebar) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/clients" component={() => {
          return (
            <div className="container mx-auto py-6">
              <h1 className="text-2xl font-bold mb-4">Select a Client</h1>
              <SimpleClientSelector />
              <div className="mt-8">
                <Button 
                  onClick={() => window.location.href="/clients/1"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Chicko Chicken Ltd (Client #1)
                </Button>
              </div>
            </div>
          );
        }} />
        <Route path="/clients/:id" component={ClientProfilePage} />
        <Route path="/carriers" component={CarriersPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <Router />
        <Toaster />
      </ChatProvider>
    </QueryClientProvider>
  );
}

export default App;
