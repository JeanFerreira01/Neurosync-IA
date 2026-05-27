import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Check,
  CheckCircle, Clock, AlertCircle, Ban, Receipt, Users,
  Activity, Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useTransactions, useSummary, useCreateTransaction,
  useDeleteTransaction, useMarkPaid, usePatientMargin,
} from "@/hooks/useFinancial";
import { usePatients } from "@/hooks/usePatients";
import { useScales } from "@/hooks/useNeurotests";
import { useProducts } from "@/hooks/useInventory";
import type { Transaction, TransactionType, TransactionStatus, PatientMargin } from "@/types";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<TransactionStatus, { label: string; variant: "success" | "warning" | "danger" | "muted"; icon: React.ElementType }> = {
  paid:     { label: "Pago",      variant: "success", icon: CheckCircle },
  pending:  { label: "Pendente",  variant: "warning",  icon: Clock },
  overdue:  { label: "Vencido",   variant: "danger",   icon: AlertCircle },
  canceled: { label: "Cancelado", variant: "muted",    icon: Ban },
};

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string }> = {
  income:  { label: "Receita",  color: "rgba(80,220,140,0.9)" },
  expense: { label: "Despesa",  color: "rgba(255,110,110,0.9)" },
};

type TabFilter = "overview" | "transactions" | "patients";

const TABS: { key: TabFilter; label: string; icon: React.ElementType }[] = [
  { key: "overview",     label: "Visão Geral",        icon: Activity },
  { key: "transactions", label: "Transações",          icon: Receipt },
  { key: "patients",     label: "Por Paciente",        icon: Users },
];

type TestRow = { test_name: string; unit_price: string; quantity: string };

const INSURANCE_OPTIONS = [
  { value: "Unimed",           label: "Unimed",             color: "rgba(80,220,140,0.9)" },
  { value: "Bradesco Saúde",   label: "Bradesco Saúde",     color: "rgba(110,160,255,0.9)" },
  { value: "Amil",             label: "Amil",               color: "rgba(255,160,60,0.9)" },
  { value: "SulAmérica",       label: "SulAmérica",         color: "rgba(255,100,130,0.9)" },
  { value: "Porto Seguro",     label: "Porto Seguro",       color: "rgba(160,120,255,0.9)" },
  { value: "Hapvida",          label: "Hapvida",            color: "rgba(80,210,200,0.9)" },
  { value: "Notre Dame",       label: "Notre Dame",         color: "rgba(220,180,255,0.9)" },
  { value: "Particular",       label: "Particular (sem convênio)", color: "rgba(200,180,255,0.7)" },
];

const EMPTY_FORM = {
  type: "income" as TransactionType,
  description: "",
  amount: "",
  due_date: "",
  patient: "",
  insurance: "",
  payment_method: "",
  testRows: [] as TestRow[],
};

