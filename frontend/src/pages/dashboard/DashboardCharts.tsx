import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

/* ── Tooltip customizado ── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(14,10,32,0.97)",
      border: "1px solid rgba(160,80,255,0.25)",
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      fontSize: 12,
    }}>
      {label && <p style={{ color: "rgba(200,180,255,0.6)", marginBottom: 6 }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0", fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Dados mock — serão substituídos pela API ── */
const weekData = [
  { dia: "Seg", consultas: 4, laudos: 2 },
  { dia: "Ter", consultas: 7, laudos: 3 },
  { dia: "Qua", consultas: 5, laudos: 1 },
  { dia: "Qui", consultas: 9, laudos: 5 },
  { dia: "Sex", consultas: 6, laudos: 4 },
  { dia: "Sáb", consultas: 2, laudos: 1 },
  { dia: "Dom", consultas: 0, laudos: 0 },
];

const statusData = [
  { name: "Finalizados", value: 42, fill: "rgba(80,220,140,0.9)" },
  { name: "Confirmados", value: 28, fill: "rgba(140,100,255,0.9)" },
  { name: "Pendentes",   value: 18, fill: "rgba(255,200,60,0.9)" },
  { name: "Cancelados",  value: 12, fill: "rgba(255,90,90,0.9)" },
];

const monthlyData = [
  { mes: "Jan", pacientes: 8 },
  { mes: "Fev", pacientes: 14 },
  { mes: "Mar", pacientes: 11 },
  { mes: "Abr", pacientes: 19 },
  { mes: "Mai", pacientes: 23 },
  { mes: "Jun", pacientes: 17 },
];

/* ── Wrapper de card para gráfico ── */
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 20,
      background: "rgba(18,12,42,0.75)",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(225,215,255,0.9)", margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: "rgba(180,160,220,0.45)", margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "16px 8px 12px" }}>{children}</div>
    </div>
  );
}

/* ── Gráfico 1: Consultas da semana (AreaChart) ── */
export function WeeklyChart() {
  return (
    <ChartCard title="Consultas da Semana" subtitle="Consultas e laudos por dia">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={weekData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradConsultas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(160,80,255,0.6)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgba(160,80,255,0.0)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLaudos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(60,160,255,0.6)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgba(60,160,255,0.0)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: "rgba(180,160,220,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(180,160,220,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="consultas" name="Consultas" stroke="rgba(180,100,255,0.9)" strokeWidth={2} fill="url(#gradConsultas)" dot={false} activeDot={{ r: 5, fill: "rgba(200,140,255,1)", stroke: "none" }} />
          <Area type="monotone" dataKey="laudos" name="Laudos" stroke="rgba(80,170,255,0.9)" strokeWidth={2} fill="url(#gradLaudos)" dot={false} activeDot={{ r: 5, fill: "rgba(100,190,255,1)", stroke: "none" }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Gráfico 2: Status (PieChart donut) ── */
export function StatusChart() {
  const total = statusData.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Status das Consultas" subtitle="Distribuição do mês atual">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {statusData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {statusData.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, flexShrink: 0, boxShadow: `0 0 6px ${d.fill}` }} />
              <span style={{ fontSize: 12, color: "rgba(200,190,230,0.75)", flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.fill }}>{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

/* ── Gráfico 3: Novos pacientes por mês (BarChart) ── */
export function PatientsChart() {
  return (
    <ChartCard title="Novos Pacientes" subtitle="Últimos 6 meses">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={monthlyData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }} barCategoryGap="35%">
          <defs>
            <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(160,80,255,0.9)" />
              <stop offset="100%" stopColor="rgba(80,40,180,0.5)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: "rgba(180,160,220,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(180,160,220,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pacientes" name="Pacientes" fill="url(#gradBar)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Gráfico 4: Radial de desempenho ── */
const radialData = [
  { name: "Laudos",    value: 78, fill: "rgba(160,80,255,0.9)" },
  { name: "Agenda",   value: 92, fill: "rgba(60,200,255,0.9)" },
  { name: "Estoque",  value: 55, fill: "rgba(255,180,50,0.9)" },
];

export function PerformanceChart() {
  return (
    <ChartCard title="Indicadores" subtitle="Desempenho operacional (%)">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 8px" }}>
        {radialData.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(200,190,230,0.7)", width: 54, flexShrink: 0 }}>{d.name}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${d.value}%`,
                borderRadius: 99,
                background: d.fill,
                boxShadow: `0 0 8px ${d.fill}`,
                transition: "width 1s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.fill, width: 32, textAlign: "right" }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
