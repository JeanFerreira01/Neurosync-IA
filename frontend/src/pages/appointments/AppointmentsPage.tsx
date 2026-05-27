import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Video, LogIn, LogOut,
  X, UserMinus, Clock, CheckCircle2, CircleDot, Ban, UserX,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { AppointmentForm } from "./AppointmentForm";
import { useWeekAppointments, useTodayAppointments, useAppointmentAction } from "@/hooks/useAppointments";
import type { Appointment, AppointmentStatus } from "@/types";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);

const STATUS_BADGE: Record<AppointmentStatus, { label: string; variant: "success" | "warning" | "info" | "danger" | "muted" | "default" }> = {
  confirmed:   { label: "Confirmado",   variant: "success" },
  pending:     { label: "Pendente",     variant: "warning" },
  in_progress: { label: "Em Andamento", variant: "info" },
  finished:    { label: "Finalizado",   variant: "muted" },
  canceled:    { label: "Cancelado",    variant: "danger" },
  no_show:     { label: "Falta",        variant: "danger" },
};

const STATUS_CARD: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  pending:     { bg: "rgba(250,180,50,0.15)",  border: "rgba(250,180,50,0.35)",  text: "rgba(255,210,100,0.95)" },
  confirmed:   { bg: "rgba(80,200,120,0.15)",  border: "rgba(80,200,120,0.35)",  text: "rgba(120,230,160,0.95)" },
  in_progress: { bg: "rgba(80,160,255,0.18)",  border: "rgba(80,160,255,0.4)",   text: "rgba(130,190,255,0.95)" },
  finished:    { bg: "rgba(120,100,180,0.12)", border: "rgba(120,100,180,0.25)", text: "rgba(180,160,220,0.7)"  },
  canceled:    { bg: "rgba(220,50,50,0.12)",   border: "rgba(220,50,50,0.28)",   text: "rgba(255,110,110,0.8)"  },
  no_show:     { bg: "rgba(200,80,80,0.12)",   border: "rgba(200,80,80,0.25)",   text: "rgba(240,130,130,0.8)"  },
};

const STATUS_ICON: Record<AppointmentStatus, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  pending:     ({ size, style }) => <Clock size={size} style={style} />,
  confirmed:   ({ size, style }) => <CheckCircle2 size={size} style={style} />,
  in_progress: ({ size, style }) => <CircleDot size={size} style={style} />,
  finished:    ({ size, style }) => <CheckCircle2 size={size} style={style} />,
  canceled:    ({ size, style }) => <Ban size={size} style={style} />,
  no_show:     ({ size, style }) => <UserX size={size} style={style} />,
};

