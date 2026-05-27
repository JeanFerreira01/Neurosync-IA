import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CalendarDays, LogIn, Clock, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodayAppointments, useWeekAppointments, useAppointmentAction } from "@/hooks/useAppointments";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_DOT: Record<AppointmentStatus, string> = {
  pending:     "rgba(250,180,50,1)",
  confirmed:   "rgba(80,210,130,1)",
  in_progress: "rgba(80,160,255,1)",
  finished:    "rgba(120,100,180,0.4)",
  canceled:    "rgba(220,80,80,0.6)",
  no_show:     "rgba(200,100,100,0.6)",
};

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function urgencyTag(appt: Appointment): { text: string; color: string; glow: boolean } {
  if (appt.status === "in_progress") return { text: "Em andamento", color: "rgba(80,160,255,0.95)", glow: true };
  const mins = minutesUntil(appt.scheduled_at);
  if (mins < -5)  return { text: "Atrasado", color: "rgba(255,80,80,0.95)", glow: true };
  if (mins <= 10) return { text: `${mins <= 0 ? "Agora" : `em ${mins}min`}`, color: "rgba(255,160,50,0.95)", glow: true };
  if (mins <= 30) return { text: `em ${mins}min`, color: "rgba(200,150,255,0.85)", glow: false };
  const d = new Date(appt.scheduled_at);
  const today = new Date().toDateString() === d.toDateString();
  return {
    text: today
      ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" }),
    color: "rgba(150,130,200,0.5)",
    glow: false,
  };
}

