import { AppLayout } from "@/components/AppLayout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Colaboradores = lazy(() => import("./pages/Colaboradores"));
const DashboardComercial = lazy(() => import("./pages/DashboardComercial"));
const Orcamento = lazy(() => import("./pages/Orcamento"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Leads = lazy(() => import("./pages/Leads"));
const JuridicoDashboard = lazy(() => import("./pages/juridico/JuridicoDashboard"));
const Ativos = lazy(() => import("./pages/juridico/Ativos"));
const Passivos = lazy(() => import("./pages/juridico/Passivos"));
const RH = lazy(() => import("./pages/RH"));
const RHDashboard = lazy(() => import("./pages/rh/RHDashboard"));
const RHColaboradores = lazy(() => import("./pages/rh/RHColaboradores"));
const Escala = lazy(() => import("./pages/rh/Escala"));
const FeriasAusencias = lazy(() => import("./pages/rh/FeriasAusencias"));
const PontoJornada = lazy(() => import("./pages/rh/PontoJornada"));
const Acompanhamentos = lazy(() => import("./pages/rh/Acompanhamentos"));
const Treinamentos = lazy(() => import("./pages/rh/Treinamentos"));
const BancoTalentos = lazy(() => import("./pages/rh/BancoTalentos"));
const Lavanderia = lazy(() => import("./pages/Lavanderia"));
const Cantina = lazy(() => import("./pages/Cantina"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Support = lazy(() => import("./pages/Support"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
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

  return <AppLayout>{children}</AppLayout>;
};

// AdminRoute: requires both authentication AND admin role.
// Prevents any authenticated non-admin user from accessing /admin
// even if they know the URL directly.
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (loading || adminLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
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
              path="/fornecedores"
              element={
                <ProtectedRoute>
                  <Fornecedores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <ProtectedRoute>
                  <Colaboradores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comercial/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardComercial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orcamento"
              element={
                <ProtectedRoute>
                  <Orcamento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing"
              element={
                <ProtectedRoute>
                  <Marketing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comercial/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />
            <Route path="/juridico" element={<Navigate to="/juridico/dashboard" replace />} />
            <Route
              path="/juridico/dashboard"
              element={
                <ProtectedRoute>
                  <JuridicoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/juridico/ativos"
              element={
                <ProtectedRoute>
                  <Ativos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/juridico/passivos"
              element={
                <ProtectedRoute>
                  <Passivos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh"
              element={
                <ProtectedRoute>
                  <RH />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/dashboard"
              element={
                <ProtectedRoute>
                  <RHDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/colaboradores"
              element={
                <ProtectedRoute>
                  <RHColaboradores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/escala"
              element={
                <ProtectedRoute>
                  <Escala />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/ferias-ausencias"
              element={
                <ProtectedRoute>
                  <FeriasAusencias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/ponto-jornada"
              element={
                <ProtectedRoute>
                  <PontoJornada />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/acompanhamentos"
              element={
                <ProtectedRoute>
                  <Acompanhamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/treinamentos"
              element={
                <ProtectedRoute>
                  <Treinamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh/banco-de-talentos"
              element={
                <ProtectedRoute>
                  <BancoTalentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lavanderia"
              element={
                <ProtectedRoute>
                  <Lavanderia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cantina"
              element={
                <ProtectedRoute>
                  <Cantina />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suporte"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <AdminRoute>
                  <AuditLog />
                </AdminRoute>
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
