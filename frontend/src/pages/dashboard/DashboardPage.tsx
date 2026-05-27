import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/authStore";
import { useTodayAppointments, useWeekAppointments } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useReports } from "@/hooks/useReports";
import { CalendarDays, Users, FileText, Clock, ArrowUpRight } from "lucide-react";
import { WeeklyChart, StatusChart, PatientsChart, PerformanceChart } from "./DashboardCharts";

function toISO(d: Date) { return d.toISOString().split("T")[0]; }

const statCards = [
  {
    label: "Consultas Hoje",
    key: "today",
    icon: CalendarDays,
    href: "/appointments",
    gradient: "linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)",
    glow: "rgba(91,33,182,0.4)",
    border: "rgba(139,92,246,0.3)",
    accent: "rgba(196,160,255,0.9)",
  },
  {
    label: "Pacientes Ativos",
    key: "patients",
    icon: Users,
    href: "/patients",
    gradient: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
    glow: "rgba(30,64,175,0.4)",
    border: "rgba(96,165,250,0.3)",
    accent: "rgba(147,197,253,0.9)",
  },
  {
    label: "Laudos em Aberto",
    key: "reports",
    icon: FileText,
    href: "/reports",
    gradient: "linear-gradient(135deg, #065f46 0%, #022c22 100%)",
    glow: "rgba(6,95,70,0.4)",
    border: "rgba(52,211,153,0.3)",
    accent: "rgba(110,231,183,0.9)",
  },
  {
    label: "Próxima Consulta",
    key: "next",
    icon: Clock,
    href: "/appointments",
    gradient: "linear-gradient(135deg, #92400e 0%, #451a03 100%)",
    glow: "rgba(146,64,14,0.4)",
    border: "rgba(251,191,36,0.3)",
    accent: "rgba(253,224,132,0.9)",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: todayAppts } = useTodayAppointments();
  const { data: weekData } = useWeekAppointments(toISO(new Date()));
  const { data: patients } = usePatients({ is_active: true });
  const { data: openReports = [] } = useReports();

  const openReportsCount = openReports.filter((r) => r.status !== "signed").length;

  const weekAppts = weekData?.appointments ?? [];

  const nextAppt = (() => {
    const now = new Date();
    const pool = [
      ...(todayAppts ?? []),
      ...weekAppts,
    ]
      // deduplicate by id
      .filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i)
      .filter((a) => !["finished", "canceled", "no_show"].includes(a.status) && new Date(a.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    return pool[0] ?? null;
  })();

  const nextLabel = (() => {
    if (!nextAppt) {
      const inProgress = (todayAppts ?? []).find((a) => a.status === "in_progress");
      if (inProgress) return "Em andamento";
      return "—";
    }
    const now = new Date();
    const diff = Math.round((new Date(nextAppt.scheduled_at).getTime() - now.getTime()) / 60000);
    if (diff <= 0) return "Agora";
    if (diff < 60) return `em ${diff}min`;
    const d = new Date(nextAppt.scheduled_at);
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  })();

  const values: Record<string, string | number> = {
    today: todayAppts?.length ?? 0,
    patients: patients?.count ?? 0,
    reports: openReportsCount,
    next: nextLabel,
  };

  const firstName = user?.first_name || user?.username || "Usuário";

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Saudação */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p style={{ fontSize: 13, color: "rgba(200,170,255,0.45)", margin: 0 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: "4px 0 0", letterSpacing: "-0.3px" }}>
            Olá, {firstName} 👋
          </h1>
        </motion.div>

        {/* Cards de estatísticas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {statCards.map(({ label, key, icon: Icon, href, gradient, glow, border, accent }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              onClick={() => navigate(href)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                borderRadius: 18,
                padding: "20px 20px 18px",
                background: gradient,
                boxShadow: `0 8px 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                border: `1px solid ${border}`,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {/* Brilho decorativo */}
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", filter: "blur(20px)",
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Icon size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
                  <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.4)", transition: "transform 0.2s" }} />
                </div>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "10px 0 0", lineHeight: 1 }}>
                  {values[key]}
                </p>
                <p style={{ fontSize: 12, color: accent, margin: "6px 0 0", fontWeight: 500 }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gráficos — linha 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}
        >
          <WeeklyChart />
          <StatusChart />
        </motion.div>

        {/* Gráficos — linha 2 + Agenda do dia */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
        >
          <PatientsChart />
          <PerformanceChart />

          {/* Agenda do dia */}
          <div style={{
            borderRadius: 20,
            background: "rgba(18,12,42,0.75)",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(225,215,255,0.9)", margin: 0 }}>Agenda de Hoje</p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: "rgba(140,60,255,0.18)", color: "rgba(200,140,255,0.9)",
                border: "1px solid rgba(140,60,255,0.2)",
              }}>
                {todayAppts?.length ?? 0} consultas
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {!todayAppts?.length ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: "rgba(180,160,220,0.35)" }}>
                  <CalendarDays size={28} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Nenhuma consulta hoje</p>
                </div>
              ) : (
                todayAppts.map((a, i) => (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px",
                    borderBottom: i < todayAppts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(190,130,255,0.9)", fontFamily: "monospace", width: 42, flexShrink: 0 }}>
                      {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(220,210,255,0.85)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.patient_name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
}
