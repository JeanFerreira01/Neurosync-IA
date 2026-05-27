import { useState, useRef, useEffect } from "react";
import { Search, Loader2, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreatePatient, useUpdatePatient } from "@/hooks/usePatients";
import { formatCPF, validateCPF, formatCEP, fetchCEP, formatPhone } from "@/lib/validators";
import type { Patient } from "@/types";

const HEALTH_PLANS = [
  "Particular", "Unimed", "Bradesco Saúde", "Amil", "SulAmérica",
  "Porto Seguro Saúde", "NotreDame Intermédica", "Hapvida",
  "Plano Municipal / IPSEM", "Outro convênio",
];

interface PatientFormProps {
  patient?: Patient;
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

/* ── Label + erro ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: "rgba(255,100,100,0.9)", display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
          <XCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ── Separador de seção ── */
function Section({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px" }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(160,100,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(120,60,255,0.3), transparent)" }} />
    </div>
  );
}

/* ── Input com focus state ── */
function StyledInput({
  error, onFocus, onBlur, style: styleProp, readOnly, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      readOnly={readOnly}
      style={{
        ...inputBase,
        border: error ? "1px solid rgba(220,60,60,0.55)" : "1px solid rgba(120,80,255,0.22)",
        ...(readOnly ? { color: "rgba(200,185,240,0.5)", cursor: "default" } : {}),
        ...styleProp,
      }}
      onFocus={(e) => {
        if (!readOnly) {
          e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.18)";
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = error ? "1px solid rgba(220,60,60,0.55)" : "1px solid rgba(120,80,255,0.22)";
        e.currentTarget.style.boxShadow = "none";
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

/* ── Dropdown totalmente customizado ── */
interface SelectOption { value: string; label: string }

function DarkSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputBase,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          border: open ? "1px solid rgba(160,80,255,0.7)" : "1px solid rgba(120,80,255,0.22)",
          boxShadow: open ? "0 0 0 3px rgba(120,50,220,0.18)" : "none",
          padding: "10px 12px",
        }}
      >
        <span style={{ color: selected ? "rgba(225,215,255,0.95)" : "rgba(160,140,210,0.4)", fontSize: 13 }}>
          {selected ? selected.label : (placeholder ?? "Selecionar")}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "rgba(160,120,255,0.6)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          zIndex: 600,
          borderRadius: 12,
          background: "rgba(10,6,26,0.99)",
          border: "1px solid rgba(130,70,255,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
          overflow: "hidden",
          maxHeight: 240,
          overflowY: "auto",
        }}>
          {placeholder && (
            <div
              onClick={() => { onChange(""); setOpen(false); }}
              style={{
                padding: "9px 14px",
                fontSize: 12,
                color: "rgba(160,140,210,0.4)",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                cursor: "pointer",
                color: opt.value === value ? "rgba(210,160,255,1)" : "rgba(210,200,240,0.85)",
                background: opt.value === value ? "rgba(130,60,255,0.18)" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = opt.value === value ? "rgba(130,60,255,0.18)" : "transparent";
              }}
            >
              {opt.value === value && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(180,100,255,0.9)", flexShrink: 0 }} />
              )}
              <span style={{ marginLeft: opt.value === value ? 0 : 14 }}>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Formulário principal ── */
export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const isEdit = !!patient;
  const create = useCreatePatient();
  const update = useUpdatePatient(patient?.id ?? "");

  const [form, setForm] = useState({
    full_name: patient?.full_name ?? "",
    cpf: patient?.cpf ? formatCPF(patient.cpf) : "",
    date_of_birth: patient?.date_of_birth ?? "",
    gender: patient?.gender ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ? formatPhone(patient.phone) : "",
    health_insurance: patient?.health_insurance ?? "",
    cep: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    emergency_contact: "",
    emergency_phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cpfValid, setCpfValid] = useState<boolean | null>(
    patient?.cpf && patient.cpf.length >= 11 ? validateCPF(formatCPF(patient.cpf)) : null
  );

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCPF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatCPF(e.target.value);
    setForm((f) => ({ ...f, cpf: masked }));
    if (masked.length === 14) {
      const valid = validateCPF(masked);
      setCpfValid(valid);
      setErrors((prev) => ({ ...prev, cpf: valid ? "" : "CPF inválido" }));
    } else {
      setCpfValid(null);
      setErrors((prev) => ({ ...prev, cpf: "" }));
    }
  };

  const handlePhone = (field: "phone" | "emergency_phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: formatPhone(e.target.value) }));

  const handleCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatCEP(e.target.value);
    setForm((f) => ({ ...f, cep: masked }));
    if (masked.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      const data = await fetchCEP(masked);
      setCepLoading(false);
      if (data) {
        setForm((f) => ({ ...f, address: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
        setErrors((prev) => ({ ...prev, cep: "" }));
      } else {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }));
      }
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Nome obrigatório";
    if (form.cpf && form.cpf.length === 14 && !validateCPF(form.cpf)) e.cpf = "CPF inválido";
    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (dob > today) e.date_of_birth = "Data não pode ser no futuro";
      else if (age > 130) e.date_of_birth = "Data de nascimento inválida";
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      full_name: form.full_name,
      cpf: form.cpf.replace(/\D/g, ""),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      email: form.email,
      phone: form.phone,
      health_insurance: form.health_insurance,
      address: [form.address, form.neighborhood, form.city, form.state].filter(Boolean).join(", "),
      emergency_contact: form.emergency_contact,
      emergency_phone: form.emergency_phone,
      notes: form.notes,
    };

    try {
      if (isEdit) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      onSuccess();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const first = Object.values(data).flat()[0];
        setApiError(first ?? "Erro ao salvar paciente.");
      } else {
        setApiError("Erro de conexão. Tente novamente.");
      }
    }
  };

  const loading = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <Section title="Dados Pessoais" />

      {/* Nome */}
      <Field label="Nome completo *" error={errors.full_name}>
        <StyledInput
          value={form.full_name}
          onChange={set("full_name")}
          placeholder="Nome completo do paciente"
          error={errors.full_name}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* CPF */}
        <Field label="CPF" error={errors.cpf}>
          <div style={{ position: "relative" }}>
            <StyledInput
              value={form.cpf}
              onChange={handleCPF}
              placeholder="000.000.000-00"
              maxLength={14}
              error={errors.cpf}
              style={{ paddingRight: 38 }}
            />
            {cpfValid === true && (
              <CheckCircle size={15} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(80,210,130,0.9)", pointerEvents: "none" }} />
            )}
            {cpfValid === false && (
              <XCircle size={15} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,100,100,0.9)", pointerEvents: "none" }} />
            )}
          </div>
        </Field>

        {/* Data de Nascimento */}
        <Field label="Data de Nascimento" error={errors.date_of_birth}>
          <StyledInput
            type="date"
            value={form.date_of_birth}
            onChange={set("date_of_birth")}
            error={errors.date_of_birth}
            max={new Date().toISOString().split("T")[0]}
          />
        </Field>

        {/* Gênero */}
        <Field label="Gênero">
          <DarkSelect
            value={form.gender}
            onChange={(val) => setForm((f) => ({ ...f, gender: val }))}
            placeholder="Selecionar"
            options={[
              { value: "M", label: "Masculino" },
              { value: "F", label: "Feminino" },
              { value: "O", label: "Outro / Prefiro não informar" },
            ]}
          />
        </Field>

        {/* Plano de Saúde */}
        <Field label="Plano de Saúde">
          <DarkSelect
            value={form.health_insurance}
            onChange={(val) => setForm((f) => ({ ...f, health_insurance: val }))}
            placeholder="Selecionar plano"
            options={HEALTH_PLANS.map((p) => ({ value: p, label: p }))}
          />
        </Field>
      </div>

      <Section title="Contato" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="E-mail">
          <StyledInput type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" />
        </Field>
        <Field label="Telefone / WhatsApp">
          <StyledInput value={form.phone} onChange={handlePhone("phone")} placeholder="(00) 00000-0000" maxLength={15} />
        </Field>
      </div>

      <Section title="Endereço" />
      <div style={{ display: "grid", gridTemplateColumns: "148px 1fr", gap: 12 }}>
        <Field label="CEP" error={errors.cep}>
          <div style={{ position: "relative" }}>
            <StyledInput
              value={form.cep}
              onChange={handleCEP}
              placeholder="00000-000"
              maxLength={9}
              error={errors.cep}
              style={{ paddingRight: 36 }}
            />
            {cepLoading
              ? <Loader2 size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(160,100,255,0.8)", animation: "spin 0.7s linear infinite", pointerEvents: "none" }} />
              : <Search size={13} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(150,120,220,0.35)", pointerEvents: "none" }} />
            }
          </div>
        </Field>
        <Field label="Logradouro">
          <StyledInput value={form.address} onChange={set("address")} placeholder="Preenchido pelo CEP" />
        </Field>
        <Field label="Bairro">
          <StyledInput value={form.neighborhood} onChange={set("neighborhood")} placeholder="Bairro" />
        </Field>
        <Field label="Cidade / UF">
          <StyledInput
            value={`${form.city}${form.state ? ` / ${form.state}` : ""}`}
            readOnly
            placeholder="Cidade / Estado"
          />
        </Field>
      </div>

      <Section title="Contato de Emergência" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nome do responsável">
          <StyledInput value={form.emergency_contact} onChange={set("emergency_contact")} placeholder="Nome completo" />
        </Field>
        <Field label="Telefone do responsável">
          <StyledInput value={form.emergency_phone} onChange={handlePhone("emergency_phone")} placeholder="(00) 00000-0000" maxLength={15} />
        </Field>
      </div>

      <Section title="Observações" />
      <textarea
        value={form.notes}
        onChange={set("notes")}
        rows={3}
        placeholder="Informações adicionais relevantes..."
        style={{
          ...inputBase,
          resize: "vertical",
          lineHeight: 1.6,
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.18)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
      />

      {apiError && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(220,50,50,0.1)",
          border: "1px solid rgba(220,50,50,0.3)",
          color: "rgba(255,110,110,0.95)",
          fontSize: 13,
        }}>
          {apiError}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
        <Button type="submit" loading={loading}>
          {isEdit ? "Salvar alterações" : "Cadastrar paciente"}
        </Button>
      </div>
    </form>
  );
}
