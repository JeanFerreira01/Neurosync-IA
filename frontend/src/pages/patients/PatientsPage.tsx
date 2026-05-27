import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, Pencil, UserX, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PatientForm } from "./PatientForm";
import { usePatients, useDeactivatePatient } from "@/hooks/usePatients";
import type { Patient } from "@/types";

const genderLabel: Record<string, string> = { M: "Masculino", F: "Feminino", O: "Outro", "": "—" };

const COL_HEADERS = ["Paciente", "CPF", "Nascimento", "Telefone", "Convênio", "Status", "Ações"];

function formatCPFDisplay(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf || "—";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Patient | null>(null);

  const { data, isLoading } = usePatients({ search, is_active: true });
  const deactivate = useDeactivatePatient();

  const patients = data?.results ?? [];

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    await deactivate.mutateAsync(deactivateTarget.id);
    setDeactivateTarget(null);
  };

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0, letterSpacing: "-0.3px" }}>
              Pacientes
            </h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>
              {data?.count ?? 0} paciente(s) cadastrado(s)
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <UserPlus size={15} />
            Novo Paciente
          </Button>
        </motion.div>

        {/* Busca */}
        <div style={{ position: "relative", maxWidth: 380 }}>
          <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(160,140,210,0.45)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 38,
              paddingRight: 14,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 12,
              border: "1px solid rgba(120,80,255,0.22)",
              background: "rgba(8,5,22,0.75)",
              color: "rgba(225,215,255,0.9)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.15)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            borderRadius: 18,
            border: "1px solid rgba(120,80,255,0.15)",
            background: "rgba(12,8,28,0.8)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(120,80,255,0.12)", background: "rgba(20,12,44,0.9)" }}>
                {COL_HEADERS.map((h) => (
                  <th key={h} style={{
                    textAlign: "left",
                    padding: "13px 16px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(160,130,220,0.55)",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(160,140,210,0.4)", fontSize: 14 }}>
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && patients.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                    <Users size={32} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
                    <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>
                      {search ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}
                    </p>
                  </td>
                </tr>
              )}
              <AnimatePresence>
                {patients.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,60,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Paciente */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={p.full_name} size={32} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(225,215,255,0.92)", margin: 0 }}>{p.full_name}</p>
                          <p style={{ fontSize: 11, color: "rgba(160,140,210,0.45)", margin: "2px 0 0" }}>{genderLabel[p.gender]}</p>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.7)", fontFamily: "monospace" }}>
                      {formatCPFDisplay(p.cpf)}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.7)" }}>
                      {p.date_of_birth ? new Date(p.date_of_birth + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.7)" }}>
                      {p.phone || "—"}
                    </td>

                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.7)" }}>
                      {p.health_insurance || "—"}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={p.is_active ? "Ativo" : "Inativo"} variant={p.is_active ? "success" : "muted"} />
                    </td>

                    {/* Ações */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ActionButton
                          icon={<Pencil size={12} />}
                          label="Editar"
                          color="rgba(160,100,255,1)"
                          bg="rgba(130,60,255,0.12)"
                          hoverBg="rgba(130,60,255,0.22)"
                          border="rgba(130,60,255,0.25)"
                          onClick={() => { setEditing(p); setShowForm(true); }}
                        />
                        <ActionButton
                          icon={<UserX size={12} />}
                          label="Desativar"
                          color="rgba(255,100,100,0.9)"
                          bg="rgba(220,50,50,0.08)"
                          hoverBg="rgba(220,50,50,0.18)"
                          border="rgba(220,50,50,0.2)"
                          onClick={() => setDeactivateTarget(p)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Modal: criar / editar */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar Paciente" : "Novo Paciente"} size="lg">
        <PatientForm patient={editing ?? undefined} onSuccess={() => setShowForm(false)} />
      </Modal>

      {/* Modal: confirmar desativação */}
      <Modal open={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} title="Desativar Paciente" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Tem certeza que deseja desativar <strong style={{ color: "rgba(235,225,255,0.95)" }}>{deactivateTarget?.full_name}</strong>?
            O paciente não aparecerá mais nas listagens ativas.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => setDeactivateTarget(null)}
              style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(200,185,240,0.7)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Cancelar
            </button>
            <button
              onClick={handleDeactivate}
              disabled={deactivate.isPending}
              style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: "1px solid rgba(220,50,50,0.35)",
                background: "linear-gradient(135deg, rgba(180,30,30,0.8), rgba(120,20,20,0.8))",
                color: "rgba(255,160,160,0.95)",
                boxShadow: "0 4px 16px rgba(180,30,30,0.3)",
              }}
            >
              {deactivate.isPending ? "Desativando..." : "Sim, desativar"}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

/* ── Botão de ação premium ── */
function ActionButton({ icon, label, color, bg, hoverBg, border, onClick }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  hoverBg: string;
  border: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.15s, box-shadow 0.15s, transform 0.1s",
        whiteSpace: "nowrap",
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
      {icon}
      {label}
    </button>
  );
}
