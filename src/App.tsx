
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { DataProvider } from "@/contexts/DataContext";

import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import AuditTrail from "@/pages/AuditTrail";
import Export from "@/pages/Export";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// App wrapper with context providers
const AppWithProviders = () => {
  return (
    <AuthProvider>
      <AuditProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuditProvider>
    </AuthProvider>
  );
};

// Routes component
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Index />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/audit" element={
        <ProtectedRoute>
          <Layout>
            <AuditTrail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/export" element={
        <ProtectedRoute>
          <Layout>
            <Export />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <Sonner />
      <AppWithProviders />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
