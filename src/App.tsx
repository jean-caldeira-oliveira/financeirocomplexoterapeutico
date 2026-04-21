import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Lazy-load all page components so each route gets its own JS chunk,
// dramatically reducing the initial bundle size (fixes "Reduza o JavaScript
// não usado" Lighthouse diagnostic).
const Index = lazy(() => import("./pages/Index"));
const Patients = lazy(() => import("./pages/Patients"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Bills = lazy(() => import("./pages/Bills"));
const Reports = lazy(() => import("./pages/Reports"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Shared full-screen spinner used while a lazy chunk is loading.
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Suspense boundary wraps all routes so lazy chunks show the spinner
            while they are being fetched. */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cobrancas"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contas"
              element={
                <ProtectedRoute>
                  <Bills />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
