import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Plus, Trash2, Edit2, Package, AlertTriangle,
  CheckCircle, Clock, Activity, ChevronRight, Minus,
  FlaskConical, Users, Search, X, ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useScales, useStockSummary, useCreateScale, useUpdateScale,
  useDeleteScale, useSessions, useCreateSession, useDeleteSession,
} from "@/hooks/useNeurotests";
import { useCreateMovement } from "@/hooks/useInventory";
import { usePatients } from "@/hooks/usePatients";
import type {
  NeurotestScale, NeurotestSession, NeurotestCategory, SessionStatus,
} from "@/types";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  intelligence: { label: "Inteligência",     color: "rgba(150,100,255,1)", bg: "rgba(130,80,255,0.12)" },
  memory:       { label: "Memória",           color: "rgba(80,180,255,1)",  bg: "rgba(60,160,255,0.10)" },
  attention:    { label: "Atenção / FE",      color: "rgba(255,160,50,1)",  bg: "rgba(255,140,30,0.10)" },
  development:  { label: "Desenv. / TDAH",   color: "rgba(80,220,150,1)",  bg: "rgba(60,200,130,0.10)" },
  autism:       { label: "TEA / Neurodesenv.",color: "rgba(255,100,180,1)", bg: "rgba(240,80,160,0.10)" },
  personality:  { label: "Personalidade",    color: "rgba(255,200,60,1)",  bg: "rgba(240,180,40,0.10)" },
  neuropsych:   { label: "Neuropsicológica", color: "rgba(110,220,255,1)", bg: "rgba(90,200,240,0.10)" },
  other:        { label: "Outro",             color: "rgba(160,150,210,0.8)", bg: "rgba(130,120,200,0.09)" },
};

const STOCK_STATUS: Record<string, { label: string; color: string; glow: string }> = {
  ok:        { label: "OK",           color: "rgba(80,220,140,1)",    glow: "0 0 10px rgba(80,220,140,0.4)" },
  low:       { label: "Baixo",        color: "rgba(255,200,50,1)",    glow: "0 0 10px rgba(255,200,50,0.4)" },
  zero:      { label: "Zerado",       color: "rgba(255,90,90,1)",     glow: "0 0 10px rgba(255,90,90,0.45)" },
  untracked: { label: "Sem registro", color: "rgba(150,130,200,0.5)", glow: "none" },
};

const SESSION_STATUS: Record<SessionStatus, { label: string; variant: "success" | "warning" | "muted"; icon: React.ElementType }> = {
  pending:     { label: "Pendente",     variant: "warning", icon: Clock },
  in_progress: { label: "Em Andamento", variant: "warning", icon: Activity },
  completed:   { label: "Concluído",    variant: "success", icon: CheckCircle },
};

type Tab = "catalog" | "sessions";

const EMPTY_SCALE = {
  name: "", abbreviation: "", category: "" as NeurotestCategory | "",
  description: "", age_range: "", application_time: "", scoring_guide: "",
};

const EMPTY_SESSION = {
  patient: "", scale: "", status: "pending" as SessionStatus, raw_score: "", observations: "",
};

/* ─── Bubble Chart ──────────────────────────────────────────────────────── */

