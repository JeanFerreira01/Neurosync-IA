interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #a020f0 0%, #6040e0 100%)",
    color: "#ffffff",
    border: "1px solid rgba(180,80,255,0.35)",
    boxShadow: "0 2px 12px rgba(140,50,220,0.35)",
  },
  secondary: {
    background: "rgba(255,255,255,0.06)",
    color: "rgba(220,210,255,0.85)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  ghost: {
    background: "transparent",
    color: "rgba(200,190,240,0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  danger: {
    background: "rgba(200,40,40,0.15)",
    color: "rgba(255,110,110,0.95)",
    border: "1px solid rgba(220,50,50,0.3)",
  },
};

const hoverStyles: Record<string, React.CSSProperties> = {
  primary: { opacity: 0.88, boxShadow: "0 4px 20px rgba(140,50,220,0.5)" },
  secondary: { background: "rgba(255,255,255,0.1)" },
  ghost: { background: "rgba(255,255,255,0.06)", color: "rgba(230,220,255,0.95)" },
  danger: { background: "rgba(200,40,40,0.25)", color: "rgba(255,130,130,0.98)" },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: 13, borderRadius: 10 },
  md: { padding: "8px 16px", fontSize: 13, borderRadius: 11 },
  lg: { padding: "11px 22px", fontSize: 15, borderRadius: 13 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  style,
  children,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all 0.18s ease",
    outline: "none",
    whiteSpace: "nowrap",
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      disabled={disabled || loading}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign((e.currentTarget as HTMLElement).style, hoverStyles[variant]);
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign((e.currentTarget as HTMLElement).style, variantStyles[variant], sizeStyles[size]);
        }
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: 14, height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}
