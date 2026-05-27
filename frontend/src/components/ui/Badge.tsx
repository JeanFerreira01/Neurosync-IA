interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}

const styles: Record<string, React.CSSProperties> = {
  default: { background: "rgba(140,60,255,0.18)", color: "rgba(210,160,255,0.95)", border: "1px solid rgba(140,60,255,0.28)" },
  success: { background: "rgba(20,180,100,0.15)", color: "rgba(80,220,140,0.95)", border: "1px solid rgba(20,180,100,0.25)" },
  warning: { background: "rgba(240,180,30,0.14)", color: "rgba(255,210,80,0.95)", border: "1px solid rgba(240,180,30,0.25)" },
  danger:  { background: "rgba(220,50,50,0.14)", color: "rgba(255,110,110,0.95)", border: "1px solid rgba(220,50,50,0.25)" },
  info:    { background: "rgba(40,140,255,0.14)", color: "rgba(110,180,255,0.95)", border: "1px solid rgba(40,140,255,0.25)" },
  muted:   { background: "rgba(255,255,255,0.06)", color: "rgba(180,170,210,0.7)", border: "1px solid rgba(255,255,255,0.08)" },
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 9px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.02em",
      ...styles[variant],
    }}>
      {label}
    </span>
  );
}