function fmt(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── Margin Bar Chart ───────────────────────────────────────────────────── */

function MarginBarChart({ data }: { data: PatientMargin[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (data.length === 0) return null;

  const maxIncome = Math.max(...data.map((d) => Number(d.income)), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(120,80,255,0.18)",
        background: "rgba(10,6,26,0.92)",
        padding: "24px 28px",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(130,80,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Glow accent */}
      <div style={{
        position: "absolute", top: -60, right: -60, width: 220, height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(130,60,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(130,60,255,0.18)", border: "1px solid rgba(130,60,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={14} style={{ color: "rgba(180,120,255,0.9)" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(235,225,255,0.95)" }}>Margem por Paciente</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(160,140,210,0.5)" }}>Cobrado vs. custo de materiais</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { color: "rgba(80,220,140,1)", label: "Cobrado" },
              { color: "rgba(255,110,110,1)", label: "Materiais" },
              { color: "rgba(160,100,255,1)", label: "Margem" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: "rgba(160,140,210,0.6)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {data.map((m, i) => {
            const income = Number(m.income);
            const expense = Number(m.expense);
            const margin = Number(m.margin);
            const marginPositive = margin >= 0;
            const incomeRatio = income / maxIncome;
            const expenseRatio = income > 0 ? expense / income : 0;
            const isHov = hovered === m.patient_id;

            return (
              <motion.div
                key={m.patient_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + i * 0.06 }}
                onHoverStart={() => setHovered(m.patient_id)}
                onHoverEnd={() => setHovered(null)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: isHov ? "1px solid rgba(130,60,255,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  background: isHov ? "rgba(130,60,255,0.07)" : "rgba(255,255,255,0.02)",
                  transition: "border 0.15s, background 0.15s",
                  cursor: "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, rgba(${marginPositive ? "80,180,130" : "200,80,80"},0.25), rgba(${marginPositive ? "50,140,100" : "150,50,50"},0.15))`,
                    border: `1px solid rgba(${marginPositive ? "80,200,140" : "255,100,100"},0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: marginPositive ? "rgba(80,220,140,0.9)" : "rgba(255,110,110,0.9)",
                  }}>
                    {initials(m.patient_name)}
                  </div>

                  {/* Name + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(235,225,255,0.92)" }}>
                          {m.patient_name}
                        </span>
                        {m.insurance && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: "rgba(130,80,255,0.12)", border: "1px solid rgba(130,80,255,0.22)", color: "rgba(180,140,255,0.8)" }}>
                            {m.insurance}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: "rgba(160,140,210,0.5)" }}>custo {fmt(expense)}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: marginPositive ? "rgba(80,220,140,1)" : "rgba(255,110,110,1)" }}>
                          {marginPositive ? "+" : ""}{fmt(margin)}
                        </span>
                      </div>
                    </div>

                    {/* Bar track */}
                    <div style={{ position: "relative", height: 10, borderRadius: 6, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      {/* Income bar */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${incomeRatio * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                        style={{
                          position: "absolute", left: 0, top: 0, height: "100%",
                          background: "linear-gradient(90deg, rgba(80,220,140,0.7), rgba(80,220,140,0.4))",
                          borderRadius: 6,
                        }}
                      />
                      {/* Expense overlay */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${expenseRatio * incomeRatio * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                        style={{
                          position: "absolute", left: 0, top: 0, height: "100%",
                          background: "linear-gradient(90deg, rgba(255,100,100,0.85), rgba(255,80,80,0.6))",
                          borderRadius: 6,
                        }}
                      />
                    </div>

                    {/* Sub-labels */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 10, color: "rgba(80,220,140,0.7)", fontFamily: "monospace" }}>
                        {fmt(income)}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(160,130,210,0.45)" }}>
                        {m.margin_pct}% de margem
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Patient Detail Card ────────────────────────────────────────────────── */

function PatientCard({ m, i }: { m: PatientMargin; i: number }) {
  const income = Number(m.income);
  const expense = Number(m.expense);
  const margin = Number(m.margin);
  const marginPositive = margin >= 0;
  const pct = Math.min(Math.abs(m.margin_pct), 100);

  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      style={{
        borderRadius: 18,
        border: "1px solid rgba(120,80,255,0.14)",
        background: "rgba(12,8,28,0.85)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: marginPositive ? "rgba(80,160,120,0.2)" : "rgba(180,60,60,0.2)",
          border: `1.5px solid ${marginPositive ? "rgba(80,220,140,0.4)" : "rgba(255,100,100,0.4)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: marginPositive ? "rgba(80,220,140,0.9)" : "rgba(255,110,110,0.9)",
        }}>
          {initials(m.patient_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "rgba(235,225,255,0.95)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.patient_name}
          </p>
          {m.insurance && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 5, background: "rgba(130,80,255,0.12)", border: "1px solid rgba(130,80,255,0.22)", color: "rgba(180,140,255,0.8)", marginTop: 3, display: "inline-block" }}>
              {m.insurance}
            </span>
          )}
        </div>
        {/* Donut */}
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={34} cy={34} r={30} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
            <motion.circle
              cx={34} cy={34} r={30} fill="none"
              stroke={marginPositive ? "rgba(80,220,140,0.8)" : "rgba(255,100,100,0.8)"}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: "easeOut" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: marginPositive ? "rgba(80,220,140,1)" : "rgba(255,100,100,1)", lineHeight: 1 }}>
              {m.margin_pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Cobrado", value: fmt(income), color: "rgba(80,220,140,0.9)" },
          { label: "Materiais", value: fmt(expense), color: "rgba(255,110,110,0.9)" },
          { label: "Margem", value: `${marginPositive ? "+" : ""}${fmt(margin)}`, color: marginPositive ? "rgba(80,220,140,1)" : "rgba(255,100,100,1)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(150,130,200,0.5)" }}>{label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tests breakdown */}
      {m.materials && m.materials.length > 0 && (
        <div style={{ borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", padding: "10px 14px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(150,130,200,0.5)" }}>Testes Utilizados</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {m.materials.map((mat, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 7, background: "rgba(130,80,255,0.08)", border: "1px solid rgba(130,80,255,0.18)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(200,170,255,0.85)" }}>{mat.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,110,110,0.8)", fontFamily: "monospace" }}>{mat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Chart helpers ─────────────────────────────────────────────────────── */

function ChartPanel({ title, subtitle, children, style }: {
  title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 20, border: "1px solid rgba(120,80,255,0.16)",
        background: "rgba(10,6,26,0.92)", padding: "22px 24px",
        backdropFilter: "blur(20px)", position: "relative", overflow: "hidden", ...style,
      }}>
      {/* dot grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(130,80,255,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(130,60,255,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 800, color: "rgba(220,200,255,0.9)" }}>{title}</p>
        {subtitle && <p style={{ margin: "0 0 18px", fontSize: 11, color: "rgba(150,130,200,0.45)" }}>{subtitle}</p>}
        {!subtitle && <div style={{ marginBottom: 18 }} />}
        {children}
      </div>
    </motion.div>
  );
}

function SkeletonBar({ width, height = 8, delay = 0 }: { width: string; height?: number; delay?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.15, 0.35, 0.15] }}
      transition={{ repeat: Infinity, duration: 1.8, delay, ease: "easeInOut" }}
      style={{ width, height, borderRadius: 4, background: "rgba(130,80,255,0.3)" }}
    />
  );
}

/* ── 1. Monthly Area Chart ── */
function MonthlyAreaChart({ transactions }: { transactions: Transaction[] }) {
  const W = 680, H = 140, PAD = { t: 10, r: 16, b: 30, l: 50 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  // build last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("pt-BR", { month: "short" }) };
  });

  const data = months.map(({ key, label }) => {
    const txs = transactions.filter((t) => (t.due_date ?? t.created_at ?? "").slice(0, 7) === key);
    const income  = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { label, income, expense };
  });

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const xStep = innerW / (months.length - 1);

  const toPoint = (i: number, val: number) =>
    `${PAD.l + i * xStep},${PAD.t + innerH - (val / maxVal) * innerH}`;

  const incomePoints = data.map((d, i) => toPoint(i, d.income)).join(" L ");
  const expensePoints = data.map((d, i) => toPoint(i, d.expense)).join(" L ");

  const areaPath = (pts: string, side: "top" | "bottom") => {
    const arr = pts.split(" L ");
    const last = arr[arr.length - 1].split(",");
    const first = arr[0].split(",");
    return `M ${arr.join(" L ")} L ${last[0]},${PAD.t + innerH} L ${first[0]},${PAD.t + innerH} Z`;
  };

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <ChartPanel title="Receitas vs Despesas" subtitle="Últimos 6 meses">
      {!hasData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkeletonBar width={`${40 + i * 15}%`} height={6} delay={i * 0.2} />
              <SkeletonBar width={`${20 + i * 8}%`} height={6} delay={i * 0.2 + 0.1} />
            </div>
          ))}
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(150,130,200,0.3)", marginTop: 16 }}>Sem movimentação nos últimos 6 meses</p>
        </div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(80,220,140,0.35)" />
              <stop offset="100%" stopColor="rgba(80,220,140,0)" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,100,100,0.3)" />
              <stop offset="100%" stopColor="rgba(255,100,100,0)" />
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={r}>
              <line x1={PAD.l} y1={PAD.t + innerH * (1 - r)} x2={PAD.l + innerW} y2={PAD.t + innerH * (1 - r)}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={PAD.l - 6} y={PAD.t + innerH * (1 - r) + 4} textAnchor="end" fontSize={9} fill="rgba(160,140,210,0.35)">
                {r > 0 ? `${Math.round(maxVal * r / 1000)}k` : "0"}
              </text>
            </g>
          ))}
          {/* areas */}
          <path d={areaPath(incomePoints, "top")} fill="url(#incomeGrad)" />
          <path d={areaPath(expensePoints, "top")} fill="url(#expenseGrad)" />
          {/* lines */}
          <motion.path d={`M ${incomePoints}`} fill="none" stroke="rgba(80,220,140,0.85)" strokeWidth={2} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
          <motion.path d={`M ${expensePoints}`} fill="none" stroke="rgba(255,100,100,0.8)" strokeWidth={2} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }} />
          {/* dots + labels */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={PAD.l + i * xStep} cy={PAD.t + innerH - (d.income / maxVal) * innerH} r={3.5} fill="rgba(80,220,140,1)" />
              <circle cx={PAD.l + i * xStep} cy={PAD.t + innerH - (d.expense / maxVal) * innerH} r={3} fill="rgba(255,100,100,1)" />
              <text x={PAD.l + i * xStep} y={H - 6} textAnchor="middle" fontSize={10} fill="rgba(160,140,210,0.5)">{d.label}</text>
            </g>
          ))}
        </svg>
      )}
      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        {[{ color: "rgba(80,220,140,1)", label: "Receitas" }, { color: "rgba(255,100,100,1)", label: "Despesas" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 18, height: 3, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: "rgba(155,135,205,0.55)" }}>{label}</span>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

/* ── 2. Insurance Donut Chart ── */
function InsuranceDonut({ transactions }: { transactions: Transaction[] }) {
  const CX = 80, CY = 80, R = 58, stroke = 22;

  const byInsurance: Record<string, number> = {};
  transactions.filter((t) => t.type === "income" && t.amount).forEach((t) => {
    const key = t.insurance || "Particular";
    byInsurance[key] = (byInsurance[key] ?? 0) + Number(t.amount);
  });

  const total = Object.values(byInsurance).reduce((s, v) => s + v, 0);
  const COLORS = [
    "rgba(80,220,140,1)", "rgba(110,160,255,1)", "rgba(255,160,60,1)",
    "rgba(255,100,160,1)", "rgba(160,120,255,1)", "rgba(80,210,200,1)", "rgba(220,180,60,1)",
  ];

  const slices = Object.entries(byInsurance).map(([label, val], i) => ({
    label, val, pct: total > 0 ? (val / total) * 100 : 0, color: COLORS[i % COLORS.length],
  }));

  const circumference = 2 * Math.PI * R;
  let offset = 0;

  const hasData = slices.length > 0;

  return (
    <ChartPanel title="Receita por Convênio" subtitle="Distribuição de planos">
      {!hasData ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <motion.div animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: 120, height: 120, borderRadius: "50%", border: "18px solid rgba(130,80,255,0.2)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {[60, 45, 70].map((w, i) => <SkeletonBar key={i} width={`${w}%`} delay={i * 0.15} />)}
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(150,130,200,0.3)" }}>Sem receitas por convênio</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width={CX * 2} height={CY * 2}>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
              {slices.map((s, i) => {
                const dashLen = (s.pct / 100) * circumference;
                const thisOffset = circumference - offset;
                offset += dashLen;
                return (
                  <motion.circle key={i} cx={CX} cy={CY} r={R} fill="none"
                    stroke={s.color} strokeWidth={stroke} strokeLinecap="butt"
                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                    strokeDashoffset={thisOffset}
                    style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                );
              })}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(150,130,200,0.5)" }}>total</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(220,200,255,0.9)", fontFamily: "monospace" }}>{fmt(total)}</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {slices.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(185,165,225,0.8)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartPanel>
  );
}

/* ── 3. Top Patients Margin Bars ── */
function TopPatientsChart({ data }: { data: PatientMargin[] }) {
  const top = [...data].sort((a, b) => Number(b.margin) - Number(a.margin)).slice(0, 5);
  const maxMargin = Math.max(...top.map((m) => Math.abs(Number(m.margin))), 1);

  return (
    <ChartPanel title="Top Pacientes" subtitle="Por margem gerada">
      {top.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[75, 55, 85, 40, 65].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <motion.div animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.12 }}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(130,80,255,0.18)" }} />
              <SkeletonBar width={`${w}%`} height={8} delay={i * 0.1} />
            </div>
          ))}
          <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 11, color: "rgba(150,130,200,0.3)" }}>Sem dados de margem por paciente</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {top.map((m, i) => {
            const margin = Number(m.margin);
            const pos = margin >= 0;
            const ratio = Math.abs(margin) / maxMargin;
            return (
              <motion.div key={m.patient_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: pos ? "rgba(80,160,120,0.2)" : "rgba(180,60,60,0.2)", border: `1px solid ${pos ? "rgba(80,220,140,0.3)" : "rgba(255,100,100,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: pos ? "rgba(80,220,140,0.9)" : "rgba(255,100,100,0.9)" }}>
                  {initials(m.patient_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(210,195,250,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.patient_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: pos ? "rgba(80,220,140,1)" : "rgba(255,100,100,1)", fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>
                      {pos ? "+" : ""}{fmt(margin)}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: pos ? "linear-gradient(90deg,rgba(80,220,140,0.8),rgba(80,220,140,0.4))" : "linear-gradient(90deg,rgba(255,100,100,0.8),rgba(255,100,100,0.4))" }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </ChartPanel>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function FinancialPage() {
  const [tab, setTab] = useState<TabFilter>("overview");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense" | "pending" | "overdue">("all");
  const [testCategory, setTestCategory] = useState("");

  const month = currentMonth();
  const { data: summary } = useSummary(month);
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: patientsData } = usePatients();
  const patients = patientsData?.results ?? [];
  const { data: marginData = [], isLoading: loadingMargin } = usePatientMargin();
  const { data: scales = [] } = useScales();
  const { data: allProducts = [] } = useProducts();

  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const markPaid = useMarkPaid();

  const getUnitPrice = (testName: string) => {
    const p = allProducts.find((p) => p.test_name.toLowerCase() === testName.toLowerCase());
    return p ? String(p.unit_price ?? "0") : "0";
  };

  const totalMaterialCost = form.testRows.reduce((sum, row) => {
    const price = parseFloat(row.unit_price) || 0;
    const qty = parseInt(row.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const balance = Number(summary?.balance ?? 0);
  const avgMargin = marginData.length > 0
    ? marginData.reduce((s, m) => s + m.margin_pct, 0) / marginData.length
    : 0;

  const filtered = transactions.filter((t) => {
    if (txFilter === "income")  return t.type === "income";
    if (txFilter === "expense") return t.type === "expense";
    if (txFilter === "pending") return t.status === "pending";
    if (txFilter === "overdue") return t.status === "overdue";
    return true;
  });

  const handleCreate = async () => {
    if (!form.description || !form.amount || !form.due_date) return;
    await createTransaction.mutateAsync({
      type: form.type,
      description: form.description,
      amount: form.amount,
      due_date: form.due_date,
      patient: form.patient || undefined,
      insurance: form.insurance,
      payment_method: form.payment_method,
    } as Partial<Transaction>);

    // Create one expense transaction per test row with material cost
    for (const row of form.testRows) {
      const price = parseFloat(row.unit_price) || 0;
      const qty = parseInt(row.quantity) || 1;
      if (!row.test_name || price <= 0) continue;
      await createTransaction.mutateAsync({
        type: "expense",
        description: `Material: ${row.test_name} × ${qty} folha(s)`,
        amount: String((price * qty).toFixed(2)),
        due_date: form.due_date,
        patient: form.patient || undefined,
        insurance: form.insurance,
        status: "paid",
      } as Partial<Transaction>);
    }

    setForm(EMPTY_FORM);
    setTestCategory("");
    setShowForm(false);
  };

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>Financeiro</h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>
              {transactions.length} transação(ões) · {marginData.length} paciente(s) com movimentação
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> Nova Transação
          </Button>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <SummaryCard icon={<TrendingUp size={18} />} label="Receitas do Mês"
            value={fmt(summary?.income ?? 0)} iconBg="rgba(20,180,100,0.15)" iconColor="rgba(80,220,140,0.9)" border="rgba(20,180,100,0.2)" />
          <SummaryCard icon={<TrendingDown size={18} />} label="Despesas (Materiais)"
            value={fmt(summary?.expense ?? 0)} iconBg="rgba(220,50,50,0.12)" iconColor="rgba(255,110,110,0.9)" border="rgba(220,50,50,0.2)" />
          <SummaryCard icon={<DollarSign size={18} />} label="Saldo"
            value={fmt(balance)}
            iconBg={balance >= 0 ? "rgba(20,180,100,0.15)" : "rgba(220,50,50,0.12)"}
            iconColor={balance >= 0 ? "rgba(80,220,140,0.9)" : "rgba(255,110,110,0.9)"}
            border={balance >= 0 ? "rgba(20,180,100,0.2)" : "rgba(220,50,50,0.2)"}
            valueColor={balance >= 0 ? "rgba(80,220,140,1)" : "rgba(255,110,110,1)"} />
          <SummaryCard icon={<Sparkles size={18} />} label="Margem Média"
            value={`${avgMargin.toFixed(1)}%`}
            iconBg="rgba(130,60,255,0.15)" iconColor="rgba(180,120,255,0.9)" border="rgba(130,60,255,0.2)"
            valueColor="rgba(180,120,255,1)" />
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: "flex", gap: 4 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: tab === t.key ? "1px solid rgba(160,80,255,0.45)" : "1px solid rgba(120,80,255,0.15)",
                  background: tab === t.key ? "rgba(130,50,255,0.2)" : "transparent",
                  color: tab === t.key ? "rgba(220,190,255,0.95)" : "rgba(170,150,210,0.6)",
                  transition: "all 0.15s",
                }}>
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── VISÃO GERAL ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Area chart — full width */}
            <MonthlyAreaChart transactions={transactions} />

            {/* Second row: donut + top patients + margin bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <InsuranceDonut transactions={transactions} />
              <TopPatientsChart data={marginData} />
            </div>

            {/* Margin bar chart — only when data exists */}
            {marginData.length > 0 && <MarginBarChart data={marginData} />}
          </div>
        )}

        {/* ── TRANSAÇÕES ── */}
        {tab === "transactions" && (
          <>
            {/* Sub-filter */}
            <div style={{ display: "flex", gap: 4 }}>
              {([
                { key: "all",     label: "Todas" },
                { key: "income",  label: "Receitas" },
                { key: "expense", label: "Despesas" },
                { key: "pending", label: "Pendentes" },
                { key: "overdue", label: "Vencidas" },
              ] as const).map((f) => (
                <button key={f.key} onClick={() => setTxFilter(f.key)}
                  style={{
                    padding: "5px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: txFilter === f.key ? "1px solid rgba(160,80,255,0.4)" : "1px solid rgba(120,80,255,0.12)",
                    background: txFilter === f.key ? "rgba(130,50,255,0.15)" : "transparent",
                    color: txFilter === f.key ? "rgba(210,180,255,0.9)" : "rgba(160,140,200,0.5)",
                    transition: "all 0.13s",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.8)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(120,80,255,0.12)", background: "rgba(20,12,44,0.9)" }}>
                    {["Descrição", "Paciente", "Tipo", "Valor", "Vencimento", "Status", "Ações"].map((h) => (
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
                      <Receipt size={36} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
                      <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>Nenhuma transação encontrada.</p>
                    </td></tr>
                  )}
                  <AnimatePresence>
                    {filtered.map((t, i) => {
                      const sc = STATUS_CONFIG[t.status];
                      const tc = TYPE_CONFIG[t.type];
                      const StatusIcon = sc.icon;
                      return (
                        <motion.tr key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,60,255,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(225,215,255,0.9)", margin: 0 }}>{t.description}</p>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(190,175,230,0.65)" }}>
                            {t.patient_name || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: tc.color }}>{tc.label}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: t.type === "income" ? "rgba(80,220,140,0.9)" : "rgba(255,110,110,0.9)", fontFamily: "monospace" }}>
                            {fmt(t.amount)}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(180,160,220,0.5)" }}>
                            {t.due_date ? new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <StatusIcon size={12} style={{ color: sc.variant === "success" ? "rgba(80,210,130,0.9)" : sc.variant === "warning" ? "rgba(250,200,60,0.9)" : sc.variant === "danger" ? "rgba(255,110,110,0.9)" : "rgba(160,150,200,0.5)" }} />
                              <Badge label={sc.label} variant={sc.variant} />
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {(t.status === "pending" || t.status === "overdue") && (
                                <ActionBtn icon={<CheckCircle size={12} />} label="Pagar"
                                  color="rgba(80,220,140,0.9)" bg="rgba(20,180,100,0.1)" hoverBg="rgba(20,180,100,0.2)" border="rgba(20,180,100,0.25)"
                                  onClick={() => markPaid.mutate(t.id)} />
                              )}
                              <ActionBtn icon={<Trash2 size={12} />} label=""
                                color="rgba(255,100,100,0.9)" bg="rgba(220,50,50,0.08)" hoverBg="rgba(220,50,50,0.18)" border="rgba(220,50,50,0.22)"
                                onClick={() => setDeleteTarget(t)} />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          </>
        )}

        {/* ── POR PACIENTE ── */}
        {tab === "patients" && (
          <>
            {loadingMargin && (
              <p style={{ textAlign: "center", color: "rgba(160,140,210,0.4)", padding: "40px 0" }}>Carregando...</p>
            )}
            {!loadingMargin && marginData.length === 0 && (
              <EmptyState icon={<Users size={40} />} msg="Nenhum paciente com movimentação financeira." />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              <AnimatePresence>
                {marginData.map((m, i) => <PatientCard key={m.patient_id} m={m} i={i} />)}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Modal: nova transação */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }} title="Nova Transação" size="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Type toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["income", "expense"] as const).map((t) => (
              <button key={t} onClick={() => setForm({ ...form, type: t, testRows: [] })}
                style={{
                  padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  border: form.type === t
                    ? t === "income" ? "1.5px solid rgba(80,220,140,0.5)" : "1.5px solid rgba(255,100,100,0.5)"
                    : "1px solid rgba(120,80,255,0.15)",
                  background: form.type === t
                    ? t === "income" ? "rgba(20,180,100,0.12)" : "rgba(220,50,50,0.1)"
                    : "rgba(255,255,255,0.02)",
                  color: form.type === t
                    ? t === "income" ? "rgba(80,220,140,0.95)" : "rgba(255,110,110,0.95)"
                    : "rgba(160,140,200,0.5)",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                {t === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {t === "income" ? "Receita (Cobrança)" : "Despesa (Custo)"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Paciente">
              <Select
                value={form.patient}
                onChange={(v) => setForm({ ...form, patient: v })}
                placeholder="Selecione o paciente..."
                options={[
                  { value: "", label: "Nenhum / Geral" },
                  ...patients.map((p) => ({ value: p.id, label: p.full_name })),
                ]}
              />
            </Field>
            <Field label="Convênio / Plano">
              <Select
                value={form.insurance}
                onChange={(v) => setForm({ ...form, insurance: v })}
                placeholder="Selecione o convênio..."
                options={[{ value: "", label: "Sem convênio" }, ...INSURANCE_OPTIONS]}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <input placeholder="Ex: Avaliação neuropsicológica completa" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label={form.type === "income" ? "Valor Cobrado (R$)" : "Valor da Despesa (R$)"}>
              <input type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Vencimento">
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Forma de Pagamento">
              <Select
                value={form.payment_method}
                onChange={(v) => setForm({ ...form, payment_method: v })}
                placeholder="Selecione..."
                options={[
                  { value: "cash",          label: "Dinheiro" },
                  { value: "credit_card",   label: "Cartão de Crédito" },
                  { value: "debit_card",    label: "Cartão de Débito" },
                  { value: "pix",           label: "PIX",        color: "rgba(100,220,160,0.9)" },
                  { value: "bank_transfer", label: "Transferência" },
                  { value: "insurance",     label: "Convênio",   color: "rgba(160,120,255,0.9)" },
                ]}
              />
            </Field>
          </div>

          {/* ── Testes Aplicados (income only) ── */}
          {form.type === "income" && (
            <div style={{ borderRadius: 14, border: "1px solid rgba(130,80,255,0.2)", background: "rgba(130,60,255,0.05)", padding: "16px" }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "rgba(200,170,255,0.9)" }}>
                Testes Aplicados nesta Avaliação
              </p>

              {/* Step 1 — Category picker */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(160,130,220,0.5)" }}>
                  1. Selecione a categoria
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries({
                    intelligence: { label: "Inteligência",      color: "rgba(150,100,255,1)",  bg: "rgba(130,80,255,0.12)" },
                    memory:       { label: "Memória",            color: "rgba(80,180,255,1)",   bg: "rgba(60,160,255,0.10)" },
                    attention:    { label: "Atenção / FE",       color: "rgba(255,160,50,1)",   bg: "rgba(255,140,30,0.10)" },
                    development:  { label: "Desenv. / TDAH",     color: "rgba(80,220,150,1)",   bg: "rgba(60,200,130,0.10)" },
                    autism:       { label: "TEA / Neurodesenv.", color: "rgba(255,100,180,1)",  bg: "rgba(240,80,160,0.10)" },
                    personality:  { label: "Personalidade",      color: "rgba(255,200,60,1)",   bg: "rgba(240,180,40,0.10)" },
                    neuropsych:   { label: "Neuropsicológica",   color: "rgba(110,220,255,1)",  bg: "rgba(90,200,240,0.10)" },
                    other:        { label: "Outro",              color: "rgba(160,150,210,0.8)",bg: "rgba(130,120,200,0.09)" },
                  }).map(([key, meta]) => {
                    const isActive = testCategory === key;
                    const count = scales.filter((s) => s.category === key).length;
                    if (count === 0) return null;
                    return (
                      <motion.button key={key} type="button" whileTap={{ scale: 0.95 }}
                        onClick={() => setTestCategory(isActive ? "" : key)}
                        style={{
                          padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: isActive ? `1.5px solid ${meta.color.replace(/[\d.]+\)$/, "0.6)")}` : "1px solid rgba(120,80,255,0.18)",
                          background: isActive ? meta.bg : "rgba(255,255,255,0.02)",
                          color: isActive ? meta.color : "rgba(170,150,210,0.55)",
                          transition: "all 0.13s",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                        {meta.label}
                        <span style={{ fontSize: 10, opacity: 0.7 }}>({count})</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 — Test tiles for selected category */}
              <AnimatePresence>
                {testCategory && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(160,130,220,0.5)" }}>
                      2. Selecione os testes aplicados
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {scales.filter((s) => s.category === testCategory).map((s) => {
                        const key = s.abbreviation || s.name;
                        const alreadyAdded = form.testRows.some((r) => r.test_name === key);
                        return (
                          <motion.button key={s.id} type="button" whileTap={{ scale: 0.93 }}
                            onClick={() => {
                              if (alreadyAdded) return;
                              const unitPrice = getUnitPrice(key);
                              setForm({ ...form, testRows: [...form.testRows, { test_name: key, unit_price: unitPrice, quantity: "1" }] });
                            }}
                            style={{
                              padding: "7px 13px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: alreadyAdded ? "default" : "pointer",
                              border: alreadyAdded ? "1.5px solid rgba(80,220,140,0.5)" : "1px solid rgba(130,80,255,0.25)",
                              background: alreadyAdded ? "rgba(80,220,140,0.1)" : "rgba(130,60,255,0.08)",
                              color: alreadyAdded ? "rgba(80,220,140,0.9)" : "rgba(200,175,255,0.8)",
                              transition: "all 0.13s",
                              display: "flex", alignItems: "center", gap: 6,
                              opacity: alreadyAdded ? 0.7 : 1,
                            }}>
                            {alreadyAdded && <Check size={11} />}
                            {key}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 3 — Quantity / price rows for selected tests */}
              {form.testRows.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(130,80,255,0.15)", paddingTop: 12 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(160,130,220,0.5)" }}>
                    3. Ajuste quantidades e preços por folha
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <AnimatePresence>
                      {form.testRows.map((row, idx) => {
                        const subtotal = (parseFloat(row.unit_price) || 0) * (parseInt(row.quantity) || 0);
                        return (
                          <motion.div key={row.test_name + idx}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                            style={{ display: "grid", gridTemplateColumns: "1fr 140px 72px 90px 30px", gap: 8, alignItems: "center" }}>
                            {/* Test tag */}
                            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(130,60,255,0.1)", border: "1px solid rgba(130,60,255,0.22)", fontSize: 12, fontWeight: 700, color: "rgba(200,170,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {row.test_name}
                            </div>
                            {/* Unit price */}
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "rgba(160,130,200,0.5)", pointerEvents: "none" }}>R$/folha</span>
                              <input type="number" step="0.01" min="0" value={row.unit_price}
                                onChange={(e) => { const rows = [...form.testRows]; rows[idx] = { ...rows[idx], unit_price: e.target.value }; setForm({ ...form, testRows: rows }); }}
                                style={{ ...inputStyle, paddingLeft: 44, fontSize: 12 }} />
                            </div>
                            {/* Qty */}
                            <input type="number" min="1" placeholder="Qtd" value={row.quantity}
                              onChange={(e) => { const rows = [...form.testRows]; rows[idx] = { ...rows[idx], quantity: e.target.value }; setForm({ ...form, testRows: rows }); }}
                              style={{ ...inputStyle, fontSize: 12, textAlign: "center" }} />
                            {/* Subtotal */}
                            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,110,110,0.85)", fontFamily: "monospace", textAlign: "right" }}>
                              {subtotal > 0 ? `−${fmt(subtotal)}` : "—"}
                            </span>
                            {/* Remove */}
                            <button type="button" onClick={() => { const rows = form.testRows.filter((_, i) => i !== idx); setForm({ ...form, testRows: rows }); }}
                              style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(220,50,50,0.22)", background: "rgba(220,50,50,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,100,100,0.8)" }}>
                              <Trash2 size={11} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Totals row */}
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "rgba(160,130,220,0.5)" }}>Custo materiais: </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,110,110,0.9)", fontFamily: "monospace" }}>−{fmt(totalMaterialCost)}</span>
                    </div>
                    {form.amount && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: "rgba(160,130,220,0.5)" }}>Margem: </span>
                        <span style={{
                          fontSize: 14, fontWeight: 800, fontFamily: "monospace",
                          color: (parseFloat(form.amount) - totalMaterialCost) >= 0 ? "rgba(80,220,140,1)" : "rgba(255,100,100,1)",
                        }}>
                          {fmt(parseFloat(form.amount) - totalMaterialCost)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!testCategory && form.testRows.length === 0 && (
                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(150,130,200,0.35)", padding: "6px 0 2px", margin: 0 }}>
                  Selecione uma categoria acima para ver os testes disponíveis.
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button loading={createTransaction.isPending} onClick={handleCreate}
              disabled={!form.description || !form.amount || !form.due_date}>
              Salvar{form.testRows.length > 0 ? ` + ${form.testRows.length} despesa(s)` : ""}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: confirmar exclusão */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Transação" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir a transação <strong style={{ color: "rgba(235,225,255,0.95)" }}>"{deleteTarget?.description}"</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteTransaction.isPending}
              onClick={() => deleteTransaction.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ color: "rgba(130,80,255,0.2)", display: "flex", justifyContent: "center", marginBottom: 12 }}>{icon}</div>
      <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>{msg}</p>
    </div>
  );
}

function SummaryCard({ icon, label, value, iconBg, iconColor, border, valueColor }: {
  icon: React.ReactNode; label: string; value: string;
  iconBg: string; iconColor: string; border: string; valueColor?: string;
}) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: "rgba(12,8,28,0.8)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(160,130,220,0.55)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: valueColor ?? "rgba(235,225,255,0.96)", margin: "3px 0 0", fontFamily: "monospace" }}>{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(160,130,220,0.6)" }}>{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({ icon, label, color, bg, hoverBg, border, onClick }: {
  icon: React.ReactNode; label: string; color: string; bg: string; hoverBg: string; border: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: label ? 5 : 0, padding: label ? "5px 11px" : "5px 8px", borderRadius: 8, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}>
      {icon}{label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(120,80,255,0.22)",
  background: "rgba(8,5,22,0.75)", color: "rgba(225,215,255,0.9)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
