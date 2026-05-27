import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 13px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(225,215,255,0.95)",
  fontSize: 13,
  outline: "none",
  transition: "border 0.15s, box-shadow 0.15s",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, onFocus, onBlur, ...props }, ref) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(200,185,240,0.75)" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          ...inputStyle,
          border: error ? "1px solid rgba(220,60,60,0.5)" : "1px solid rgba(255,255,255,0.09)",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(160,60,255,0.55)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(140,50,220,0.15)";
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? "1px solid rgba(220,60,60,0.5)" : "1px solid rgba(255,255,255,0.09)";
          e.currentTarget.style.boxShadow = "none";
          onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p style={{ fontSize: 12, color: "rgba(255,100,100,0.85)" }}>{error}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";
