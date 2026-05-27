import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, PenLine, CheckCircle, Sparkles, Loader2,
  FileText, History, Upload, BarChart2, FlaskConical, Brain,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useUpdateReport, useSignReport, useReportVersions, useAnalyzeScores } from "@/hooks/useReports";
import { reportsService } from "@/services/reports";
import { SCORE_CONFIGS, classifyIndexScore, classifyTScore, getIndexColor } from "./ScoreConfig";
import type { Report, ReportSection, ReportVersion } from "@/types";

const STATUS_CONFIG = {
  draft:  { label: "Rascunho",   variant: "warning" as const },
  review: { label: "Em Revisão", variant: "info"    as const },
  signed: { label: "Assinado",   variant: "success" as const },
};

const AI_INSTRUCTIONS = [
  { label: "Melhorar e expandir", value: "melhore e expanda este texto com mais detalhes clínicos relevantes" },
  { label: "Tornar mais formal",  value: "reescreva com linguagem mais técnica e formal para laudo clínico" },
  { label: "Resumir",            value: "resuma de forma concisa mantendo os pontos essenciais" },
  { label: "Sugerir conteúdo",   value: "sugira um conteúdo completo e profissional para esta seção" },
];

interface ReportEditorProps {
  report: Report;
  onBack: () => void;
}

