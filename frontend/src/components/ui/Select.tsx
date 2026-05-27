import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  disabled,
  searchable,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  // Auto-enable search when there are many options
  const showSearch = searchable !== false && options.length > 6;

  const filtered = showSearch && query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.description?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchRef.current?.focus(), 60);
    }
    if (!open) setQuery("");
  }, [open, showSearch]);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        whileTap={{ scale: 0.99 }}
        style={{
          width: "100%",
          padding: "9px 38px 9px 12px",
          borderRadius: 10,
          border: open
            ? "1px solid rgba(150,80,255,0.55)"
            : "1px solid rgba(120,80,255,0.22)",
          background: open
            ? "rgba(120,60,255,0.1)"
            : "rgba(8,5,22,0.75)",
          color: selected
            ? (selected.color ?? "rgba(225,215,255,0.9)")
            : "rgba(160,130,200,0.45)",
          fontSize: 13,
          fontWeight: selected ? 600 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          outline: "none",
          transition: "border-color 0.15s, background 0.15s",
          boxShadow: open ? "0 0 0 3px rgba(130,60,255,0.12)" : "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          boxSizing: "border-box",
        }}
      >
        {selected?.icon && <span style={{ flexShrink: 0 }}>{selected.icon}</span>}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(0deg)", color: "rgba(160,120,255,0.6)", display: "flex", pointerEvents: "none" }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 9999,
              borderRadius: 12,
              border: "1px solid rgba(130,60,255,0.35)",
              background: "rgba(14,8,34,0.97)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(120,60,255,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
              overflow: "hidden",
              transformOrigin: "top center",
            }}
          >
            {/* Search input */}
            {showSearch && (
              <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid rgba(130,60,255,0.15)" }}>
                <div style={{ position: "relative" }}>
                  <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(160,120,255,0.5)", pointerEvents: "none" }} />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Pesquisar..."
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      padding: "7px 10px 7px 28px",
                      borderRadius: 8,
                      border: "1px solid rgba(130,60,255,0.25)",
                      background: "rgba(130,60,255,0.08)",
                      color: "rgba(225,215,255,0.9)",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div style={{ padding: 5, maxHeight: 260, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(150,130,200,0.4)", padding: "14px 0", margin: 0 }}>
                  Nenhuma opção encontrada
                </p>
              )}
              {filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: isSelected ? "rgba(130,60,255,0.18)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(130,60,255,0.09)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    {opt.icon && <span style={{ flexShrink: 0, color: opt.color ?? "rgba(180,140,255,0.7)" }}>{opt.icon}</span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected
                          ? (opt.color ?? "rgba(220,190,255,0.97)")
                          : (opt.color ?? "rgba(210,195,255,0.8)"),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(150,130,200,0.5)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opt.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={13} style={{ color: "rgba(180,120,255,0.9)", flexShrink: 0 }} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
