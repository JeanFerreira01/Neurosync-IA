import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, FileText, FlaskConical, ChevronDown,
  CheckCircle2, Circle, Sparkles, Package, AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useCreateReport } from "@/hooks/useReports";
import { usePatients } from "@/hooks/usePatients";
import { useScales } from "@/hooks/useNeurotests";
import type { Report, NeurotestScale } from "@/types";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intelligence: { label: "Inteligência e Cognição",        color: "rgba(130,100,255,1)",  bg: "rgba(130,100,255,0.08)" },
  memory:       { label: "Memória e Aprendizagem",         color: "rgba(80,180,255,1)",   bg: "rgba(80,180,255,0.08)"  },
  attention:    { label: "Atenção e Funções Executivas",   color: "rgba(255,160,50,1)",   bg: "rgba(255,160,50,0.08)"  },
  development:  { label: "Desenvolvimento / TDAH",         color: "rgba(80,220,150,1)",   bg: "rgba(80,220,150,0.08)"  },
  autism:       { label: "TEA / Neurodesenvolvimento",     color: "rgba(255,100,180,1)",  bg: "rgba(255,100,180,0.08)" },
  personality:  { label: "Personalidade e Projetivos",     color: "rgba(255,200,60,1)",   bg: "rgba(255,200,60,0.08)"  },
  neuropsych:   { label: "Avaliação Neuropsicológica",     color: "rgba(110,220,255,1)",  bg: "rgba(110,220,255,0.08)" },
  other:        { label: "Outro",                          color: "rgba(160,150,210,0.8)",bg: "rgba(130,120,200,0.09)" },
};
const CATEGORY_ORDER = ["intelligence","memory","attention","development","autism","personality","neuropsych","other"];

const DEFAULT_SECTIONS = [
  { title: "Identificação e Motivo da Avaliação", content: "" },
  { title: "Histórico Clínico e Desenvolvimento", content: "" },
  { title: "Procedimentos e Instrumentos Utilizados", content: "" },
  { title: "Resultados e Análise", content: "" },
  { title: "Conclusão e Hipótese Diagnóstica", content: "" },
  { title: "Recomendações", content: "" },
];

function StockDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok:        "rgba(80,220,140,0.95)",
    low:       "rgba(255,200,60,0.95)",
    zero:      "rgba(255,100,100,0.95)",
    untracked: "rgba(120,100,160,0.35)",
  };
  const titles: Record<string, string> = {
    ok:        "Estoque disponível",
    low:       "Estoque baixo",
    zero:      "Sem estoque",
    untracked: "Sem material cadastrado",
  };
  return (
    <span
      title={titles[status] ?? ""}
      style={{
        display: "inline-block", width: 7, height: 7, borderRadius: "50%",
        background: colors[status] ?? colors.untracked,
        flexShrink: 0, marginLeft: 4,
      }}
    />
  );
}

interface Props {
  onBack: () => void;
  onCreated: (report: Report) => void;
}

