import { useState, useRef, useEffect } from "react";
import { ChevronDown, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { User } from "@/types";

interface AppointmentFormProps {
  defaultDate?: string;
  onSuccess: () => void;
}

/* ── Estilos base ── */
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(120,80,255,0.22)",
  background: "rgba(8,5,22,0.75)",
  color: "rgba(225,215,255,0.95)",
  fontSize: 13,
  outline: "none",
  transition: "border 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FocusInput({ style: s, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{ ...inputBase, ...s }}
      onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.18)"; }}
      onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
      {...props}
    />
  );
}

/* ── Dropdown escuro ── */
function DarkSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputBase,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", textAlign: "left", padding: "10px 12px",
          border: open ? "1px solid rgba(160,80,255,0.7)" : "1px solid rgba(120,80,255,0.22)",
          boxShadow: open ? "0 0 0 3px rgba(120,50,220,0.18)" : "none",
        }}
      >
        <span style={{ color: selected ? "rgba(225,215,255,0.95)" : "rgba(160,140,210,0.4)", fontSize: 13 }}>
          {selected ? selected.label : (placeholder ?? "Selecionar")}
        </span>
        <ChevronDown size={14} style={{ color: "rgba(160,120,255,0.6)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 600,
          borderRadius: 12, background: "rgba(10,6,26,0.99)",
          border: "1px solid rgba(130,70,255,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          overflow: "hidden", maxHeight: 220, overflowY: "auto",
        }}>
          {placeholder && (
            <div onClick={() => { onChange(""); setOpen(false); }}
              style={{ padding: "9px 14px", fontSize: 12, color: "rgba(160,140,210,0.4)", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {placeholder}
            </div>
          )}
          {options.map((opt) => (
            <div key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: "10px 14px", fontSize: 13, cursor: "pointer",
                color: opt.value === value ? "rgba(210,160,255,1)" : "rgba(210,200,240,0.85)",
                background: opt.value === value ? "rgba(130,60,255,0.18)" : "transparent",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (opt.value !== value) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = opt.value === value ? "rgba(130,60,255,0.18)" : "transparent"; }}
            >
              {opt.value === value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(180,100,255,0.9)", flexShrink: 0 }} />}
              <span style={{ marginLeft: opt.value === value ? 0 : 14 }}>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DURATIONS = [
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h 30min" },
  { value: "120", label: "2 horas" },
];

export function AppointmentForm({ defaultDate, onSuccess }: AppointmentFormProps) {
  const create = useCreateAppointment();
  const currentUser = useAuthStore((s) => s.user);
  const { data: patientsData } = usePatients({ is_active: true });
  const patients = patientsData?.results ?? [];

  const [professionals, setProfessionals] = useState<User[]>([]);
  const [error, setError] = useState("");

  // data/hora padrão: agora + 1h arredondado para próxima hora
  const defaultDateTime = (() => {
    if (defaultDate) return `${defaultDate}T08:00`;
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  })();

  const [form, setForm] = useState({
    patient: "",
    professional: currentUser ? String(currentUser.id) : "",
    scheduled_at: defaultDateTime,
    duration_minutes: "60",
    notes: "",
    is_telemedicine: false,
  });

  useEffect(() => {
    api.get<{ results: User[] }>("/auth/users/").then((r) => {
      const profs = r.data.results.filter((u) =>
        ["neuropsychologist", "clinic_admin", "admin_master"].includes(u.role)
      );
      setProfessionals(profs);
    }).catch(() => {
      // se falhar, profissional será o usuário logado (backend default)
    });
  }, []);

  const professionalOptions = professionals.map((u) => ({
    value: String(u.id),
    label: `${u.first_name || u.username}${u.last_name ? ` ${u.last_name}` : ""}`,
  }));

  // Adiciona o próprio usuário se não vier na lista
  if (currentUser && !professionalOptions.find((o) => o.value === String(currentUser.id))) {
    professionalOptions.unshift({
      value: String(currentUser.id),
      label: `${currentUser.first_name || currentUser.username}${currentUser.last_name ? ` ${currentUser.last_name}` : ""}`,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.patient) { setError("Selecione um paciente."); return; }
    if (!form.scheduled_at) { setError("Informe a data e hora."); return; }

    const payload: Record<string, unknown> = {
      patient: form.patient,
      scheduled_at: form.scheduled_at,
      duration_minutes: Number(form.duration_minutes),
      is_telemedicine: form.is_telemedicine,
      notes: form.notes,
    };
    if (form.professional) payload.professional = form.professional;

    try {
      await create.mutateAsync(payload as never);
      onSuccess();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(" ");
        setError(msgs || "Erro ao criar agendamento.");
      } else {
        setError("Erro de conexão. Tente novamente.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <Field label="Paciente *">
        <DarkSelect
          value={form.patient}
          onChange={(v) => setForm((f) => ({ ...f, patient: v }))}
          placeholder="Selecionar paciente"
          options={patients.map((p) => ({ value: p.id, label: p.full_name }))}
        />
      </Field>

      {professionalOptions.length > 1 && (
        <Field label="Profissional">
          <DarkSelect
            value={form.professional}
            onChange={(v) => setForm((f) => ({ ...f, professional: v }))}
            placeholder="Selecionar profissional"
            options={professionalOptions}
          />
        </Field>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Data e hora *">
          <FocusInput
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
            required
            style={{ colorScheme: "dark" }}
          />
        </Field>

        <Field label="Duração">
          <DarkSelect
            value={form.duration_minutes}
            onChange={(v) => setForm((f) => ({ ...f, duration_minutes: v }))}
            options={DURATIONS}
          />
        </Field>
      </div>

      <Field label="Observações">
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Motivo, observações..."
          style={{ ...inputBase, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
          onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.18)"; }}
          onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </Field>

      {/* Teleconsulta toggle */}
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, is_telemedicine: !f.is_telemedicine }))}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 12, cursor: "pointer",
          border: form.is_telemedicine ? "1px solid rgba(80,160,255,0.4)" : "1px solid rgba(120,80,255,0.15)",
          background: form.is_telemedicine ? "rgba(60,120,255,0.1)" : "rgba(8,5,22,0.5)",
          transition: "all 0.2s",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 20, borderRadius: 10, position: "relative",
          background: form.is_telemedicine ? "rgba(80,160,255,0.8)" : "rgba(80,60,120,0.4)",
          transition: "background 0.2s", flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
            background: "#fff",
            left: form.is_telemedicine ? 18 : 2,
            transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Video size={14} style={{ color: form.is_telemedicine ? "rgba(100,180,255,0.9)" : "rgba(160,140,210,0.5)" }} />
          <span style={{ fontSize: 13, color: form.is_telemedicine ? "rgba(150,200,255,0.9)" : "rgba(180,160,220,0.6)", fontWeight: 500 }}>
            Teleconsulta
          </span>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: form.is_telemedicine ? "rgba(100,180,255,0.7)" : "rgba(150,130,200,0.35)", fontWeight: 600 }}>
          {form.is_telemedicine ? "ATIVO" : "INATIVO"}
        </span>
      </button>

      {/* Resumo */}
      {form.patient && form.scheduled_at && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(120,60,255,0.08)",
          border: "1px solid rgba(120,60,255,0.18)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Clock size={13} style={{ color: "rgba(180,120,255,0.7)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "rgba(200,180,255,0.7)" }}>
            {new Date(form.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            {" — "}
            {DURATIONS.find((d) => d.value === form.duration_minutes)?.label}
            {form.is_telemedicine ? " · Teleconsulta" : ""}
          </span>
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.3)",
          color: "rgba(255,120,120,0.95)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
        <Button type="submit" loading={create.isPending}>Agendar</Button>
      </div>
    </form>
  );
}
