import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, KeyRound, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";

const roleLabel: Record<string, string> = {
  admin_master: "Admin Master",
  clinic_admin: "Admin da Clínica",
  neuropsychologist: "Neuropsicólogo",
  receptionist: "Recepção",
  patient: "Paciente",
};

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const fullName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "Usuário";

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, []);

  const handleToggle = () => {
    calcPos();
    setOpen((v) => !v);
  };

  /* Fecha ao clicar fora ou pressionar Esc */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Fecha e recalcula posição ao rolar ou redimensionar */
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="user-menu-dropdown"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            width: 268,
            zIndex: 99999,
            borderRadius: 18,
            overflow: "hidden",
            background: "rgb(13, 9, 30)",
            border: "1px solid rgba(160,80,255,0.2)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(100,40,180,0.15)",
            pointerEvents: "auto",
          }}
          /* impede que cliques dentro fechem o menu */
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ── Cabeçalho ── */}
          <div
            style={{
              padding: "18px 16px 14px",
              background:
                "linear-gradient(135deg, rgba(90,30,160,0.35) 0%, rgba(25,12,55,0.5) 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={fullName} avatarUrl={user?.avatar} size="lg" editable />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(235,225,255,0.97)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fullName}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(180,160,220,0.5)",
                    margin: "3px 0 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.email || "—"}
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: 7,
                    padding: "2px 9px",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    background: "rgba(140,50,240,0.2)",
                    color: "rgba(210,150,255,0.95)",
                    border: "1px solid rgba(140,50,240,0.3)",
                  }}
                >
                  {roleLabel[user?.role ?? ""] ?? user?.role}
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "rgba(180,160,220,0.35)",
                margin: "12px 0 0",
              }}
            >
              Clique na foto para alterar
            </p>
          </div>

          {/* ── Itens ── */}
          <div style={{ padding: "8px 8px 10px" }}>
            <DropItem icon={User} label="Meu perfil" onClick={() => setOpen(false)} />
            <DropItem icon={KeyRound} label="Alterar senha" onClick={() => setOpen(false)} />
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.05)",
                margin: "6px 8px",
              }}
            />
            <DropItem icon={LogOut} label="Sair da plataforma" onClick={logout} danger />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px 6px 8px",
          borderRadius: 12,
          border: open
            ? "1px solid rgba(160,80,255,0.25)"
            : "1px solid rgba(255,255,255,0.06)",
          background: open ? "rgba(140,60,255,0.1)" : "rgba(255,255,255,0.03)",
          cursor: "pointer",
          transition: "all 0.18s",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
            (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.06)";
          }
        }}
      >
        <Avatar name={fullName} avatarUrl={user?.avatar} size="sm" />
        <div style={{ textAlign: "left" }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(230,220,255,0.95)",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {fullName}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(180,160,220,0.5)",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {roleLabel[user?.role ?? ""] ?? user?.role}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", color: "rgba(180,160,220,0.4)", marginLeft: 2 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Portal → renderiza direto no body, zero impacto no layout */}
      {createPortal(dropdown, document.body)}
    </>
  );
}

function DropItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const color = danger ? "rgba(255,90,90,0.7)" : "rgba(205,195,235,0.75)";
  const hColor = danger ? "rgba(255,120,120,0.98)" : "rgba(235,228,255,0.97)";
  const hBg = danger ? "rgba(220,40,40,0.1)" : "rgba(255,255,255,0.05)";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 11,
        fontSize: 13,
        fontWeight: 500,
        color,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "all 0.14s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = hBg;
        (e.currentTarget as HTMLElement).style.color = hColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = color;
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
