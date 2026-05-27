import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, Shield, Trash2, Edit2, X, CheckCircle, Crown, Building2, Brain, ConciergeBell, User as UserIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { User } from "@/types";

/* ── Constantes ── */
const ROLES = [
  { value: "admin_master",      label: "Admin Master",    desc: "Controle total da plataforma",       icon: Crown,         color: "rgba(255,90,90,0.9)",    bg: "rgba(220,50,50,0.12)",   border: "rgba(220,50,50,0.28)" },
  { value: "clinic_admin",      label: "Admin Clínica",   desc: "Gestão operacional e financeira",    icon: Building2,     color: "rgba(180,120,255,0.9)", bg: "rgba(140,60,255,0.12)",  border: "rgba(140,60,255,0.28)" },
  { value: "neuropsychologist", label: "Neuropsicólogo",  desc: "Pacientes, laudos e testes",         icon: Brain,         color: "rgba(80,180,255,0.9)",  bg: "rgba(60,140,255,0.12)",  border: "rgba(60,140,255,0.28)" },
  { value: "receptionist",      label: "Recepção",        desc: "Agenda, check-in e cobranças",       icon: ConciergeBell, color: "rgba(80,210,140,0.9)",  bg: "rgba(50,180,100,0.12)",  border: "rgba(50,180,100,0.28)" },
  { value: "patient",           label: "Paciente",        desc: "Portal do paciente",                 icon: UserIcon,      color: "rgba(200,180,255,0.7)", bg: "rgba(120,100,200,0.08)", border: "rgba(120,100,200,0.2)" },
];

const ROLE_BADGE: Record<string, "default" | "danger" | "info" | "success" | "warning" | "muted"> = {
  admin_master:      "danger",
  clinic_admin:      "default",
  neuropsychologist: "info",
  receptionist:      "success",
  patient:           "muted",
};

const roleLabel = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

/* ── Hooks de dados ── */
function useUsers() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/auth/users/").then((r) => r.data.results ?? r.data),
  });
}

function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post("/auth/admin/register/", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      api.patch(`/auth/users/${id}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/auth/users/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

/* ── Formulário de usuário ── */
const inputBase: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(120,80,255,0.22)",
  background: "rgba(8,5,22,0.75)",
  color: "rgba(225,215,255,0.95)", fontSize: 13, outline: "none",
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

function SI({ style: s, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...s }}
      onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.18)"; }}
      onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

/* ── Role card selector ── */
function RoleSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Função (Role) *
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = value === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                border: active ? `1px solid ${r.border}` : "1px solid rgba(120,80,255,0.12)",
                background: active ? r.bg : "rgba(8,5,22,0.6)",
                transition: "all 0.18s",
                boxShadow: active ? `0 0 16px ${r.bg}` : "none",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,80,255,0.06)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,5,22,0.6)"; }}
            >
              {active && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${r.color}, transparent)`, borderRadius: "12px 12px 0 0" }} />
              )}
              <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? r.bg : "rgba(120,80,255,0.08)", border: active ? `1px solid ${r.border}` : "1px solid rgba(120,80,255,0.1)", transition: "all 0.18s" }}>
                <Icon size={15} style={{ color: active ? r.color : "rgba(160,130,220,0.5)" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: active ? r.color : "rgba(200,185,240,0.75)", margin: 0, whiteSpace: "nowrap" }}>{r.label}</p>
                <p style={{ fontSize: 10, color: active ? "rgba(200,185,240,0.55)" : "rgba(160,140,210,0.38)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface UserFormProps {
  editing?: User | null;
  onClose: () => void;
}

function UserForm({ editing, onClose }: UserFormProps) {
  const isEdit = !!editing;
  const create = useCreateUser();
  const update = useUpdateUser();

  const [form, setForm] = useState({
    username: editing?.username ?? "",
    email: editing?.email ?? "",
    first_name: editing?.first_name ?? "",
    last_name: editing?.last_name ?? "",
    phone: editing?.phone ?? "",
    role: editing?.role ?? "receptionist",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isEdit && form.password !== form.password_confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    try {
      if (isEdit) {
        const { password, password_confirm, ...rest } = form;
        void password; void password_confirm;
        await update.mutateAsync({ id: editing.id as number, data: rest });
      } else {
        await create.mutateAsync(form);
      }
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const first = data ? Object.values(data).flat()[0] : undefined;
      setError(first ?? "Erro ao salvar usuário.");
    }
  };

  const loading = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {success && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 11, background: "rgba(20,180,100,0.12)", border: "1px solid rgba(20,180,100,0.25)", color: "rgba(80,220,140,0.95)", fontSize: 13 }}>
          <CheckCircle size={15} /> Usuário {isEdit ? "atualizado" : "criado"} com sucesso!
        </motion.div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Primeiro Nome">
          <SI value={form.first_name} onChange={set("first_name")} placeholder="João" />
        </Field>
        <Field label="Sobrenome">
          <SI value={form.last_name} onChange={set("last_name")} placeholder="Silva" />
        </Field>
        <Field label="Usuário *">
          <SI value={form.username} onChange={set("username")} required placeholder="joao.silva" />
        </Field>
        <Field label="E-mail *">
          <SI type="email" value={form.email} onChange={set("email")} required placeholder="email@clinica.com" />
        </Field>
        <Field label="Telefone">
          <SI value={form.phone} onChange={set("phone")} placeholder="(00) 00000-0000" />
        </Field>
        {!isEdit && (
          <Field label="Senha *">
            <SI type="password" value={form.password} onChange={set("password")} required placeholder="Mínimo 8 caracteres" />
          </Field>
        )}
        {!isEdit && (
          <Field label="Confirmar Senha *" >
            <SI type="password" value={form.password_confirm} onChange={set("password_confirm")} required placeholder="Repita a senha" style={{ gridColumn: "1 / -1" } as React.CSSProperties} />
          </Field>
        )}
      </div>

      {/* Role selector visual */}
      <RoleSelector value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)", color: "rgba(255,110,110,0.95)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}