function StockBubbleChart({
  scales,
  onSelect,
}: {
  scales: NeurotestScale[];
  onSelect: (scale: NeurotestScale) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const tracked = scales.filter(
    (s) => s.stock_info.status !== "untracked" && s.stock_info.quantity !== null
  );
  if (tracked.length === 0) return null;
  const maxQty = Math.max(...tracked.map((s) => s.stock_info.quantity ?? 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
      style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.85)", padding: "22px 24px", backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FlaskConical size={14} style={{ color: "rgba(180,130,255,0.8)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(160,130,220,0.6)" }}>
            Visão de Estoque por Teste
          </span>
        </div>
        <span style={{ fontSize: 10, color: "rgba(140,120,200,0.4)", fontStyle: "italic" }}>
          Clique para filtrar
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 14, minHeight: 110, paddingBottom: 4 }}>
        {tracked.map((scale, i) => {
          const qty = scale.stock_info.quantity ?? 0;
          const minQ = scale.stock_info.min_quantity;
          const st = STOCK_STATUS[scale.stock_info.status] ?? STOCK_STATUS.untracked;
          const ratio = qty / maxQty;
          const diam = Math.round(36 + ratio * 72);
          const colorBase = st.color.replace(/[\d.]+\)$/, "");
          const isHovered = hovered === scale.id;

          return (
            <motion.div key={scale.id}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setHovered(scale.id)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => onSelect(scale)}
                title={`${scale.abbreviation || scale.name}: ${qty} un. (mín: ${minQ}) — clique para filtrar`}
                style={{
                  width: diam, height: diam, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, ${colorBase}0.4), ${colorBase}0.12))`,
                  border: `2px solid ${st.color}`,
                  boxShadow: isHovered
                    ? `${st.glow}, 0 0 0 3px ${colorBase}0.25)`
                    : st.glow,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", position: "relative", overflow: "visible",
                  transition: "box-shadow 0.15s",
                }}
              >
                <span style={{ fontSize: diam > 68 ? 18 : diam > 50 ? 14 : 11, fontWeight: 800, color: st.color, fontFamily: "monospace", lineHeight: 1 }}>
                  {qty}
                </span>
                {diam > 54 && (
                  <span style={{ fontSize: 8, fontWeight: 600, color: st.color.replace(/[\d.]+\)$/, "0.6)") }}>un</span>
                )}
                {(scale.stock_info.status === "low" || scale.stock_info.status === "zero") && (
                  <motion.div
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                    style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${st.color}`, pointerEvents: "none" }}
                  />
                )}
              </motion.div>
              <motion.span
                animate={{ color: isHovered ? st.color : "rgba(190,170,230,0.7)" }}
                style={{ fontSize: 10, fontWeight: 700, textAlign: "center", maxWidth: diam + 16, wordBreak: "break-word", lineHeight: 1.25, cursor: "pointer" }}
                onClick={() => onSelect(scale)}
              >
                {scale.abbreviation || scale.name.split(" ")[0]}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 18, marginTop: 18, flexWrap: "wrap" }}>
        {(["ok", "low", "zero"] as const).map((key) => {
          const count = tracked.filter((s) => s.stock_info.status === key).length;
          if (count === 0) return null;
          const val = STOCK_STATUS[key];
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: val.color, boxShadow: val.glow }} />
              <span style={{ fontSize: 11, color: "rgba(160,140,210,0.6)" }}>
                {val.label}: <strong style={{ color: val.color }}>{count}</strong>
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function NeurotestsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [showScaleForm, setShowScaleForm] = useState(false);
  const [editTarget, setEditTarget] = useState<NeurotestScale | null>(null);
  const [deleteScaleTarget, setDeleteScaleTarget] = useState<NeurotestScale | null>(null);
  const [scaleForm, setScaleForm] = useState(EMPTY_SCALE);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<NeurotestSession | null>(null);

  const [stockTarget, setStockTarget] = useState<NeurotestScale | null>(null);
  const [stockQty, setStockQty] = useState("1");

  const { data: scales = [], isLoading } = useScales();
  const { data: summary } = useStockSummary();
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();
  const { data: patientsData } = usePatients({ is_active: "true" });
  const patients = patientsData?.results ?? [];

  const createScale = useCreateScale();
  const updateScale = useUpdateScale();
  const deleteScale = useDeleteScale();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const createMovement = useCreateMovement();

  const filtered = scales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.name.toLowerCase().includes(q) || s.abbreviation.toLowerCase().includes(q);
    const matchCat = !filterCat || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const alertScales = scales.filter(
    (s) => s.stock_info.status === "low" || s.stock_info.status === "zero"
  );

  const cats = [...new Set(scales.map((s) => s.category).filter(Boolean))];

  const openEditForm = (scale: NeurotestScale) => {
    setEditTarget(scale);
    setScaleForm({
      name: scale.name,
      abbreviation: scale.abbreviation,
      category: scale.category,
      description: scale.description,
      age_range: scale.age_range,
      application_time: scale.application_time,
      scoring_guide: scale.scoring_guide,
    });
    setShowScaleForm(true);
  };

  const handleSaveScale = async () => {
    if (!scaleForm.name) return;
    if (editTarget) {
      await updateScale.mutateAsync({ id: editTarget.id, data: scaleForm as Partial<NeurotestScale> });
    } else {
      await createScale.mutateAsync(scaleForm as Partial<NeurotestScale>);
    }
    setShowScaleForm(false);
    setEditTarget(null);
    setScaleForm(EMPTY_SCALE);
  };

  const handleStockMove = async (type: "entry" | "exit") => {
    if (!stockTarget || !stockQty || Number(stockQty) < 1) return;
    const productId = stockTarget.stock_info.product_id;
    if (!productId) { navigate("/inventory"); return; }
    await createMovement.mutateAsync({
      product: productId,
      type,
      quantity: Number(stockQty),
      notes: type === "entry"
        ? `Reposição — ${stockTarget.abbreviation || stockTarget.name}`
        : `Retirada manual — ${stockTarget.abbreviation || stockTarget.name}`,
    });
    setStockTarget(null);
    setStockQty("1");
  };

  const handleQuickRemove = async (scale: NeurotestScale) => {
    const productId = scale.stock_info.product_id;
    if (!productId || scale.stock_info.quantity === null || scale.stock_info.quantity < 1) return;
    await createMovement.mutateAsync({
      product: productId,
      type: "exit",
      quantity: 1,
      notes: `Retirada manual — ${scale.abbreviation || scale.name}`,
    });
  };

  const handleSaveSession = async () => {
    if (!sessionForm.patient || !sessionForm.scale) return;
    await createSession.mutateAsync({
      patient: sessionForm.patient,
      scale: sessionForm.scale,
      status: sessionForm.status,
      ...(sessionForm.raw_score ? { raw_score: Number(sessionForm.raw_score) } : {}),
      observations: sessionForm.observations,
    } as Partial<NeurotestSession>);
    setSessionForm(EMPTY_SESSION);
    setShowSessionForm(false);
  };

  const isSaving = createScale.isPending || updateScale.isPending;

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 48px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>
              Testes Neuropsicológicos
            </h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>
              {scales.length} teste(s) no catálogo · {sessions.length} sessão(ões) registrada(s)
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "sessions" && (
              <Button variant="ghost" onClick={() => setShowSessionForm(true)}>
                <Plus size={14} /> Nova Sessão
              </Button>
            )}
            <Button onClick={() => { setEditTarget(null); setScaleForm(EMPTY_SCALE); setShowScaleForm(true); }}>
              <Plus size={14} /> Novo Teste
            </Button>
          </div>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { icon: <Brain size={17} />, label: "Testes Cadastrados", value: String(summary?.total ?? scales.length), color: "rgba(190,130,255,0.9)", border: "rgba(130,50,255,0.22)", bg: "rgba(130,50,255,0.14)" },
            { icon: <CheckCircle size={17} />, label: "Estoque OK", value: String(summary?.ok ?? 0), color: "rgba(80,220,140,0.9)", border: "rgba(20,180,100,0.22)", bg: "rgba(20,180,100,0.13)" },
            { icon: <AlertTriangle size={17} />, label: "Estoque Baixo", value: String((summary?.low ?? 0) + (summary?.zero ?? 0)), color: alertScales.length > 0 ? "rgba(255,210,80,0.9)" : "rgba(80,220,140,0.9)", border: alertScales.length > 0 ? "rgba(240,180,30,0.25)" : "rgba(20,180,100,0.2)", bg: alertScales.length > 0 ? "rgba(240,180,30,0.13)" : "rgba(20,180,100,0.1)" },
            { icon: <ClipboardList size={17} />, label: "Sessões Aplicadas", value: String(sessions.length), color: "rgba(110,180,255,0.9)", border: "rgba(40,140,255,0.2)", bg: "rgba(40,140,255,0.12)" },
          ].map((c) => (
            <div key={c.label} style={{ borderRadius: 16, border: `1px solid ${c.border}`, background: "rgba(12,8,28,0.8)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(160,130,220,0.55)", margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: "3px 0 0", fontFamily: "monospace" }}>{c.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bubble chart */}
        <StockBubbleChart scales={scales} onSelect={(scale) => {
          setTab("catalog");
          setSearch(scale.abbreviation || scale.name);
          setFilterCat("");
        }} />

        {/* Alert banner */}
        <AnimatePresence>
          {alertScales.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ borderRadius: 14, border: "1px solid rgba(240,180,30,0.28)", background: "rgba(240,180,30,0.06)", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={13} style={{ color: "rgba(255,210,80,0.9)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,210,80,0.8)" }}>
                  {alertScales.length} teste(s) com estoque crítico
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {alertScales.map((s) => {
                  const st = STOCK_STATUS[s.stock_info.status];
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 9, background: "rgba(0,0,0,0.2)", border: `1px solid ${st.color.replace(/[\d.]+\)$/, "0.3)")}` }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, boxShadow: st.glow }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(225,215,255,0.9)" }}>{s.abbreviation || s.name}</span>
                      <span style={{ fontSize: 11, color: st.color }}>{s.stock_info.quantity ?? 0} un.</span>
                      <button onClick={() => { setStockTarget(s); setStockQty("1"); }}
                        style={{ fontSize: 11, fontWeight: 700, color: "rgba(80,220,140,0.9)", background: "rgba(20,180,100,0.12)", border: "1px solid rgba(20,180,100,0.25)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                        + Repor
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {([["catalog", "Catálogo de Testes"], ["sessions", "Sessões Aplicadas"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "7px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: tab === key ? "1px solid rgba(160,80,255,0.45)" : "1px solid rgba(120,80,255,0.15)", background: tab === key ? "rgba(130,50,255,0.2)" : "transparent", color: tab === key ? "rgba(220,190,255,0.95)" : "rgba(170,150,210,0.6)", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── CATALOG TAB ── */}
        {tab === "catalog" && (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(160,130,220,0.5)" }} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar teste..."
                  style={{ ...inputStyle, paddingLeft: 34 }} />
                {search && (
                  <button onClick={() => setSearch("")}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(160,130,220,0.5)", display: "flex" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ width: 210 }}>
                <Select
                  value={filterCat}
                  onChange={(v) => { setFilterCat(v); setPage(1); }}
                  placeholder="Todas as categorias"
                  options={[
                    { value: "", label: "Todas as categorias" },
                    ...cats.map((c) => ({
                      value: c,
                      label: CATEGORY_META[c]?.label ?? c,
                      color: CATEGORY_META[c]?.color,
                    })),
                  ]}
                />
              </div>
            </div>

            {isLoading && <p style={{ textAlign: "center", color: "rgba(160,140,210,0.4)", padding: "40px 0" }}>Carregando...</p>}

            {!isLoading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Brain size={44} style={{ margin: "0 auto 12px", color: "rgba(130,80,255,0.2)" }} />
                <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>
                  {search || filterCat ? "Nenhum teste encontrado." : 'Nenhum teste cadastrado. Clique em "Novo Teste" para começar.'}
                </p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              <AnimatePresence>
                {paginated.map((scale, i) => {
                  const cat = CATEGORY_META[scale.category] ?? CATEGORY_META.other;
                  const st = STOCK_STATUS[scale.stock_info.status] ?? STOCK_STATUS.untracked;
                  const qty = scale.stock_info.quantity;
                  const canRemove = scale.stock_info.product_id && (scale.stock_info.quantity ?? 0) > 0;

                  return (
                    <motion.div key={scale.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.14)", background: "rgba(12,8,28,0.85)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>

                      {/* category accent bar */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cat.color.replace(/[\d.]+\)$/, "0.75)")}, transparent)`, borderRadius: "18px 18px 0 0" }} />

                      {/* title row */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(235,225,255,0.95)" }}>
                              {scale.abbreviation || scale.name}
                            </span>
                            {scale.abbreviation && (
                              <span style={{ fontSize: 11, color: "rgba(170,150,210,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                {scale.name}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: cat.bg, color: cat.color, border: `1px solid ${cat.color.replace(/[\d.]+\)$/, "0.25)")}` }}>
                              {cat.label}
                            </span>
                            {scale.age_range && <span style={{ fontSize: 10, color: "rgba(150,130,200,0.55)", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 5 }}>{scale.age_range}</span>}
                            {scale.application_time && <span style={{ fontSize: 10, color: "rgba(150,130,200,0.55)", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 5 }}>{scale.application_time}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                          <button onClick={() => openEditForm(scale)}
                            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(120,60,255,0.1)", border: "1px solid rgba(120,60,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Edit2 size={12} style={{ color: "rgba(160,120,255,0.8)" }} />
                          </button>
                          <button onClick={() => setDeleteScaleTarget(scale)}
                            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <Trash2 size={12} style={{ color: "rgba(255,100,100,0.8)" }} />
                          </button>
                        </div>
                      </div>

                      {scale.description && (
                        <p style={{ fontSize: 12, color: "rgba(185,170,225,0.6)", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {scale.description}
                        </p>
                      )}

                      {/* ── Stock panel ── */}
                      <div style={{ borderRadius: 12, border: `1px solid ${st.color.replace(/[\d.]+\)$/, "0.22)")}`, background: `${st.color.replace(/[\d.]+\)$/, "0.06)")}`, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Package size={13} style={{ color: st.color }} />
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: st.color }}>Estoque</span>
                          </div>

                          {qty !== null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <motion.div
                                animate={scale.stock_info.status !== "ok" ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ width: 9, height: 9, borderRadius: "50%", background: st.color, boxShadow: st.glow }}
                              />
                              <span style={{ fontSize: 20, fontWeight: 800, color: st.color, fontFamily: "monospace" }}>{qty}</span>
                              <span style={{ fontSize: 11, color: st.color.replace(/[\d.]+\)$/, "0.6)") }}>un.</span>
                              <span style={{ fontSize: 10, color: "rgba(140,120,190,0.45)" }}>· mín: {scale.stock_info.min_quantity}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "rgba(150,130,200,0.5)" }}>Sem registro</span>
                          )}
                        </div>

                        {/* Add / Remove buttons */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { setStockTarget(scale); setStockQty("1"); }}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", borderRadius: 8, background: "rgba(20,180,100,0.12)", border: "1px solid rgba(20,180,100,0.28)", color: "rgba(80,220,140,0.95)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            <Plus size={13} /> Adicionar
                          </button>
                          {canRemove && (
                            <button
                              onClick={() => handleQuickRemove(scale)}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", borderRadius: 8, background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.22)", color: "rgba(255,110,110,0.9)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              <Minus size={13} /> Retirar 1
                            </button>
                          )}
                          <button
                            onClick={() => navigate("/inventory")}
                            title="Ver no Estoque"
                            style={{ width: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(120,60,255,0.1)", border: "1px solid rgba(120,60,255,0.22)", color: "rgba(180,130,255,0.8)", cursor: "pointer" }}>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Sessions count */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Users size={12} style={{ color: "rgba(140,120,190,0.5)" }} />
                          <span style={{ fontSize: 12, color: "rgba(140,120,190,0.5)" }}>
                            {sessions.filter((s) => s.scale === scale.id).length} sessão(ões)
                          </span>
                        </div>
                        <button onClick={() => setTab("sessions")}
                          style={{ fontSize: 11, fontWeight: 700, color: "rgba(170,120,255,0.8)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                          Ver sessões <ChevronRight size={11} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(120,80,255,0.22)",
                    background: page === 1 ? "transparent" : "rgba(120,60,255,0.1)",
                    color: page === 1 ? "rgba(130,110,190,0.3)" : "rgba(200,170,255,0.8)",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}
                >‹</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === page;
                  const isNear = Math.abs(p - page) <= 2;
                  if (!isNear && p !== 1 && p !== totalPages) {
                    if (p === page - 3 || p === page + 3) {
                      return <span key={p} style={{ color: "rgba(130,110,190,0.4)", fontSize: 12 }}>…</span>;
                    }
                    return null;
                  }
                  return (
                    <motion.button key={p}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setPage(p)}
                      style={{
                        width: 34, height: 34, borderRadius: 10,
                        border: isActive ? "1px solid rgba(160,80,255,0.55)" : "1px solid rgba(120,80,255,0.15)",
                        background: isActive ? "rgba(130,50,255,0.25)" : "transparent",
                        color: isActive ? "rgba(220,190,255,0.95)" : "rgba(170,150,210,0.55)",
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer", fontSize: 13,
                        boxShadow: isActive ? "0 0 0 3px rgba(130,60,255,0.12)" : "none",
                      }}
                    >{p}</motion.button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(120,80,255,0.22)",
                    background: page === totalPages ? "transparent" : "rgba(120,60,255,0.1)",
                    color: page === totalPages ? "rgba(130,110,190,0.3)" : "rgba(200,170,255,0.8)",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}
                >›</button>

                <span style={{ fontSize: 11, color: "rgba(140,120,190,0.45)", marginLeft: 4 }}>
                  {filtered.length} testes · pág. {page}/{totalPages}
                </span>
              </motion.div>
            )}
          </>
        )}

        {/* ── SESSIONS TAB ── */}
        {tab === "sessions" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.8)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(120,80,255,0.12)", background: "rgba(20,12,44,0.9)" }}>
                  {["Paciente", "Teste", "Data", "Status", "P. Bruta", "P. Normalizada", "Ações"].map((h) => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(160,130,220,0.55)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingSessions && <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "rgba(160,140,210,0.4)" }}>Carregando...</td></tr>}
                {!loadingSessions && sessions.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "56px 16px", textAlign: "center" }}>
                    <ClipboardList size={36} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
                    <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>Nenhuma sessão registrada.</p>
                  </td></tr>
                )}
                <AnimatePresence>
                  {sessions.map((s, i) => {
                    const sc = SESSION_STATUS[s.status] ?? SESSION_STATUS.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,60,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "rgba(225,215,255,0.9)" }}>{s.patient_name}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(190,150,255,0.9)" }}>{s.scale_abbreviation || s.scale_name}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(160,140,210,0.5)" }}>
                          {new Date(s.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <StatusIcon size={12} style={{ color: sc.variant === "success" ? "rgba(80,210,130,0.9)" : "rgba(250,200,60,0.9)" }} />
                            <Badge label={sc.label} variant={sc.variant} />
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: "rgba(190,175,230,0.8)" }}>
                          {s.raw_score ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: "rgba(190,175,230,0.8)" }}>
                          {s.normalized_score ?? "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => setDeleteSessionTarget(s)}
                            style={{ padding: "5px 8px", borderRadius: 7, background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "rgba(255,100,100,0.8)", cursor: "pointer", display: "flex" }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Novo / Editar Teste */}
      <Modal open={showScaleForm} onClose={() => { setShowScaleForm(false); setEditTarget(null); setScaleForm(EMPTY_SCALE); }}
        title={editTarget ? "Editar Teste" : "Novo Teste"} size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome Completo">
              <input placeholder="Ex: Escala de Inteligência Wechsler" value={scaleForm.name}
                onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Sigla (vincula ao estoque e ao laudo)">
              <input placeholder="Ex: WISC-V" value={scaleForm.abbreviation}
                onChange={(e) => setScaleForm({ ...scaleForm, abbreviation: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Categoria">
              <Select
                value={scaleForm.category}
                onChange={(v) => setScaleForm({ ...scaleForm, category: v as NeurotestCategory | "" })}
                placeholder="Selecione..."
                options={Object.entries(CATEGORY_META).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                  color: v.color,
                }))}
              />
            </Field>
            <Field label="Faixa Etária">
              <input placeholder="Ex: 6 a 16 anos" value={scaleForm.age_range}
                onChange={(e) => setScaleForm({ ...scaleForm, age_range: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Tempo de Aplicação">
              <input placeholder="Ex: 60–90 min" value={scaleForm.application_time}
                onChange={(e) => setScaleForm({ ...scaleForm, application_time: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea placeholder="Breve descrição do instrumento neuropsicológico..." value={scaleForm.description}
              onChange={(e) => setScaleForm({ ...scaleForm, description: e.target.value })}
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
          </Field>
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(130,80,255,0.06)", border: "1px solid rgba(130,80,255,0.15)", fontSize: 12, color: "rgba(180,150,240,0.7)", lineHeight: 1.7 }}>
            <strong style={{ color: "rgba(200,170,255,0.9)" }}>Como funciona:</strong> A <strong>sigla</strong> deve ser idêntica ao campo "Nome no Laudo" do material no Estoque.
            Ao selecionar este teste em um laudo, o sistema abate automaticamente 1 unidade do estoque.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setShowScaleForm(false); setEditTarget(null); setScaleForm(EMPTY_SCALE); }}>Cancelar</Button>
            <Button loading={isSaving} onClick={handleSaveScale} disabled={!scaleForm.name}>
              {editTarget ? "Salvar Alterações" : "Criar Teste"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Repor Estoque */}
      <Modal open={!!stockTarget} onClose={() => { setStockTarget(null); setStockQty("1"); }}
        title={`Adicionar ao Estoque — ${stockTarget?.abbreviation || stockTarget?.name}`} size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stockTarget && stockTarget.stock_info.quantity !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, color: "rgba(160,140,210,0.6)" }}>Estoque atual:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: STOCK_STATUS[stockTarget.stock_info.status].color, fontFamily: "monospace" }}>
                {stockTarget.stock_info.quantity} un.
              </span>
            </div>
          )}
          {stockTarget && stockTarget.stock_info.quantity === null && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,170,50,0.07)", border: "1px solid rgba(255,170,50,0.2)", fontSize: 12, color: "rgba(255,210,80,0.8)", lineHeight: 1.7 }}>
              Nenhum material com sigla <strong>"{stockTarget.abbreviation || stockTarget.name}"</strong> no estoque.
              Cadastre o material no Estoque com o campo "Nome no Laudo" igual à sigla do teste.
            </div>
          )}
          <Field label="Quantidade a adicionar">
            <input type="number" min="1" placeholder="1" value={stockQty}
              onChange={(e) => setStockQty(e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => { setStockTarget(null); setStockQty("1"); }}>Cancelar</Button>
            {stockTarget?.stock_info.quantity === null ? (
              <Button onClick={() => { navigate("/inventory"); setStockTarget(null); }}>
                Ir para Estoque
              </Button>
            ) : (
              <Button loading={createMovement.isPending} onClick={() => handleStockMove("entry")} disabled={!stockQty || Number(stockQty) < 1}>
                <Plus size={13} /> Registrar Entrada
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Nova Sessão */}
      <Modal open={showSessionForm} onClose={() => { setShowSessionForm(false); setSessionForm(EMPTY_SESSION); }}
        title="Nova Sessão de Teste" size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Paciente">
              <Select
                value={sessionForm.patient}
                onChange={(v) => setSessionForm({ ...sessionForm, patient: v })}
                placeholder="Selecione..."
                options={patients.map((p) => ({ value: p.id, label: p.full_name }))}
              />
            </Field>
            <Field label="Teste">
              <Select
                value={sessionForm.scale}
                onChange={(v) => setSessionForm({ ...sessionForm, scale: v })}
                placeholder="Selecione..."
                options={scales.map((s) => ({
                  value: s.id,
                  label: s.abbreviation || s.name,
                  color: CATEGORY_META[s.category]?.color,
                }))}
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Status">
              <Select
                value={sessionForm.status}
                onChange={(v) => setSessionForm({ ...sessionForm, status: v as SessionStatus })}
                options={[
                  { value: "pending",     label: "Pendente",      color: "rgba(255,200,50,1)" },
                  { value: "in_progress", label: "Em Andamento",  color: "rgba(110,180,255,1)" },
                  { value: "completed",   label: "Concluído",     color: "rgba(80,220,140,1)" },
                ]}
              />
            </Field>
            <Field label="Pontuação Bruta (opcional)">
              <input type="number" step="0.1" placeholder="0" value={sessionForm.raw_score}
                onChange={(e) => setSessionForm({ ...sessionForm, raw_score: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <Field label="Observações">
            <textarea placeholder="Observações sobre a aplicação do teste..." value={sessionForm.observations}
              onChange={(e) => setSessionForm({ ...sessionForm, observations: e.target.value })}
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setShowSessionForm(false); setSessionForm(EMPTY_SESSION); }}>Cancelar</Button>
            <Button loading={createSession.isPending} onClick={handleSaveSession} disabled={!sessionForm.patient || !sessionForm.scale}>
              Registrar Sessão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Excluir Teste */}
      <Modal open={!!deleteScaleTarget} onClose={() => setDeleteScaleTarget(null)} title="Excluir Teste" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir o teste <strong style={{ color: "rgba(235,225,255,0.95)" }}>"{deleteScaleTarget?.abbreviation || deleteScaleTarget?.name}"</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteScaleTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteScale.isPending}
              onClick={() => deleteScale.mutate(deleteScaleTarget!.id, { onSuccess: () => setDeleteScaleTarget(null) })}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Excluir Sessão */}
      <Modal open={!!deleteSessionTarget} onClose={() => setDeleteSessionTarget(null)} title="Excluir Sessão" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir sessão de <strong style={{ color: "rgba(235,225,255,0.95)" }}>{deleteSessionTarget?.patient_name}</strong> —{" "}
            <strong style={{ color: "rgba(190,150,255,0.9)" }}>{deleteSessionTarget?.scale_abbreviation || deleteSessionTarget?.scale_name}</strong>?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteSessionTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteSession.isPending}
              onClick={() => deleteSession.mutate(deleteSessionTarget!.id, { onSuccess: () => setDeleteSessionTarget(null) })}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(160,130,220,0.6)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: "1px solid rgba(120,80,255,0.22)",
  background: "rgba(8,5,22,0.75)", color: "rgba(225,215,255,0.9)",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};