function getWeekStart(offset = 0): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  return new Date(d.setDate(diff));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const weekStart = getWeekStart(weekOffset);
  const { data: weekData, isLoading } = useWeekAppointments(toISO(weekStart));
  const { data: todayAppts = [] } = useTodayAppointments();
  const actions = useAppointmentAction();

  const appointments: Appointment[] = weekData?.appointments ?? [];

  const apptsByDayHour = (dayIdx: number, hour: number) => {
    const day = addDays(weekStart, dayIdx);
    return appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      return toISO(d) === toISO(day) && d.getHours() === hour;
    });
  };

  const weekLabel = () => {
    const end = addDays(weekStart, 6);
    return `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  const isCheckinable = (status: AppointmentStatus) => status === "pending" || status === "confirmed";

  const doAction = (fn: (id: string) => void, id: string) => {
    fn(id);
    setSelectedAppt(null);
  };

  const queueOrder: AppointmentStatus[] = ["in_progress", "confirmed", "pending", "finished", "canceled", "no_show"];
  const sortedToday = [...todayAppts].sort((a, b) =>
    queueOrder.indexOf(a.status) - queueOrder.indexOf(b.status)
  );

  return (
    <AppLayout>
      <div style={{ padding: "24px 28px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>Agenda</h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>{weekLabel()}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setWeekOffset((o) => o - 1)}
              style={{ padding: "6px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "transparent", color: "rgba(160,140,210,0.6)", cursor: "pointer" }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setWeekOffset(0)}
              style={{ padding: "5px 12px", fontSize: 12, borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "transparent", color: "rgba(160,140,210,0.6)", cursor: "pointer" }}>
              Hoje
            </button>
            <button onClick={() => setWeekOffset((o) => o + 1)}
              style={{ padding: "6px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "transparent", color: "rgba(160,140,210,0.6)", cursor: "pointer" }}>
              <ChevronRight size={18} />
            </button>
            <Button onClick={() => { setSelectedDate(toISO(new Date())); setShowForm(true); }} size="sm">
              <Plus size={15} /> Novo
            </Button>
          </div>
        </motion.div>

        {/* ── Fila de Atendimento (hoje) ── */}
        {todayAppts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CircleDot size={13} style={{ color: "rgba(80,160,255,0.8)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(160,140,210,0.55)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Fila de Hoje — {todayAppts.length} agendamento{todayAppts.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              <AnimatePresence>
                {sortedToday.map((appt, i) => {
                  const sc = STATUS_CARD[appt.status];
                  const Icon = STATUS_ICON[appt.status];
                  const finished = ["finished", "canceled", "no_show"].includes(appt.status);
                  return (
                    <motion.div key={appt.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        padding: "14px 16px", borderRadius: 16,
                        border: `1px solid ${sc.border}`,
                        background: sc.bg,
                        display: "flex", flexDirection: "column", gap: 10,
                        opacity: finished ? 0.6 : 1,
                      }}>
                      {/* Paciente + horário */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={appt.patient_name} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: sc.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {appt.patient_name}
                          </p>
                          <p style={{ fontSize: 11, color: "rgba(180,160,220,0.55)", margin: "2px 0 0" }}>
                            {formatTime(appt.scheduled_at)} · {appt.duration_minutes}min
                            {appt.is_telemedicine && <Video size={10} style={{ display: "inline", marginLeft: 5, color: "rgba(100,160,255,0.8)" }} />}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon size={13} style={{ color: sc.text }} />
                        </div>
                      </div>

                      {/* Timestamps */}
                      {(appt.checkin_at || appt.checkout_at) && (
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "rgba(160,140,210,0.5)" }}>
                          {appt.checkin_at && <span>Check-in {formatTime(appt.checkin_at)}</span>}
                          {appt.checkout_at && <span>Check-out {formatTime(appt.checkout_at)}</span>}
                        </div>
                      )}

                      {/* Ações */}
                      {!finished && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {isCheckinable(appt.status) && (
                            <button
                              onClick={() => actions.checkin.mutate(appt.id)}
                              disabled={actions.checkin.isPending}
                              style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                border: "1px solid rgba(80,200,120,0.4)",
                                background: "rgba(60,180,100,0.15)",
                                color: "rgba(100,230,150,0.95)",
                              }}>
                              <LogIn size={13} /> Check-in
                            </button>
                          )}
                          {appt.status === "in_progress" && (
                            <button
                              onClick={() => actions.checkout.mutate(appt.id)}
                              disabled={actions.checkout.isPending}
                              style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                padding: "7px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                border: "1px solid rgba(80,160,255,0.4)",
                                background: "rgba(60,130,255,0.15)",
                                color: "rgba(130,190,255,0.95)",
                              }}>
                              <LogOut size={13} /> Check-out
                            </button>
                          )}
                          {!["finished", "canceled", "no_show"].includes(appt.status) && (
                            <>
                              <button
                                onClick={() => actions.cancel.mutate(appt.id)}
                                style={{
                                  padding: "7px 9px", borderRadius: 9, fontSize: 11, cursor: "pointer",
                                  border: "1px solid rgba(220,50,50,0.25)",
                                  background: "rgba(180,40,40,0.1)",
                                  color: "rgba(255,110,110,0.8)",
                                }}>
                                <X size={12} />
                              </button>
                              <button
                                onClick={() => actions.noShow.mutate(appt.id)}
                                style={{
                                  padding: "7px 9px", borderRadius: 9, fontSize: 11, cursor: "pointer",
                                  border: "1px solid rgba(180,80,80,0.2)",
                                  background: "rgba(150,60,60,0.08)",
                                  color: "rgba(220,130,130,0.7)",
                                }}>
                                <UserX size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {finished && (
                        <div style={{ textAlign: "center" }}>
                          <Badge {...STATUS_BADGE[appt.status]} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── Grade Semanal ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(160,140,210,0.55)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Visão Semanal
            </span>
          </div>
          <div style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.8)", overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", minWidth: 780 }}>

              {/* Header dias */}
              <div style={{ background: "rgba(18,12,40,0.9)", borderBottom: "1px solid rgba(120,80,255,0.12)" }} />
              {DAYS.map((day, i) => {
                const d = addDays(weekStart, i);
                const isToday = toISO(d) === toISO(new Date());
                return (
                  <div key={day} style={{
                    background: isToday ? "rgba(120,60,255,0.1)" : "rgba(18,12,40,0.9)",
                    borderBottom: "1px solid rgba(120,80,255,0.12)",
                    borderLeft: "1px solid rgba(120,80,255,0.08)",
                    padding: "10px 8px", textAlign: "center",
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: 0, color: isToday ? "rgba(180,120,255,0.9)" : "rgba(160,140,210,0.45)", letterSpacing: "0.06em" }}>{day}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, margin: "2px 0 0", color: isToday ? "rgba(200,160,255,0.95)" : "rgba(210,200,240,0.8)" }}>{d.getDate()}</p>
                  </div>
                );
              })}

              {/* Linhas de hora */}
              {HOURS.map((hour) => (
                <>
                  <div key={`h-${hour}`} style={{
                    borderBottom: "1px solid rgba(120,80,255,0.06)",
                    padding: "8px 6px 8px 8px", textAlign: "right",
                    background: "rgba(10,6,24,0.6)",
                  }}>
                    <span style={{ fontSize: 11, color: "rgba(160,140,210,0.35)" }}>{hour}:00</span>
                  </div>
                  {DAYS.map((_, di) => {
                    const appts = apptsByDayHour(di, hour);
                    const d = addDays(weekStart, di);
                    return (
                      <div key={`${di}-${hour}`}
                        onClick={() => { setSelectedDate(`${toISO(d)}T${String(hour).padStart(2, "0")}:00`); setShowForm(true); }}
                        style={{
                          borderBottom: "1px solid rgba(120,80,255,0.06)",
                          borderLeft: "1px solid rgba(120,80,255,0.06)",
                          minHeight: 56, padding: 4,
                          display: "flex", flexDirection: "column", gap: 2,
                          cursor: "pointer", transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,80,255,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {appts.map((a) => {
                          const sc = STATUS_CARD[a.status];
                          return (
                            <motion.div key={a.id}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedAppt(a); }}
                              style={{
                                borderRadius: 8, padding: "4px 8px",
                                background: sc.bg, border: `1px solid ${sc.border}`,
                                cursor: "pointer",
                              }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: sc.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.patient_name}
                              </p>
                              <p style={{ fontSize: 10, color: "rgba(180,160,220,0.5)", margin: 0 }}>
                                {formatTime(a.scheduled_at)} · {a.duration_minutes}min
                                {a.is_telemedicine && <Video size={9} style={{ display: "inline", marginLeft: 4 }} />}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          {isLoading && (
            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(160,140,210,0.4)", marginTop: 12 }}>Carregando agenda...</p>
          )}
        </motion.div>
      </div>

      {/* Modal Novo Agendamento */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Agendamento">
        <AppointmentForm defaultDate={selectedDate.split("T")[0]} onSuccess={() => setShowForm(false)} />
      </Modal>

      {/* Modal Detalhe do Agendamento */}
      <Modal open={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Detalhes do Agendamento" size="sm">
        {selectedAppt && (() => {
          const sc = STATUS_CARD[selectedAppt.status];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Paciente */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: sc.bg, border: `1px solid ${sc.border}` }}>
                <Avatar name={selectedAppt.patient_name} size={40} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: sc.text, margin: 0 }}>{selectedAppt.patient_name}</p>
                  <p style={{ fontSize: 12, color: "rgba(180,160,220,0.5)", margin: "2px 0 0" }}>
                    {new Date(selectedAppt.scheduled_at).toLocaleString("pt-BR")} · {selectedAppt.duration_minutes}min
                    {selectedAppt.is_telemedicine && " · Teleconsulta"}
                  </p>
                </div>
              </div>

              {/* Status + timestamps */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(12,8,28,0.7)", border: "1px solid rgba(120,80,255,0.12)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,140,210,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Status</p>
                  <Badge {...STATUS_BADGE[selectedAppt.status]} />
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(12,8,28,0.7)", border: "1px solid rgba(120,80,255,0.12)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,140,210,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Modalidade</p>
                  <p style={{ fontSize: 13, color: "rgba(210,200,240,0.8)", margin: 0 }}>{selectedAppt.is_telemedicine ? "Teleconsulta" : "Presencial"}</p>
                </div>
                {selectedAppt.checkin_at && (
                  <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(60,180,100,0.08)", border: "1px solid rgba(80,200,120,0.2)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(100,200,140,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Check-in</p>
                    <p style={{ fontSize: 13, color: "rgba(120,230,160,0.9)", margin: 0, fontWeight: 600 }}>{formatTime(selectedAppt.checkin_at)}</p>
                  </div>
                )}
                {selectedAppt.checkout_at && (
                  <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(60,130,255,0.08)", border: "1px solid rgba(80,160,255,0.2)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(100,160,220,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Check-out</p>
                    <p style={{ fontSize: 13, color: "rgba(130,190,255,0.9)", margin: 0, fontWeight: 600 }}>{formatTime(selectedAppt.checkout_at)}</p>
                  </div>
                )}
              </div>

              {selectedAppt.notes && (
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(12,8,28,0.6)", border: "1px solid rgba(120,80,255,0.1)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,140,210,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Observações</p>
                  <p style={{ fontSize: 13, color: "rgba(200,185,235,0.75)", margin: 0 }}>{selectedAppt.notes}</p>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4, borderTop: "1px solid rgba(120,80,255,0.1)" }}>
                {isCheckinable(selectedAppt.status) && (
                  <Button size="sm" onClick={() => doAction(actions.checkin.mutate, selectedAppt.id)}>
                    <LogIn size={13} /> Check-in
                  </Button>
                )}
                {selectedAppt.status === "in_progress" && (
                  <Button size="sm" variant="secondary" onClick={() => doAction(actions.checkout.mutate, selectedAppt.id)}>
                    <LogOut size={13} /> Check-out
                  </Button>
                )}
                {!["finished", "canceled", "no_show"].includes(selectedAppt.status) && (
                  <>
                    <Button size="sm" variant="danger" onClick={() => doAction(actions.cancel.mutate, selectedAppt.id)}>
                      <X size={13} /> Cancelar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => doAction(actions.noShow.mutate, selectedAppt.id)}>
                      <UserMinus size={13} /> Falta
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </AppLayout>
  );
}
