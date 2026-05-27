import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const maxWidths = { sm: 440, md: 580, lg: 800 };

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  /* Fecha com Esc */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(2,1,10,0.82)",
              backdropFilter: "blur(12px)",
            }}
          />

          {/* Painel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: maxWidths[size],
              maxHeight: "92vh",
              borderRadius: 22,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(160deg, rgba(22,14,50,0.99) 0%, rgba(10,7,26,0.99) 100%)",
              border: "1px solid rgba(140,80,255,0.2)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(180,100,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Glow decorativo no topo */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(180,100,255,0.6), transparent)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", top: 0, left: "30%", right: "30%", height: 60,
              background: "radial-gradient(ellipse at 50% 0%, rgba(160,80,255,0.12), transparent)",
              pointerEvents: "none",
            }} />

            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 18px",
              borderBottom: "1px solid rgba(140,80,255,0.1)",
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "rgba(235,225,255,0.97)",
                  margin: 0,
                  letterSpacing: "-0.2px",
                }}>
                  {title}
                </h3>
                <div style={{
                  marginTop: 3,
                  width: 32,
                  height: 2,
                  borderRadius: 99,
                  background: "linear-gradient(90deg, rgba(160,80,255,0.8), rgba(100,60,220,0.3))",
                }} />
              </div>

              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32,
                  borderRadius: 10,
                  border: "1px solid rgba(140,80,255,0.18)",
                  background: "rgba(140,80,255,0.07)",
                  color: "rgba(180,155,230,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(220,50,50,0.14)";
                  el.style.borderColor = "rgba(220,50,50,0.3)";
                  el.style.color = "rgba(255,110,110,0.95)";
                  el.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(140,80,255,0.07)";
                  el.style.borderColor = "rgba(140,80,255,0.18)";
                  el.style.color = "rgba(180,155,230,0.55)";
                  el.style.transform = "scale(1)";
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div style={{
              padding: "22px 24px 24px",
              overflowY: "auto",
              flex: 1,
            }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
