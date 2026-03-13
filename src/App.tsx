import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerForm from "@/pages/CustomerForm";
import Quotations from "@/pages/Quotations";
import Masters from "@/pages/Masters";
import Projects from "@/pages/Projects";
import ProjectForm from "@/pages/ProjectForm";
import PDFPreview from "@/pages/PDFPreview";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import ApprovalManagement from "@/pages/ApprovalManagement";
import EmailLogs from "@/pages/EmailLogs";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ============================================================
// Loading Screen
// ============================================================
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

// ============================================================
// Protected Route - requires authentication
// ============================================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ============================================================
// Permission Route - requires specific permission(s)
// ============================================================
const PermissionRoute: React.FC<{
  children: React.ReactNode;
  permission?: string;
  anyPermission?: string[];
  fallback?: string;
}> = ({ children, permission, anyPermission, fallback = "/dashboard" }) => {
  const { isAuthenticated, hasPermission, hasAnyPermission, loading } =
    useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  // Check any of multiple permissions
  if (
    anyPermission &&
    anyPermission.length > 0 &&
    !hasAnyPermission(...anyPermission)
  ) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

// ============================================================
// App Routes
// ============================================================
const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Protected routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard - everyone can see */}
        <Route
          path="dashboard"
          element={
            <PermissionRoute permission="dashboard:view">
              <Dashboard />
            </PermissionRoute>
          }
        />

        {/* Customers */}
        <Route
          path="customers"
          element={
            <PermissionRoute permission="customer:view">
              <Customers />
            </PermissionRoute>
          }
        />
        <Route
          path="customers/new"
          element={
            <PermissionRoute permission="customer:create">
              <CustomerForm />
            </PermissionRoute>
          }
        />
        <Route
          path="customers/edit/:id"
          element={
            <PermissionRoute permission="customer:edit">
              <CustomerForm />
            </PermissionRoute>
          }
        />

        {/* Quotations (was Products) */}
        <Route
          path="products"
          element={
            <PermissionRoute permission="quotation:view">
              <Quotations />
            </PermissionRoute>
          }
        />

        {/* Masters */}
        <Route
          path="masters"
          element={
            <PermissionRoute permission="master:view">
              <Masters />
            </PermissionRoute>
          }
        />

        {/* Projects (was Quotations) */}
        <Route
          path="projects"
          element={
            <PermissionRoute permission="project:view">
              <Projects />
            </PermissionRoute>
          }
        />
        <Route
          path="projects/new"
          element={
            <PermissionRoute permission="project:create">
              <ProjectForm />
            </PermissionRoute>
          }
        />
        <Route
          path="projects/edit/:id"
          element={
            <PermissionRoute permission="project:edit">
              <ProjectForm />
            </PermissionRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <PermissionRoute permission="project:view">
              <ProjectForm />
            </PermissionRoute>
          }
        />
        <Route
          path="projects/:id/pdf"
          element={
            <PermissionRoute permission="project:view">
              <PDFPreview />
            </PermissionRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <PermissionRoute permission="report:view">
              <Reports />
            </PermissionRoute>
          }
        />

        {/* User & Role Management */}
        <Route
          path="users"
          element={
            <PermissionRoute anyPermission={["user:view", "role:view"]}>
              <UserManagement />
            </PermissionRoute>
          }
        />

        {/* Approvals */}
        <Route
          path="approvals"
          element={
            <PermissionRoute permission="approval:view">
              <ApprovalManagement />
            </PermissionRoute>
          }
        />

        {/* Email Logs */}
        <Route
          path="email-logs"
          element={
            <PermissionRoute permission="email_log:view">
              <EmailLogs />
            </PermissionRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <PermissionRoute permission="setting:manage">
              <Settings />
            </PermissionRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ============================================================
// App Entry
// ============================================================
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;