export default function ReportEditor({ report: initialReport, onBack }: ReportEditorProps) {
  const [report, setReport] = useState<Report>(initialReport);
  const [sections, setSections] = useState<ReportSection[]>(initialReport.sections);
  const [activeSection, setActiveSection] = useState(0);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [signName, setSignName] = useState("");
  const [signNameError, setSignNameError] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState(AI_INSTRUCTIONS[0].value);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sideMode, setSideMode] = useState<"sections" | "scores" | "charts">("sections");
  const [testScores, setTestScores] = useState<Record<string, Record<string, string | number>>>(report.test_scores ?? {});
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateReport = useUpdateReport(report.id);
  const signReport = useSignReport();
  const analyzeScores = useAnalyzeScores();
  const { data: versions = [] } = useReportVersions(report.id);

  const selectedTests = report.selected_tests ?? [];

  const setScore = (test: string, key: string, val: string) => {
    setTestScores((prev) => ({ ...prev, [test]: { ...(prev[test] ?? {}), [key]: val } }));
  };

  const handleAnalyze = async () => {
    const hasScores = Object.values(testScores).some((s) => Object.values(s).some((v) => v !== ""));
    if (!hasScores) { setAnalyzeError("Preencha ao menos uma pontuação antes de gerar."); return; }
    setAnalyzeLoading(true);
    setAnalyzeError("");
    try {
      const updated = await analyzeScores.mutateAsync({ id: report.id, scores: testScores });
      setReport(updated);
      setSections(updated.sections);
      setSideMode("sections");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setAnalyzeError(msg || "Erro ao gerar análise.");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const updated = await reportsService.uploadAssessment(report.id, file);
      setReport(updated);
    } finally {
      setUploadLoading(false);
    }
  };

  // Dados para gráfico
  const chartData = (() => {
    const items: { name: string; value: number; color: string }[] = [];
    for (const [testName, scores] of Object.entries(testScores)) {
      for (const [key, val] of Object.entries(scores)) {
        const num = parseFloat(String(val));
        if (!isNaN(num) && num > 0) {
          items.push({ name: `${testName.substring(0, 8)}/${key.substring(0, 8)}`, value: num, color: getIndexColor(num) });
        }
      }
    }
    return items.slice(0, 14);
  })();

  const isReadOnly = report.status === "signed";

  const updateSection = (idx: number, content: string) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, content } : s));
    setUnsaved(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await updateReport.mutateAsync({ sections });
      setReport(updated);
      setUnsaved(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [sections, updateReport]);

  const handleSign = async () => {
    if (!signName.trim()) { setSignNameError("Digite seu nome completo para assinar."); return; }
    setSignNameError("");
    if (unsaved) await handleSave();
    const updated = await signReport.mutateAsync({ id: report.id, signed_by_name: signName.trim() });
    setReport(updated);
    setShowSignConfirm(false);
    setSignName("");
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await reportsService.downloadPdf(report.id, report.title);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const section = sections[activeSection];
      const result = await reportsService.aiAssist(report.id, {
        section_title: section.title,
        current_content: section.content,
        instruction: aiInstruction,
      });
      updateSection(activeSection, result.suggestion);
      setAiOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setAiError(msg || "Erro ao consultar IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const restoreVersion = (v: ReportVersion) => {
    setSections(v.sections_snapshot);
    setUnsaved(true);
    setShowVersions(false);
  };

  const cfg = STATUS_CONFIG[report.status];
  const current = sections[activeSection];
  const progress = Math.round((sections.filter((s) => s.content.trim()).length / sections.length) * 100);

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100vh" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(120,80,255,0.12)",
          background: "rgba(10,7,24,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 50,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.2)", background: "rgba(120,80,255,0.08)", color: "rgba(190,160,255,0.8)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,80,255,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(120,80,255,0.08)")}>
              <ArrowLeft size={14} /> Laudos
            </button>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "rgba(230,220,255,0.95)", margin: 0 }}>{report.title}</p>
              <p style={{ fontSize: 11, color: "rgba(180,160,220,0.45)", margin: "2px 0 0" }}>
                {report.patient_name} · v{report.version}
              </p>
            </div>
            <Badge label={cfg.label} variant={cfg.variant} />
            {unsaved && <span style={{ fontSize: 11, color: "rgba(250,200,60,0.8)", fontWeight: 600 }}>● Não salvo</span>}
            <AnimatePresence>
              {savedFlash && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 11, color: "rgba(80,210,130,0.9)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={11} /> Salvo
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Histórico */}
            <button onClick={() => setShowVersions(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "rgba(120,80,255,0.07)", color: "rgba(180,150,255,0.75)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              <History size={13} /> Histórico ({versions.length})
            </button>

            {/* PDF */}
            <button onClick={handlePdf} disabled={pdfLoading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(60,180,120,0.25)", background: "rgba(50,160,100,0.1)", color: "rgba(80,210,140,0.9)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {pdfLoading ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Download size={13} />}
              Exportar PDF
            </button>

            {/* Salvar */}
            {!isReadOnly && (
              <Button onClick={handleSave} loading={saving} variant="secondary">
                Salvar
              </Button>
            )}

            {/* Assinar */}
            {!isReadOnly && (
              <Button onClick={() => setShowSignConfirm(true)}>
                <PenLine size={14} /> Assinar Laudo
              </Button>
            )}
          </div>
        </div>

        {/* Banner de assinado */}
        {isReadOnly && report.signed_by_name && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 24px",
            background: "rgba(50,180,100,0.08)",
            borderBottom: "1px solid rgba(80,210,130,0.15)",
          }}>
            <CheckCircle size={14} style={{ color: "rgba(80,210,130,0.9)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "rgba(150,230,180,0.8)" }}>
              Assinado digitalmente por{" "}
              <strong style={{ color: "rgba(180,255,210,0.95)" }}>{report.signed_by_name}</strong>
              {report.signed_at && (
                <span style={{ color: "rgba(120,200,155,0.55)", fontWeight: 400 }}>
                  {" "}· {new Date(report.signed_at).toLocaleString("pt-BR")}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Barra de progresso */}
        <div style={{ height: 3, background: "rgba(120,80,255,0.1)" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: "100%", background: "linear-gradient(90deg, rgba(140,60,255,0.8), rgba(80,160,255,0.6))", borderRadius: "0 2px 2px 0" }}
          />
        </div>

        {/* Layout principal: sidebar de seções + editor */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Sidebar */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid rgba(120,80,255,0.1)", background: "rgba(8,5,20,0.9)", display: "flex", flexDirection: "column" }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(120,80,255,0.1)", flexShrink: 0 }}>
              {([
                { key: "sections", icon: <FileText size={12} />, label: "Seções" },
                { key: "scores",   icon: <FlaskConical size={12} />, label: "Pontuações" },
                { key: "charts",   icon: <BarChart2 size={12} />, label: "Gráficos" },
              ] as const).map((tab) => (
                <button key={tab.key} onClick={() => setSideMode(tab.key)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", border: "none", cursor: "pointer", background: sideMode === tab.key ? "rgba(120,60,255,0.15)" : "transparent", borderBottom: sideMode === tab.key ? "2px solid rgba(160,80,255,0.8)" : "2px solid transparent", color: sideMode === tab.key ? "rgba(200,160,255,0.95)" : "rgba(140,120,190,0.5)", fontSize: 10, fontWeight: 700, transition: "all 0.15s" }}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Seções */}
            {sideMode === "sections" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,130,220,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 16px 8px" }}>
                  {progress}% completo
                </p>
                {sections.map((s, i) => {
                  const filled = s.content.trim().length > 0;
                  const isActive = i === activeSection;
                  return (
                    <button key={i} onClick={() => setActiveSection(i)} style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: isActive ? "rgba(140,60,255,0.15)" : "transparent", borderLeft: isActive ? "3px solid rgba(160,80,255,0.8)" : "3px solid transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,80,255,0.07)"; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "rgba(210,175,255,0.95)" : "rgba(180,160,220,0.6)", lineHeight: 1.4 }}>{s.title}</span>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginLeft: 8, background: filled ? "rgba(80,210,130,0.8)" : "rgba(120,80,255,0.25)" }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pontuações */}
            {sideMode === "scores" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 80px" }}>
                {/* Upload */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,130,220,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Arquivo de Avaliação</p>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                    style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed rgba(120,80,255,0.35)", background: "rgba(12,8,28,0.6)", color: "rgba(180,150,255,0.7)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {uploadLoading ? <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Upload size={13} />}
                    {report.assessment_file ? "Trocar arquivo" : "Subir arquivo (PDF/imagem)"}
                  </button>
                  {report.assessment_file && (
                    <p style={{ fontSize: 11, color: "rgba(80,210,130,0.7)", marginTop: 4 }}>✓ Arquivo anexado</p>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleUpload} />
                </div>

                {/* Score inputs por teste */}
                {selectedTests.length === 0 ? (
                  <p style={{ fontSize: 12, color: "rgba(160,140,210,0.4)", textAlign: "center", padding: "20px 0" }}>
                    Nenhum teste selecionado para este laudo.
                  </p>
                ) : selectedTests.map((testName) => {
                  const config = SCORE_CONFIGS[testName];
                  return (
                    <div key={testName} style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,100,255,0.7)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{testName}</p>
                      {config ? config.fields.map((field) => (
                        <div key={field.key} style={{ marginBottom: 6 }}>
                          <label style={{ fontSize: 10, color: "rgba(160,140,210,0.55)", display: "block", marginBottom: 2 }}>{field.label}</label>
                          <input
                            type={field.type === "text" ? "text" : "number"}
                            min={field.min} max={field.max}
                            placeholder={field.placeholder ?? (field.type === "text" ? "—" : `${field.min ?? 0}–${field.max ?? 160}`)}
                            value={testScores[testName]?.[field.key] ?? ""}
                            onChange={(e) => setScore(testName, field.key, e.target.value)}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(120,80,255,0.2)", background: "rgba(8,5,22,0.8)", color: "rgba(215,205,245,0.9)", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      )) : (
                        <textarea
                          rows={2}
                          placeholder="Descreva os resultados/pontuação..."
                          value={(testScores[testName]?.obs as string) ?? ""}
                          onChange={(e) => setScore(testName, "obs", e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(120,80,255,0.2)", background: "rgba(8,5,22,0.8)", color: "rgba(215,205,245,0.9)", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }}
                        />
                      )}
                    </div>
                  );
                })}

                {analyzeError && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)", color: "rgba(255,120,120,0.9)", fontSize: 12, marginBottom: 10 }}>
                    {analyzeError}
                  </div>
                )}

                {/* Botão gerar */}
                {!isReadOnly && selectedTests.length > 0 && (
                  <div style={{ position: "sticky", bottom: 0, paddingTop: 10, background: "rgba(8,5,20,0.95)" }}>
                    <button onClick={handleAnalyze} disabled={analyzeLoading}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, border: "1px solid rgba(180,80,255,0.4)", background: analyzeLoading ? "rgba(80,40,140,0.4)" : "linear-gradient(135deg, rgba(140,40,255,0.9), rgba(80,40,200,0.9))", color: "#fff", fontSize: 13, fontWeight: 700, cursor: analyzeLoading ? "not-allowed" : "pointer", boxShadow: analyzeLoading ? "none" : "0 0 24px rgba(160,50,240,0.35)" }}>
                      {analyzeLoading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Gerando laudo...</> : <><Brain size={14} /> Gerar Laudo Completo com IA</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Gráficos */}
            {sideMode === "charts" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,130,220,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Perfil de Desempenho</p>
                {chartData.length === 0 ? (
                  <p style={{ fontSize: 12, color: "rgba(160,140,210,0.4)", textAlign: "center", padding: "30px 0" }}>
                    Preencha as pontuações na aba "Pontuações" para ver os gráficos.
                  </p>
                ) : (
                  <div style={{ width: "100%" }}>
                    <ResponsiveContainer width="100%" height={chartData.length * 32 + 40}>
                      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,80,255,0.1)" horizontal={false} />
                        <XAxis type="number" domain={[0, 160]} tick={{ fontSize: 9, fill: "rgba(160,140,210,0.5)" }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: "rgba(180,160,220,0.6)" }} />
                        <Tooltip
                          contentStyle={{ background: "rgba(14,9,34,0.95)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: "rgba(210,190,255,0.9)" }}
                          itemStyle={{ color: "rgba(180,150,255,0.85)" }}
                        />
                        <ReferenceLine x={70}  stroke="rgba(220,50,50,0.6)"   strokeDasharray="4 2" label={{ value: "70", fill: "rgba(220,50,50,0.6)", fontSize: 9 }} />
                        <ReferenceLine x={90}  stroke="rgba(250,180,50,0.6)"  strokeDasharray="4 2" label={{ value: "90", fill: "rgba(250,180,50,0.6)", fontSize: 9 }} />
                        <ReferenceLine x={110} stroke="rgba(80,200,120,0.6)"  strokeDasharray="4 2" label={{ value: "110", fill: "rgba(80,200,120,0.6)", fontSize: 9 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Legenda classificações */}
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                      {[
                        { color: "rgba(80,210,130,0.9)",  label: "≥110 Médio Superior / Superior" },
                        { color: "rgba(130,180,255,0.9)", label: "90–109 Médio" },
                        { color: "rgba(250,200,60,0.9)",  label: "80–89 Médio Inferior" },
                        { color: "rgba(255,100,100,0.9)", label: "<80 Limítrofe / Baixo" },
                      ].map((item) => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: "rgba(170,155,215,0.65)" }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editor central */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* Cabeçalho da seção ativa */}
            <div style={{ padding: "20px 28px 14px", borderBottom: "1px solid rgba(120,80,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "rgba(230,220,255,0.95)", margin: 0 }}>{current?.title}</h3>
                <p style={{ fontSize: 12, color: "rgba(180,160,220,0.45)", margin: "3px 0 0" }}>
                  Seção {activeSection + 1} de {sections.length}
                  {current?.content.trim() ? ` · ${current.content.trim().split(/\s+/).length} palavras` : " · Não preenchida"}
                </p>
              </div>
              {!isReadOnly && (
                <button onClick={() => setAiOpen(true)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10,
                  border: "1px solid rgba(180,100,255,0.35)",
                  background: "linear-gradient(135deg, rgba(160,60,255,0.18), rgba(100,40,200,0.12))",
                  color: "rgba(210,155,255,0.95)", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(160,60,255,0.12)",
                }}>
                  <Sparkles size={14} />
                  Assistente IA
                </button>
              )}
            </div>

            {/* Área de texto */}
            <div style={{ flex: 1, padding: "20px 28px", overflow: "auto" }}>
              {isReadOnly ? (
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(210,200,240,0.85)", whiteSpace: "pre-wrap" }}>
                  {current?.content || <span style={{ color: "rgba(160,140,210,0.35)", fontStyle: "italic" }}>Seção não preenchida.</span>}
                </div>
              ) : (
                <textarea
                  key={activeSection}
                  value={current?.content ?? ""}
                  onChange={(e) => updateSection(activeSection, e.target.value)}
                  placeholder={`Escreva o conteúdo de "${current?.title}"...`}
                  style={{
                    width: "100%", height: "100%", minHeight: 400,
                    resize: "none", border: "none", outline: "none",
                    background: "transparent",
                    color: "rgba(215,205,240,0.9)",
                    fontSize: 14, lineHeight: 1.8,
                    fontFamily: "inherit",
                  }}
                />
              )}
            </div>

            {/* Navegação entre seções */}
            <div style={{ padding: "12px 28px", borderTop: "1px solid rgba(120,80,255,0.08)", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <button onClick={() => setActiveSection((i) => Math.max(0, i - 1))} disabled={activeSection === 0}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "transparent", color: activeSection === 0 ? "rgba(120,100,180,0.3)" : "rgba(180,150,255,0.7)", fontSize: 12, cursor: activeSection === 0 ? "not-allowed" : "pointer", fontWeight: 600 }}>
                ← Anterior
              </button>
              <span style={{ fontSize: 12, color: "rgba(160,140,210,0.45)", alignSelf: "center" }}>
                {activeSection + 1} / {sections.length}
              </span>
              <button onClick={() => setActiveSection((i) => Math.min(sections.length - 1, i + 1))} disabled={activeSection === sections.length - 1}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9, border: "1px solid rgba(120,80,255,0.18)", background: "transparent", color: activeSection === sections.length - 1 ? "rgba(120,100,180,0.3)" : "rgba(180,150,255,0.7)", fontSize: 12, cursor: activeSection === sections.length - 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>
                Próxima →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: assistente IA */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Assistente IA — NeuroSync" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(160,60,255,0.08)", border: "1px solid rgba(160,60,255,0.18)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Sparkles size={16} style={{ color: "rgba(200,130,255,0.9)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "rgba(200,180,240,0.8)", margin: 0, lineHeight: 1.6 }}>
              A IA irá {aiInstruction.split(" ").slice(0, 6).join(" ")}... para a seção<br />
              <strong style={{ color: "rgba(220,190,255,0.9)" }}>"{sections[activeSection]?.title}"</strong>
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              O que a IA deve fazer?
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {AI_INSTRUCTIONS.map((inst) => (
                <button key={inst.value} type="button" onClick={() => setAiInstruction(inst.value)}
                  style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: aiInstruction === inst.value ? "1px solid rgba(160,80,255,0.6)" : "1px solid rgba(120,80,255,0.15)",
                    background: aiInstruction === inst.value ? "rgba(140,60,255,0.18)" : "rgba(8,5,22,0.6)",
                    color: aiInstruction === inst.value ? "rgba(210,175,255,0.95)" : "rgba(180,160,220,0.65)",
                    fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                  }}>
                  {inst.label}
                </button>
              ))}
            </div>
          </div>

          {aiError && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)", color: "rgba(255,120,120,0.95)", fontSize: 13 }}>
              {aiError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setAiOpen(false)}>Cancelar</Button>
            <button onClick={handleAiAssist} disabled={aiLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
                borderRadius: 10, border: "1px solid rgba(180,80,255,0.35)",
                background: aiLoading ? "rgba(80,40,140,0.5)" : "linear-gradient(135deg, #a020f0, #5040e0)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer",
                boxShadow: aiLoading ? "none" : "0 0 20px rgba(160,50,240,0.3)",
              }}>
              {aiLoading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Gerando...</> : <><Sparkles size={14} /> Gerar com IA</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: histórico de versões */}
      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="Histórico de Versões" size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {versions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <History size={32} style={{ color: "rgba(140,120,200,0.2)", margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(180,160,220,0.45)", fontSize: 13, margin: 0 }}>
                Nenhuma versão salva ainda.
              </p>
              <p style={{ color: "rgba(160,140,200,0.3)", fontSize: 12, margin: "4px 0 0" }}>
                Versions são criadas automaticamente ao salvar o laudo.
              </p>
            </div>
          ) : (
            versions.map((v, i) => {
              const filledSections = v.sections_snapshot.filter((s) => s.content.trim().length > 0).length;
              const totalWords = v.sections_snapshot.reduce((acc, s) => acc + s.content.trim().split(/\s+/).filter(Boolean).length, 0);
              const isLatest = i === 0;
              return (
                <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{
                    borderRadius: 14, border: `1px solid ${isLatest ? "rgba(160,80,255,0.3)" : "rgba(120,80,255,0.12)"}`,
                    background: isLatest ? "rgba(120,60,255,0.08)" : "rgba(12,8,28,0.7)",
                    overflow: "hidden",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: isLatest ? "rgba(160,80,255,0.2)" : "rgba(120,80,255,0.1)",
                        border: `1px solid ${isLatest ? "rgba(160,80,255,0.4)" : "rgba(120,80,255,0.2)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isLatest ? "rgba(200,150,255,0.95)" : "rgba(160,140,210,0.7)", fontFamily: "monospace" }}>
                          v{v.version_number}
                        </span>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(215,205,245,0.9)", margin: 0 }}>
                            Versão {v.version_number}
                          </p>
                          {isLatest && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: "rgba(160,80,255,0.2)", border: "1px solid rgba(160,80,255,0.3)", color: "rgba(200,150,255,0.9)" }}>
                              MAIS RECENTE
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(180,160,220,0.45)", margin: "3px 0 0" }}>
                          {new Date(v.created_at).toLocaleString("pt-BR")} · {v.saved_by_name}
                        </p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button onClick={() => restoreVersion(v)}
                        style={{
                          padding: "6px 14px", borderRadius: 9,
                          border: "1px solid rgba(80,160,255,0.3)",
                          background: "rgba(60,120,255,0.1)",
                          color: "rgba(120,190,255,0.9)",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          flexShrink: 0,
                        }}>
                        Restaurar
                      </button>
                    )}
                  </div>

                  {/* Resumo de conteúdo */}
                  <div style={{ borderTop: "1px solid rgba(120,80,255,0.08)", padding: "10px 16px", display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: filledSections > 0 ? "rgba(80,210,130,0.7)" : "rgba(120,80,255,0.2)" }} />
                      <span style={{ fontSize: 11, color: "rgba(160,140,210,0.5)" }}>
                        {filledSections}/{v.sections_snapshot.length} seções preenchidas
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(160,140,210,0.5)" }}>
                      ~{totalWords} palavras
                    </span>
                  </div>

                  {/* Preview da primeira seção com conteúdo */}
                  {(() => {
                    const firstFilled = v.sections_snapshot.find((s) => s.content.trim().length > 0);
                    if (!firstFilled) return null;
                    return (
                      <div style={{ padding: "0 16px 12px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(160,130,220,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
                          {firstFilled.title}
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(185,170,225,0.55)", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {firstFilled.content}
                        </p>
                      </div>
                    );
                  })()}
                </motion.div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Modal: confirmar assinatura */}
      <Modal open={showSignConfirm} onClose={() => { setShowSignConfirm(false); setSignName(""); setSignNameError(""); }} title="Assinar Laudo" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(80,210,130,0.08)", border: "1px solid rgba(80,210,130,0.2)", display: "flex", gap: 10 }}>
            <CheckCircle size={16} style={{ color: "rgba(80,210,130,0.9)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "rgba(190,240,210,0.8)", margin: 0, lineHeight: 1.6 }}>
              Ao assinar, o laudo ficará <strong>bloqueado para edição</strong>. Esta ação não pode ser desfeita.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Nome completo do psicólogo(a) *
            </label>
            <input
              autoFocus
              value={signName}
              onChange={(e) => { setSignName(e.target.value); setSignNameError(""); }}
              placeholder="Ex: Dra. Ana Paula Ferreira"
              style={{
                padding: "11px 14px", borderRadius: 12,
                border: signNameError ? "1px solid rgba(220,50,50,0.6)" : "1px solid rgba(120,80,255,0.22)",
                background: "rgba(8,5,22,0.8)",
                color: "rgba(225,215,255,0.95)", fontSize: 13, outline: "none",
              }}
              onFocus={(e) => { if (!signNameError) { e.currentTarget.style.border = "1px solid rgba(80,210,130,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(60,180,100,0.12)"; } }}
              onBlur={(e) => { if (!signNameError) { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.22)"; e.currentTarget.style.boxShadow = "none"; } }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSign(); } }}
            />
            {signNameError && (
              <p style={{ fontSize: 12, color: "rgba(255,100,100,0.9)", margin: 0 }}>{signNameError}</p>
            )}
            <p style={{ fontSize: 11, color: "rgba(160,140,210,0.4)", margin: 0 }}>
              O nome digitado aparecerá como assinatura no laudo e no PDF.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => { setShowSignConfirm(false); setSignName(""); setSignNameError(""); }}>Cancelar</Button>
            <button onClick={handleSign} disabled={signReport.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(80,210,130,0.35)", background: "rgba(50,180,100,0.2)", color: "rgba(100,230,150,0.95)", fontSize: 13, fontWeight: 700, cursor: signReport.isPending ? "not-allowed" : "pointer" }}>
              {signReport.isPending ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : <PenLine size={14} />}
              Confirmar Assinatura
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