function toISO(d: Date) { return d.toISOString().split("T")[0]; }

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: todayAppts = [] } = useTodayAppointments();
  const { data: weekData } = useWeekAppointments(toISO(new Date()));
  const weekAppts: Appointment[] = weekData?.appointments ?? [];
  const actions = useAppointmentAction();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Position dropdown below button
  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  };

  const now = new Date();

  // Urgent = in_progress OR starts within 30 min OR overdue but not finished
  const urgent = todayAppts.filter((a) => {
    if (["finished", "canceled", "no_show"].includes(a.status)) return false;
    if (a.status === "in_progress") return true;
    const mins = minutesUntil(a.scheduled_at);
    return mins <= 30;
  });

  const badgeCount = urgent.length;

  // Items to show: today active first, then upcoming from week (next 3 days)
  const todayActive = todayAppts
    .filter((a) => !["finished", "canceled", "no_show"].includes(a.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const upcomingWeek = weekAppts
    .filter((a) => {
      if (["finished", "canceled", "no_show"].includes(a.status)) return false;
      const d = new Date(a.scheduled_at);
      if (d.toDateString() === now.toDateString()) return false; // already in todayActive
      return d > now;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);

  const todayDone = todayAppts.filter((a) => ["finished", "canceled", "no_show"].includes(a.status));

  const isEmpty = todayActive.length === 0 && upcomingWeek.length === 0;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          position: "relative", width: 36, height: 36, borderRadius: 11,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: open ? "1px solid rgba(160,80,255,0.45)" : "1px solid rgba(120,80,255,0.15)",
          background: open ? "rgba(120,60,255,0.15)" : "rgba(120,60,255,0.06)",
          color: badgeCount > 0 ? "rgba(210,160,255,0.95)" : "rgba(160,140,210,0.55)",
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,60,255,0.12)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,60,255,0.06)"; }}
      >
        <Bell size={16} />
        <AnimatePresence>
          {badgeCount > 0 && (
            <motion.span key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{
                position: "absolute", top: 4, right: 4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: "linear-gradient(135deg, #ff5050, #dc2020)",
                boxShadow: "0 0 8px rgba(255,60,60,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 800, color: "#fff", padding: "0 3px",
              }}>
              {badgeCount > 9 ? "9+" : badgeCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Portal — renderizado no body, sem z-index inheritance */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropRef}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                right: dropdownPos.right,
                zIndex: 9999,
                width: 360,
                borderRadius: 18,
                border: "1px solid rgba(140,80,255,0.25)",
                background: "linear-gradient(160deg, rgba(18,11,40,0.99) 0%, rgba(10,7,26,0.99) 100%)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(180,100,255,0.06)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid rgba(120,80,255,0.1)",
                background: "rgba(0,0,0,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={13} style={{ color: "rgba(180,140,255,0.7)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(220,210,255,0.95)" }}>
                    Próximas Consultas
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {badgeCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                      background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.3)",
                      color: "rgba(255,120,120,0.95)",
                    }}>
                      {badgeCount} urgente{badgeCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <button onClick={() => setOpen(false)}
                    style={{ width: 24, height: 24, borderRadius: 7, border: "none", background: "rgba(120,80,255,0.1)", color: "rgba(160,140,210,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {isEmpty ? (
                  <div style={{ padding: "36px 18px", textAlign: "center" }}>
                    <CalendarDays size={32} style={{ color: "rgba(140,120,200,0.2)", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: 0, fontWeight: 600 }}>
                      Nenhuma consulta nos próximos dias
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(160,140,200,0.35)", margin: "4px 0 0" }}>
                      {todayDone.length > 0 ? `${todayDone.length} concluída${todayDone.length > 1 ? "s" : ""} hoje` : "Agende consultas na Agenda"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Hoje */}
                    {todayActive.length > 0 && (
                      <>
                        <div style={{ padding: "8px 18px 4px", fontSize: 10, fontWeight: 700, color: "rgba(160,130,210,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Hoje · {todayDone.length > 0 && `${todayDone.length} concluída${todayDone.length > 1 ? "s" : ""}`}
                        </div>
                        {todayActive.map((appt, i) => (
                          <ApptRow key={appt.id} appt={appt} isLast={i === todayActive.length - 1 && upcomingWeek.length === 0} actions={actions} onNavigate={() => { setOpen(false); navigate("/appointments"); }} />
                        ))}
                      </>
                    )}

                    {/* Próximos dias */}
                    {upcomingWeek.length > 0 && (
                      <>
                        <div style={{ padding: "8px 18px 4px", fontSize: 10, fontWeight: 700, color: "rgba(160,130,210,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", borderTop: todayActive.length > 0 ? "1px solid rgba(120,80,255,0.08)" : "none", marginTop: todayActive.length > 0 ? 4 : 0 }}>
                          Esta semana
                        </div>
                        {upcomingWeek.map((appt, i) => (
                          <ApptRow key={appt.id} appt={appt} isLast={i === upcomingWeek.length - 1} actions={actions} onNavigate={() => { setOpen(false); navigate("/appointments"); }} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "10px 18px",
                borderTop: "1px solid rgba(120,80,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, color: "rgba(160,140,210,0.4)" }}>
                  {todayAppts.length} consulta{todayAppts.length !== 1 ? "s" : ""} hoje · atualiza a cada 60s
                </span>
                <button onClick={() => { setOpen(false); navigate("/appointments"); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "rgba(180,130,255,0.8)", background: "none", border: "none", cursor: "pointer" }}>
                  Ver agenda <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function ApptRow({ appt, isLast, actions, onNavigate }: {
  appt: Appointment;
  isLast: boolean;
  actions: ReturnType<typeof useAppointmentAction>;
  onNavigate: () => void;
}) {
  const urg = urgencyTag(appt);
  const isCheckinable = appt.status === "pending" || appt.status === "confirmed";
  const isInProgress = appt.status === "in_progress";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px",
      borderBottom: isLast ? "none" : "1px solid rgba(120,80,255,0.07)",
      background: urg.glow ? "rgba(255,100,50,0.03)" : "transparent",
      cursor: "pointer",
      transition: "background 0.12s",
    }}
      onClick={onNavigate}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(120,80,255,0.06)"}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = urg.glow ? "rgba(255,100,50,0.03)" : "transparent"}
    >
      {/* Status dot */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: STATUS_DOT[appt.status],
        boxShadow: urg.glow ? `0 0 8px ${STATUS_DOT[appt.status]}` : "none",
        marginTop: 1,
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(218,208,248,0.9)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {appt.patient_name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <Clock size={10} style={{ color: "rgba(150,130,190,0.4)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "rgba(155,135,200,0.5)" }}>
            {new Date(appt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {" · "}{appt.duration_minutes}min
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: urg.color,
            textShadow: urg.glow ? `0 0 12px ${urg.color}` : "none",
          }}>
            · {urg.text}
          </span>
        </div>
      </div>

      {/* Ação inline */}
      {isCheckinable && (
        <button
          onClick={(e) => { e.stopPropagation(); actions.checkin.mutate(appt.id); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            border: "1px solid rgba(80,200,120,0.35)",
            background: "rgba(60,180,100,0.12)",
            color: "rgba(100,230,150,0.9)",
            cursor: "pointer", flexShrink: 0,
          }}>
          <LogIn size={11} /> Check-in
        </button>
      )}
      {isInProgress && (
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: "1px solid rgba(80,160,255,0.25)",
          background: "rgba(60,120,255,0.1)",
          color: "rgba(130,190,255,0.85)",
          flexShrink: 0,
        }}>
          <CheckCircle2 size={11} /> Atendendo
        </span>
      )}
    </div>
  );
}
