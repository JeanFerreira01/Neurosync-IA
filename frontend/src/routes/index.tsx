import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PatientsPage from "@/pages/patients/PatientsPage";
import AppointmentsPage from "@/pages/appointments/AppointmentsPage";
import AdminPage from "@/pages/admin/AdminPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import FinancialPage from "@/pages/financial/FinancialPage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import NeurotestsPage from "@/pages/neurotests/NeurotestsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin_master") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">{title}</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Em desenvolvimento — próximos Sprints</p>
      </div>
    </AppLayout>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><PatientsPage /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/neurotests" element={<PrivateRoute><NeurotestsPage /></PrivateRoute>} />
        <Route path="/financial" element={<PrivateRoute><FinancialPage /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