export default function NewReportPage({ onBack, onCreated }: Props) {
  const [form, setForm] = useState({ patient: "", title: "" });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [patientDropOpen, setPatientDropOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [error, setError] = useState("");

  const patientDropRef = useRef<HTMLDivElement>(null);
  const createReport = useCreateReport();
  const { data: patientsData } = usePatients({ is_active: true });
  const patients = patientsData?.results ?? [];
  const { data: scales = [], isLoading: scalesLoading } = useScales();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientDropRef.current && !patientDropRef.current.contains(e.target as Node))
        setPatientDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group active scales by category
  const grouped = useMemo(() => {
    const map: Record<string, NeurotestScale[]> = {};
    for (const s of scales) {
      if (!s.is_active) continue;
      const cat = s.category || "other";
      (map[cat] ??= []).push(s);
    }
    return CATEGORY_ORDER
      .filter((k) => map[k]?.length)
      .map((k) => ({ key: k, ...CATEGORY_CONFIG[k], scales: map[k] }));
  }, [scales]);

  const scaleKey = (s: NeurotestScale) => s.abbreviation || s.name;

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase())
  );
  const selectedPatient = patients.find((p) => p.id === form.patient);

  const toggleTest = (key: string) =>
    setSelectedTests((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);

  const toggleCategory = (keys: string[]) => {
    const allSelected = keys.every((t) => selectedTests.includes(t));
    if (allSelected) setSelectedTests((prev) => prev.filter((t) => !keys.includes(t)));
    else setSelectedTests((prev) => [...new Set([...prev, ...keys])]);
  };

  // Stock warnings for selected tests
  const selectedScales = useMemo(
    () => scales.filter((s) => selectedTests.includes(scaleKey(s))),
    [scales, selectedTests]
  );
  const zeroStock = selectedScales.filter((s) => s.stock_info.status === "zero").length;
  const lowStock  = selectedScales.filter((s) => s.stock_info.status === "low").length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.patient || !form.title.trim()) {
      setError("Preencha o paciente e o título do laudo.");
      return;
    }

    const sections = DEFAULT_SECTIONS.map((s) => {
      if (s.title === "Procedimentos e Instrumentos Utilizados" && selectedTests.length > 0) {
        return { ...s, content: `Instrumentos utilizados nesta avaliação:\n\n${selectedTests.map((t) => `• ${t}`).join("\n")}` };
      }
      return s;
    });

    try {
      const report = await createReport.mutateAsync({
        patient: form.patient,
        title: form.title,
        sections,
        selected_tests: selectedTests,
        status: "draft",
      } as Parameters<typeof createReport.mutateAsync>[0]);
      onCreated(report);
    } catch {
      setError("Erro ao criar laudo. Tente novamente.");
    }
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid rgba(120,80,255,0.12)",
          background: "rgba(10,7,24,0.98)",
          backdropFilter: "blur(12px)",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onBack}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.2)", background: "rgba(120,80,255,0.08)", color: "rgba(190,160,255,0.8)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,80,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(120,80,255,0.08)")}>
              <ArrowLeft size={14} /> Laudos
            </button>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "rgba(230,220,255,0.95)", margin: 0 }}>Novo Laudo</p>
              <p style={{ fontSize: 11, color: "rgba(180,160,220,0.4)", margin: "2px 0 0" }}>Preencha as informações e selecione os testes</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* Painel esquerdo */}
          <div style={{ width: 380, flexShrink: 0, borderRight: "1px solid rgba(120,80,255,0.1)", background: "rgba(8,5,20,0.95)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <form onSubmit={handleCreate} style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,rgba(140,60,255,0.3),rgba(80,40,200,0.2))", border: "1px solid rgba(160,80,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} style={{ color: "rgba(180,120,255,0.9)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(220,210,255,0.9)", margin: 0 }}>Informações do Laudo</p>
                  <p style={{ fontSize: 12, color: "rgba(160,140,210,0.45)", margin: "2px 0 0" }}>Paciente e título são obrigatórios</p>
                </div>
              </div>

              {/* Paciente */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.6)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5 }}>
                  <User size={11} /> Paciente *
                </label>
                <div ref={patientDropRef} style={{ position: "relative" }}>
                  <button type="button" onClick={() => setPatientDropOpen((o) => !o)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, border: `1px solid ${patientDropOpen ? "rgba(160,80,255,0.7)" : "rgba(120,80,255,0.22)"}`, background: "rgba(8,5,22,0.8)", color: selectedPatient ? "rgba(225,215,255,0.95)" : "rgba(140,120,200,0.4)", fontSize: 13, cursor: "pointer", boxShadow: patientDropOpen ? "0 0 0 3px rgba(120,50,220,0.15)" : "none", transition: "all 0.15s", outline: "none" }}>
                    {selectedPatient ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={selectedPatient.full_name} size={22} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedPatient.full_name}</span>
                      </div>
                    ) : <span>Selecionar paciente</span>}
                    <ChevronDown size={14} style={{ flexShrink: 0, transform: patientDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "rgba(160,130,220,0.5)" }} />
                  </button>
                  <AnimatePresence>
                    {patientDropOpen && (
                      <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }}
                        style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 999, borderRadius: 14, border: "1px solid rgba(120,80,255,0.28)", background: "rgba(12,8,30,0.99)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", overflow: "hidden" }}>
                        <div style={{ padding: "8px 8px 4px" }}>
                          <input autoFocus placeholder="Buscar paciente..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.2)", background: "rgba(8,5,22,0.8)", color: "rgba(220,210,255,0.9)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                          {filteredPatients.length === 0 ? (
                            <p style={{ padding: "14px 12px", fontSize: 12, color: "rgba(160,140,210,0.4)", margin: 0 }}>Nenhum paciente encontrado.</p>
                          ) : filteredPatients.map((p) => (
                            <button key={p.id} type="button"
                              onClick={() => { setForm((f) => ({ ...f, patient: p.id })); setPatientDropOpen(false); setPatientSearch(""); }}
                              style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: form.patient === p.id ? "rgba(140,60,255,0.18)" : "transparent", border: "none", color: form.patient === p.id ? "rgba(210,175,255,0.95)" : "rgba(200,185,240,0.75)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.1s" }}
                              onMouseEnter={(e) => { if (form.patient !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,80,255,0.1)"; }}
                              onMouseLeave={(e) => { if (form.patient !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              <Avatar name={p.full_name} size={26} />
                              <span style={{ fontWeight: 500 }}>{p.full_name}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Título */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.6)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Título do Laudo *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Avaliação Neuropsicológica Completa"
                  style={{ padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(120,80,255,0.22)", background: "rgba(8,5,22,0.8)", color: "rgba(225,215,255,0.95)", fontSize: 13, outline: "none", transition: "all 0.15s" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(120,50,220,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>

              {/* Resumo de testes selecionados */}
              <AnimatePresence>
                {selectedTests.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(140,60,255,0.22)", background: "rgba(120,60,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FlaskConical size={13} style={{ color: "rgba(180,120,255,0.8)" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,165,255,0.9)" }}>
                          {selectedTests.length} teste{selectedTests.length > 1 ? "s" : ""} selecionado{selectedTests.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <button type="button" onClick={() => setSelectedTests([])}
                        style={{ fontSize: 11, color: "rgba(180,140,255,0.55)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        Limpar
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {selectedTests.map((t) => (
                        <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(140,60,255,0.18)", border: "1px solid rgba(160,80,255,0.2)", color: "rgba(200,165,255,0.85)" }}>{t}</span>
                      ))}
                    </div>

                    {/* Alertas de estoque */}
                    {(zeroStock > 0 || lowStock > 0) && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                        {zeroStock > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)" }}>
                            <Package size={12} style={{ color: "rgba(255,100,100,0.9)", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "rgba(255,130,130,0.9)", fontWeight: 600 }}>
                              {zeroStock} material(is) sem estoque — será consumido mesmo assim
                            </span>
                          </div>
                        )}
                        {lowStock > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, background: "rgba(240,180,30,0.08)", border: "1px solid rgba(240,180,30,0.22)" }}>
                            <AlertTriangle size={12} style={{ color: "rgba(255,210,80,0.9)", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "rgba(255,210,80,0.9)", fontWeight: 600 }}>
                              {lowStock} material(is) com estoque baixo
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ flex: 1 }} />

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)", color: "rgba(255,120,120,0.9)", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" type="button" onClick={onBack} style={{ flex: 1 }}>Cancelar</Button>
                <Button type="submit" loading={createReport.isPending} style={{ flex: 2 }}>
                  <Sparkles size={14} /> Criar Laudo
                </Button>
              </div>
            </form>
          </div>

          {/* Painel direito — seleção de testes */}
          <div style={{ flex: 1, background: "rgba(10,7,22,0.9)", overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>

              <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "rgba(225,215,255,0.9)", margin: 0 }}>Testes a Aplicar</h3>
                  <p style={{ fontSize: 13, color: "rgba(160,140,210,0.45)", margin: "5px 0 0" }}>
                    Selecionar um teste abate automaticamente 1 unidade do estoque ao criar o laudo.
                  </p>
                </div>
                {/* Legenda de estoque */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
                  {[
                    { s: "ok",        label: "Normal",        color: "rgba(80,220,140,0.95)"  },
                    { s: "low",       label: "Baixo",         color: "rgba(255,200,60,0.95)"  },
                    { s: "zero",      label: "Zerado",        color: "rgba(255,100,100,0.95)" },
                    { s: "untracked", label: "Sem material",  color: "rgba(120,100,160,0.35)" },
                  ].map(({ s, label, color }) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: 10, color: "rgba(160,140,200,0.5)", fontWeight: 600 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {scalesLoading && (
                <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Carregando testes...</p>
              )}

              {!scalesLoading && grouped.length === 0 && (
                <div style={{ textAlign: "center", padding: "56px 16px" }}>
                  <FlaskConical size={36} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
                  <p style={{ color: "rgba(160,140,210,0.5)", fontSize: 14, margin: 0, fontWeight: 600 }}>
                    Nenhuma escala cadastrada
                  </p>
                  <p style={{ color: "rgba(130,110,180,0.35)", fontSize: 12, margin: "6px 0 0" }}>
                    Cadastre as escalas neuropsicológicas em <strong style={{ color: "rgba(160,130,210,0.5)" }}>Neurotestes</strong> para selecioná-las aqui.
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {grouped.map((cat) => {
                  const catKeys = cat.scales.map(scaleKey);
                  const allChecked = catKeys.every((k) => selectedTests.includes(k));
                  const someChecked = catKeys.some((k) => selectedTests.includes(k)) && !allChecked;

                  return (
                    <motion.div key={cat.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ borderRadius: 16, border: `1px solid ${someChecked || allChecked ? cat.color.replace(/[\d.]+\)$/, "0.25)") : "rgba(120,80,255,0.1)"}`, background: someChecked || allChecked ? cat.bg : "rgba(12,8,26,0.7)", overflow: "hidden", transition: "border-color 0.2s, background 0.2s" }}>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid rgba(120,80,255,0.08)", background: "rgba(0,0,0,0.15)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: allChecked || someChecked ? cat.color : "rgba(170,150,220,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", transition: "color 0.2s" }}>
                          {cat.label}
                          <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 6, opacity: 0.6 }}>({cat.scales.length})</span>
                        </span>
                        <button type="button" onClick={() => toggleCategory(catKeys)}
                          style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, border: `1px solid ${allChecked ? cat.color.replace(/[\d.]+\)$/, "0.4)") : "rgba(120,80,255,0.2)"}`, background: allChecked ? cat.bg : "transparent", color: allChecked ? cat.color : "rgba(160,140,210,0.5)", cursor: "pointer", transition: "all 0.15s" }}>
                          {allChecked ? "Desmarcar todos" : "Selecionar todos"}
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 0 }}>
                        {cat.scales.map((scale, idx) => {
                          const key = scaleKey(scale);
                          const checked = selectedTests.includes(key);
                          const stockStatus = scale.stock_info.status;
                          const isZero = stockStatus === "zero";

                          return (
                            <button key={scale.id} type="button" onClick={() => toggleTest(key)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: checked ? cat.bg : "transparent", border: "none", borderTop: idx >= 0 ? "1px solid rgba(120,80,255,0.06)" : "none", cursor: "pointer", textAlign: "left", transition: "background 0.12s", opacity: isZero && !checked ? 0.75 : 1 }}
                              onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,80,255,0.06)"; }}
                              onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              {checked
                                ? <CheckCircle2 size={16} style={{ color: cat.color, flexShrink: 0 }} />
                                : <Circle size={16} style={{ color: "rgba(120,80,255,0.25)", flexShrink: 0 }} />
                              }
                              <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? cat.color.replace(/[\d.]+\)$/, "0.9)") : "rgba(185,170,225,0.6)", transition: "color 0.12s", flex: 1 }}>
                                {key}
                                {scale.name !== key && (
                                  <span style={{ fontSize: 10, color: "rgba(140,120,190,0.4)", marginLeft: 5 }}>{scale.name}</span>
                                )}
                              </span>
                              <StockDot status={stockStatus} />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