/* ── Página principal de Admin ── */
export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();

  // Guarda de rota — apenas admin_master
  if (currentUser?.role !== "admin_master") {
    return (
      <AppLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
          <Shield size={48} style={{ color: "rgba(220,50,50,0.6)" }} />
          <p style={{ fontSize: 18, fontWeight: 700, color: "rgba(230,220,255,0.9)" }}>Acesso Negado</p>
          <p style={{ fontSize: 14, color: "rgba(180,160,220,0.55)" }}>Somente Admin Master pode acessar esta área.</p>
        </div>
      </AppLayout>
    );
  }

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#dc2626,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(220,40,40,0.4)" }}>
                <Shield size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>Gerenciar Usuários</h2>
                <p style={{ fontSize: 12, color: "rgba(180,160,220,0.5)", margin: 0 }}>Área exclusiva Admin Master</p>
              </div>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <UserPlus size={15} /> Novo Usuário
          </Button>
        </div>

        {/* Cards de resumo por role */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {ROLES.map((role, i) => {
            const count = users.filter((u) => u.role === role.value).length;
            return (
              <motion.div
                key={role.value}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  borderRadius: 14, padding: "14px 16px",
                  background: "rgba(18,12,42,0.75)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p style={{ fontSize: 28, fontWeight: 800, color: "rgba(220,200,255,0.9)", margin: 0 }}>{count}</p>
                <p style={{ fontSize: 12, color: "rgba(180,160,220,0.55)", margin: "4px 0 0" }}>{role.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Busca */}
        <div style={{ position: "relative", maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,160,220,0.4)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, usuário ou e-mail..."
            style={{
              width: "100%", padding: "9px 13px 9px 36px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(225,215,255,0.95)", fontSize: 13, outline: "none",
            }}
          />
        </div>

        {/* Tabela de usuários */}
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(20,14,48,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Usuário", "E-mail", "Telefone", "Função", "Status", "Ações"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(180,160,220,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "rgba(180,160,220,0.4)" }}>
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "rgba(180,160,220,0.4)" }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={`${u.first_name} ${u.last_name}`.trim() || u.username} avatarUrl={u.avatar} size="sm" />
                      <div>
                        <p style={{ fontWeight: 600, color: "rgba(225,215,255,0.9)", margin: 0 }}>
                          {`${u.first_name} ${u.last_name}`.trim() || u.username}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(180,160,220,0.45)", margin: 0 }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(180,160,220,0.65)" }}>{u.email || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(180,160,220,0.65)" }}>{u.phone || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={roleLabel[u.role] ?? u.role} variant={ROLE_BADGE[u.role] ?? "muted"} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={u.is_active ? "Ativo" : "Inativo"} variant={u.is_active ? "success" : "muted"} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <ActionBtn
                        icon={<Edit2 size={12} />} label="Editar"
                        color="rgba(180,120,255,1)" bg="rgba(140,60,255,0.12)" hoverBg="rgba(140,60,255,0.22)" border="rgba(140,60,255,0.28)"
                        onClick={() => { setEditing(u); setShowForm(true); }}
                      />
                      {u.id !== currentUser?.id && (
                        <ActionBtn
                          icon={<Trash2 size={12} />} label="Remover"
                          color="rgba(255,100,100,0.9)" bg="rgba(220,50,50,0.08)" hoverBg="rgba(220,50,50,0.18)" border="rgba(220,50,50,0.22)"
                          onClick={() => setConfirmDelete(u)}
                        />
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal criar/editar usuário */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(4,2,14,0.75)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: "relative", width: "100%", maxWidth: 600, borderRadius: 20, overflow: "hidden", background: "rgb(14,10,32)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 32px 80px rgba(0,0,0,0.75)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg,rgba(60,20,100,0.3),rgba(20,10,45,0.3))" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "rgba(230,220,255,0.95)", margin: 0 }}>
                  {editing ? "Editar Usuário" : "Novo Usuário"}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(180,160,220,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <UserForm editing={editing} onClose={() => setShowForm(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────── */}

      {/* Modal confirmar exclusão */}
      <AnimatePresence>
        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(4,2,14,0.8)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: "relative", width: "100%", maxWidth: 400, borderRadius: 18, background: "rgb(14,10,32)", border: "1px solid rgba(220,50,50,0.25)", padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}
            >
              <Trash2 size={32} style={{ color: "rgba(255,90,90,0.8)", marginBottom: 12 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(230,220,255,0.95)", margin: "0 0 8px" }}>Remover usuário?</p>
              <p style={{ fontSize: 13, color: "rgba(180,160,220,0.6)", margin: "0 0 20px" }}>
                <strong style={{ color: "rgba(220,200,255,0.85)" }}>{confirmDelete.username}</strong> será removido permanentemente.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                <Button
                  variant="danger"
                  loading={deleteUser.isPending}
                  onClick={() => {
                    deleteUser.mutate(confirmDelete.id as number, { onSuccess: () => setConfirmDelete(null) });
                  }}
                >
                  Remover
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

/* ── Botão de ação (mesmo padrão de PatientsPage) ── */
function ActionBtn({ icon, label, color, bg, hoverBg, border, onClick }: {
  icon: React.ReactNode; label: string;
  color: string; bg: string; hoverBg: string; border: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 11px", borderRadius: 8,
        border: `1px solid ${border}`, background: bg, color,
        fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        transition: "background 0.15s, box-shadow 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${border}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = bg;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {icon}{label}
    </button>
  );
}
