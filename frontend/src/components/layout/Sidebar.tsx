import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarDays, FileText,
  Brain, Package, DollarSign, LogOut, Zap, ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/appointments", icon: CalendarDays, label: "Agenda" },
  { to: "/reports", icon: FileText, label: "Laudos" },
  { to: "/neurotests", icon: Brain, label: "Testes" },
  { to: "/financial", icon: DollarSign, label: "Financeiro" },
  { to: "/inventory", icon: Package, label: "Estoque" },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAdminMaster = user?.role === "admin_master";

  return (
    <motion.aside
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-[220px] min-h-screen flex flex-col shrink-0 relative"
      style={{
        background: "linear-gradient(180deg, rgba(30,15,60,0.95) 0%, rgba(10,8,25,0.98) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Glow de fundo decorativo */}
      <div
        className="absolute top-0 left-0 w-full h-56 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 0%, rgba(160,60,255,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #c840ff 0%, #6040ff 100%)",
              boxShadow: "0 0 18px rgba(180,60,255,0.5)",
            }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-none" style={{ color: "#e8d5ff" }}>
              NeuroSync
            </p>
            <p className="text-[9px] tracking-[0.18em] uppercase mt-0.5" style={{ color: "rgba(200,160,255,0.5)" }}>
              AI Platform
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.045, duration: 0.3 }}
          >
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[rgba(180,170,210,0.65)] hover:text-[rgba(220,210,255,0.9)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, rgba(160,60,255,0.3) 0%, rgba(80,60,200,0.2) 100%)",
                        border: "1px solid rgba(180,80,255,0.25)",
                        boxShadow: "0 0 12px rgba(160,60,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  )}
                  <Icon
                    size={16}
                    className="relative z-10 shrink-0"
                    style={{ color: isActive ? "rgba(220,160,255,1)" : "inherit" }}
                  />
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Admin link — admin_master only */}
      {isAdminMaster && (
        <>
          <div className="mx-4 mt-2" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
          <div className="px-3 pt-2 pb-1">
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(200,140,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", paddingLeft: 12, marginBottom: 4 }}>
              Administração
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive ? "text-white" : "text-[rgba(180,170,210,0.65)] hover:text-[rgba(220,210,255,0.9)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, rgba(160,60,255,0.3) 0%, rgba(80,60,200,0.2) 100%)",
                        border: "1px solid rgba(180,80,255,0.25)",
                        boxShadow: "0 0 12px rgba(160,60,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    />
                  )}
                  <ShieldCheck
                    size={16}
                    className="relative z-10 shrink-0"
                    style={{ color: isActive ? "rgba(220,160,255,1)" : "inherit" }}
                  />
                  <span className="relative z-10">Admin</span>
                </>
              )}
            </NavLink>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="mx-4 mt-2" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* Logout */}
      <div className="px-3 py-4">
        <button
          onClick={logout}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
          style={{ color: "rgba(180,170,210,0.55)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,100,100,0.9)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,50,50,0.07)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(180,170,210,0.55)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          Sair da plataforma
        </button>
      </div>
    </motion.aside>
  );
}
