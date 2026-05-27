import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePlus, FileText, Search, Eye, Trash2, PenLine, CheckCircle, Clock, FileEdit } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useReports, useDeleteReport } from "@/hooks/useReports";
import { useAuthStore } from "@/store/authStore";
import ReportEditor from "./ReportEditor";
import NewReportPage from "./NewReportPage";
import type { Report } from "@/types";

const STATUS_CONFIG = {
  draft:  { label: "Rascunho",   variant: "warning" as const, icon: FileEdit },
  review: { label: "Em Revisão", variant: "info"    as const, icon: Clock },
  signed: { label: "Assinado",   variant: "success" as const, icon: CheckCircle },
};


export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const user = useAuthStore((s) => s.user);
  const { data: reports = [], isLoading } = useReports();
  const deleteReport = useDeleteReport();

  const filtered = reports.filter((r) =>
    `${r.patient_name} ${r.title} ${r.professional_name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (showNewForm) {
    return (
      <NewReportPage
        onBack={() => setShowNewForm(false)}
        onCreated={(report) => { setShowNewForm(false); setEditingReport(report); setShowEditor(true); }}
      />
    );
  }

  if (showEditor && editingReport) {
    return (
      <ReportEditor
        report={editingReport}
        onBack={() => { setShowEditor(false); setEditingReport(null); }}
      />
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>Laudos</h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>
              {reports.length} laudo(s) registrado(s)
            </p>
          </div>
          <Button onClick={() => setShowNewForm(true)}>
            <FilePlus size={15} /> Novo Laudo
          </Button>
        </motion.div>

        {/* Busca */}
        <div style={{ position: "relative", maxWidth: 380 }}>
          <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(160,140,210,0.45)", pointerEvents: "none" }} />
          <input
            placeholder="Buscar por paciente, título ou profissional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: "1px solid rgba(120,80,255,0.22)", background: "rgba(8,5,22,0.75)", color: "rgba(225,215,255,0.9)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.15)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Lista */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.8)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(120,80,255,0.12)", background: "rgba(20,12,44,0.9)" }}>
                {["Paciente", "Título", "Profissional", "Status", "Versão", "Data", "Ações"].map((h) => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(160,130,220,0.55)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "rgba(160,140,210,0.4)" }}>Carregando...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                  <FileText size={36} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
                  <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>
                    {search ? "Nenhum laudo encontrado." : "Nenhum laudo criado ainda."}
                  </p>
                </td></tr>
              )}
              <AnimatePresence>
                {filtered.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,60,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={r.patient_name} size={32} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(225,215,255,0.9)" }}>{r.patient_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(210,195,255,0.85)", margin: 0 }}>{r.title}</p>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.65)" }}>{r.professional_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusIcon size={12} style={{ color: cfg.variant === "success" ? "rgba(80,210,130,0.9)" : cfg.variant === "warning" ? "rgba(250,200,60,0.9)" : "rgba(80,170,255,0.9)" }} />
                          <Badge label={cfg.label} variant={cfg.variant} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.55)", fontFamily: "monospace" }}>v{r.version}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(180,160,220,0.5)" }}>
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <ActionBtn icon={<Eye size={12} />} label="Abrir" color="rgba(130,180,255,0.9)" bg="rgba(60,120,255,0.1)" hoverBg="rgba(60,120,255,0.2)" border="rgba(60,120,255,0.25)" onClick={() => { setEditingReport(r); setShowEditor(true); }} />
                          {r.status !== "signed" && (
                            <ActionBtn icon={<PenLine size={12} />} label="Editar" color="rgba(180,120,255,1)" bg="rgba(140,60,255,0.12)" hoverBg="rgba(140,60,255,0.22)" border="rgba(140,60,255,0.28)" onClick={() => { setEditingReport(r); setShowEditor(true); }} />
                          )}
                          <ActionBtn icon={<Trash2 size={12} />} label="" color="rgba(255,100,100,0.9)" bg="rgba(220,50,50,0.08)" hoverBg="rgba(220,50,50,0.18)" border="rgba(220,50,50,0.22)" onClick={() => setDeleteTarget(r)} />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Modal: confirmar exclusão */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Laudo" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir o laudo <strong style={{ color: "rgba(235,225,255,0.95)" }}>"{deleteTarget?.title}"</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteReport.isPending}
              onClick={() => deleteReport.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function ActionBtn({ icon, label, color, bg, hoverBg, border, onClick }: {
  icon: React.ReactNode; label: string; color: string; bg: string; hoverBg: string; border: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: label ? 5 : 0, padding: label ? "5px 11px" : "5px 8px", borderRadius: 8, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s, transform 0.1s, box-shadow 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${border}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
      {icon}{label}
    </button>
  );
}
