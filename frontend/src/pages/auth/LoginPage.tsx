import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, EyeOff, Brain, ShieldCheck, CalendarDays, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

/* ── SVG Illustration: neural network ── */
function NeuralIllustration() {
  const nodes = [
    { cx: 220, cy: 120, r: 8 }, { cx: 340, cy: 80, r: 6 }, { cx: 400, cy: 160, r: 10 },
    { cx: 160, cy: 200, r: 7 }, { cx: 300, cy: 230, r: 9 }, { cx: 440, cy: 260, r: 6 },
    { cx: 120, cy: 300, r: 8 }, { cx: 260, cy: 340, r: 7 }, { cx: 380, cy: 350, r: 10 },
    { cx: 200, cy: 420, cy2: 420, r: 6 }, { cx: 320, cy: 420, r: 8 }, { cx: 460, cy: 380, r: 6 },
    { cx: 140, cy: 380, r: 5 }, { cx: 480, cy: 150, r: 7 }, { cx: 500, cy: 320, r: 5 },
  ];
  const edges = [
    [0,1],[0,3],[0,4],[1,2],[1,4],[2,5],[2,13],[3,6],[3,4],[4,5],[4,7],[4,8],
    [5,11],[5,14],[6,12],[6,7],[7,8],[7,10],[8,11],[8,9],[9,10],[10,11],[11,14],[12,9],[13,14],
  ];

  return (
    <svg viewBox="60 50 480 420" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="nodeGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(200,120,255,1)" />
          <stop offset="100%" stopColor="rgba(100,60,220,0.8)" />
        </radialGradient>
        <radialGradient id="nodeCoreGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,200,255,1)" />
          <stop offset="100%" stopColor="rgba(180,80,255,0.9)" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        if (!na || !nb) return null;
        return (
          <line key={i} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
            stroke="rgba(160,80,255,0.18)" strokeWidth={1.2}
          />
        );
      })}

      {/* Animated pulse edges */}
      {[[0,4],[4,8],[8,10],[3,7],[1,2]].map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        if (!na || !nb) return null;
        return (
          <line key={`p${i}`} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
            stroke="rgba(200,120,255,0.5)" strokeWidth={1.5}
          >
            <animate attributeName="stroke-opacity" values="0.1;0.6;0.1" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Nodes: outer glow ring */}
      {nodes.map((n, i) => (
        <circle key={`g${i}`} cx={n.cx} cy={n.cy} r={n.r + 5}
          fill="none" stroke="rgba(180,80,255,0.15)" strokeWidth={1}>
          <animate attributeName="r" values={`${n.r + 4};${n.r + 8};${n.r + 4}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.3;0.08;0.3" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Nodes: filled */}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.cx} cy={n.cy} r={n.r} fill="url(#nodeGrad)" filter="url(#glow)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur={`${2 + i * 0.25}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Nodes: inner dot */}
      {nodes.map((n, i) => (
        <circle key={`d${i}`} cx={n.cx} cy={n.cy} r={n.r * 0.4} fill="rgba(255,240,255,0.9)" />
      ))}

      {/* Central brain silhouette */}
      <ellipse cx="310" cy="250" rx="65" ry="55" fill="none" stroke="rgba(180,80,255,0.08)" strokeWidth={2} />
      <ellipse cx="310" cy="250" rx="45" ry="38" fill="rgba(160,60,255,0.04)" stroke="rgba(180,80,255,0.06)" strokeWidth={1} />

      {/* Floating data points */}
      {[{x:170,y:155},{x:450,y:200},{x:240,y:470},{x:420,y:440}].map((p, i) => (
        <circle key={`f${i}`} cx={p.x} cy={p.y} r={3} fill="rgba(100,200,255,0.6)">
          <animate attributeName="cy" values={`${p.y};${p.y - 8};${p.y}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const features = [
  { icon: Brain, text: "Testes neuropsicológicos integrados" },
  { icon: CalendarDays, text: "Agenda inteligente com lembretes" },
  { icon: ShieldCheck, text: "Prontuário eletrônico seguro" },
  { icon: BarChart3, text: "Relatórios e laudos automáticos" },
];

/* ── Input com focus ── */
function AuthInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,180,240,0.7)", letterSpacing: "0.04em" }}>
        {label}
      </label>
      <input
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 11,
          border: "1px solid rgba(120,80,255,0.25)",
          background: "rgba(8,5,22,0.7)",
          color: "rgba(230,220,255,0.95)", fontSize: 13,
          outline: "none", transition: "border 0.15s, box-shadow 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(130,50,220,0.18)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
        {...props}
      />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Login state */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* Register state */
  const [reg, setReg] = useState({
    first_name: "", last_name: "", username: "", email: "", password: "", confirm: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (reg.password !== reg.confirm) { setError("As senhas não coincidem."); return; }
    if (reg.password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    setLoading(true);
    try {
      await api.post("/auth/register/", {
        first_name: reg.first_name,
        last_name: reg.last_name,
        username: reg.username,
        email: reg.email,
        password: reg.password,
        password_confirm: reg.confirm,
        role: "neuropsychologist",
      });
      setSuccess("Conta criada com sucesso! Faça login para entrar.");
      setTab("login");
      setUsername(reg.username);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const first = Object.values(data).flat()[0];
        setError(first ?? "Erro ao criar conta.");
      } else {
        setError("Erro de conexão. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "rgb(6,4,16)", overflow: "hidden" }}>

      {/* ── Painel esquerdo: ilustração ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          flex: "1 1 0", display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden", minWidth: 0,
        }}
        className="hidden lg:flex"
      >
        {/* Gradientes de fundo */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(40,10,80,0.95) 0%, rgba(10,6,28,0.98) 100%)" }} />
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(160,60,255,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(circle, rgba(60,100,255,0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />

        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.025,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }} />

        {/* Neural illustration */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
          <NeuralIllustration />
        </div>

        {/* Content overlay */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "48px 52px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #c840ff 0%, #6040ff 100%)",
              boxShadow: "0 0 24px rgba(180,60,255,0.5)",
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "rgba(235,225,255,0.98)", margin: 0 }}>NeuroSync AI</p>
              <p style={{ fontSize: 10, color: "rgba(200,160,255,0.5)", margin: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>Platform</p>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ marginTop: "auto", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "rgba(235,225,255,0.97)", margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              A clínica do futuro,<br />
              <span style={{ background: "linear-gradient(135deg, #d060ff, #6080ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                começa aqui.
              </span>
            </h2>
            <p style={{ fontSize: 14, color: "rgba(190,170,230,0.55)", margin: "0 0 32px", lineHeight: 1.7 }}>
              Plataforma SaaS completa para clínicas de neuropsicologia.<br />
              Laudos, agenda, financeiro e muito mais.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {features.map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: "rgba(140,60,255,0.15)", border: "1px solid rgba(140,60,255,0.22)",
                  }}>
                    <Icon size={15} color="rgba(200,130,255,0.9)" />
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(200,185,235,0.7)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "rgba(180,160,220,0.25)" }}>
            © {new Date().getFullYear()} NeuroSync AI · Todos os direitos reservados
          </p>
        </div>
      </motion.div>

      {/* ── Painel direito: formulário ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%", maxWidth: 480, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", position: "relative",
          background: "rgba(10,7,24,0.98)",
          borderLeft: "1px solid rgba(120,60,255,0.12)",
          overflowY: "auto",
        }}
      >
        {/* bg glow */}
        <div style={{ position: "absolute", top: "10%", right: "-20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,40,220,0.15) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }} className="lg:hidden">
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #c840ff, #6040ff)", boxShadow: "0 0 20px rgba(180,60,255,0.4)" }}>
              <Zap size={16} color="#fff" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "rgba(235,225,255,0.98)", margin: 0 }}>NeuroSync AI</p>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: "flex", borderRadius: 12, padding: 4,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(120,80,255,0.15)",
            marginBottom: 28,
          }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: tab === t ? "linear-gradient(135deg, rgba(160,60,255,0.35), rgba(100,60,220,0.25))" : "transparent",
                  color: tab === t ? "rgba(225,200,255,0.96)" : "rgba(170,150,210,0.5)",
                  boxShadow: tab === t ? "0 2px 12px rgba(140,40,255,0.2)" : "none",
                }}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.97)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              {tab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: 0 }}>
              {tab === "login"
                ? "Acesse sua área de trabalho clínica."
                : "Conta de neuropsicólogo — acesso imediato."}
            </p>
          </div>

          {/* Success banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 11, marginBottom: 16, background: "rgba(50,180,100,0.1)", border: "1px solid rgba(50,200,100,0.25)", color: "rgba(100,220,140,0.95)", fontSize: 13 }}
              >
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ── LOGIN FORM ── */}
            {tab === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <AuthInput label="Usuário" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu.usuario" required autoComplete="username" />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,180,240,0.7)", letterSpacing: "0.04em" }}>Senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ width: "100%", padding: "11px 42px 11px 14px", borderRadius: 11, border: "1px solid rgba(120,80,255,0.25)", background: "rgba(8,5,22,0.7)", color: "rgba(230,220,255,0.95)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border 0.15s, box-shadow 0.15s" }}
                      onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(160,80,255,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(130,50,220,0.18)"; }}
                      onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(120,80,255,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(180,160,220,0.45)", padding: 2 }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && <ErrorBox>{error}</ErrorBox>}

                <SubmitButton loading={loading}>
                  Entrar na plataforma <ArrowRight size={15} />
                </SubmitButton>

                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(170,150,210,0.45)", marginTop: 4 }}>
                  Não tem conta?{" "}
                  <button type="button" onClick={() => { setTab("register"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(190,130,255,0.8)", fontWeight: 600, fontSize: 12, padding: 0 }}>
                    Criar agora
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── REGISTER FORM ── */}
            {tab === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleRegister}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <AuthInput label="Nome" value={reg.first_name} onChange={(e) => setReg((r) => ({ ...r, first_name: e.target.value }))} placeholder="João" required />
                  <AuthInput label="Sobrenome" value={reg.last_name} onChange={(e) => setReg((r) => ({ ...r, last_name: e.target.value }))} placeholder="Silva" />
                </div>
                <AuthInput label="Usuário *" value={reg.username} onChange={(e) => setReg((r) => ({ ...r, username: e.target.value }))} placeholder="joao.silva" required autoComplete="username" />
                <AuthInput label="E-mail *" type="email" value={reg.email} onChange={(e) => setReg((r) => ({ ...r, email: e.target.value }))} placeholder="joao@clinica.com" required />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <AuthInput label="Senha *" type="password" value={reg.password} onChange={(e) => setReg((r) => ({ ...r, password: e.target.value }))} placeholder="••••••••" required autoComplete="new-password" />
                  <AuthInput label="Confirmar senha *" type="password" value={reg.confirm} onChange={(e) => setReg((r) => ({ ...r, confirm: e.target.value }))} placeholder="••••••••" required autoComplete="new-password" />
                </div>

                {/* Role badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(100,60,255,0.08)", border: "1px solid rgba(120,60,255,0.18)" }}>
                  <Brain size={14} color="rgba(190,130,255,0.8)" />
                  <span style={{ fontSize: 12, color: "rgba(190,165,240,0.75)" }}>
                    Conta criada com perfil de <strong style={{ color: "rgba(210,160,255,0.9)" }}>Neuropsicólogo</strong>
                  </span>
                </div>

                {error && <ErrorBox>{error}</ErrorBox>}

                <SubmitButton loading={loading}>
                  Criar minha conta <ArrowRight size={15} />
                </SubmitButton>

                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(170,150,210,0.45)" }}>
                  Já tem conta?{" "}
                  <button type="button" onClick={() => { setTab("login"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(190,130,255,0.8)", fontWeight: 600, fontSize: 12, padding: 0 }}>
                    Entrar
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Helpers ── */
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.25)", color: "rgba(255,120,120,0.95)", fontSize: 13 }}
    >
      {children}
    </motion.div>
  );
}

function SubmitButton({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer", border: "1px solid rgba(180,80,255,0.3)",
        background: loading ? "rgba(80,40,140,0.5)" : "linear-gradient(135deg, #a020f0 0%, #5040e0 100%)",
        color: "rgba(255,255,255,0.95)",
        boxShadow: loading ? "none" : "0 0 24px rgba(150,40,240,0.35), 0 4px 16px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "opacity 0.2s, box-shadow 0.2s",
        marginTop: 4,
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px rgba(160,50,255,0.5), 0 6px 20px rgba(0,0,0,0.4)"; }}
      onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(150,40,240,0.35), 0 4px 16px rgba(0,0,0,0.3)"; }}
    >
      {loading ? (
        <>
          <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
          Aguarde...
        </>
      ) : children}
    </button>
  );
}
