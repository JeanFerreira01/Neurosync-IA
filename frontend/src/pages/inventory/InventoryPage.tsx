import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, AlertTriangle, DollarSign, Plus, Trash2,
  ArrowUpDown, History, ShoppingCart, Check, ChevronDown, Edit2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  useProducts, useAlerts, useProductMovements,
  useCreateProduct, useDeleteProduct, useCreateMovement,
} from "@/hooks/useInventory";
import { useScales, useDeleteScale } from "@/hooks/useNeurotests";
import type { Product, NeurotestScale, StockMovementType } from "@/types";

const CATEGORY_OPTIONS = [
  "Protocolo", "Caderno de Resposta", "Folha de Registro",
  "Livro de Estímulos", "Kit Completo", "Software / Licença", "Outro",
];

const NEURO_CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  intelligence: { label: "Inteligência",      color: "rgba(150,100,255,1)",   bg: "rgba(130,80,255,0.12)"  },
  memory:       { label: "Memória",            color: "rgba(80,180,255,1)",    bg: "rgba(60,160,255,0.10)"  },
  attention:    { label: "Atenção / FE",       color: "rgba(255,160,50,1)",    bg: "rgba(255,140,30,0.10)"  },
  development:  { label: "Desenv. / TDAH",     color: "rgba(80,220,150,1)",    bg: "rgba(60,200,130,0.10)"  },
  autism:       { label: "TEA / Neurodesenv.", color: "rgba(255,100,180,1)",   bg: "rgba(240,80,160,0.10)"  },
  personality:  { label: "Personalidade",      color: "rgba(255,200,60,1)",    bg: "rgba(240,180,40,0.10)"  },
  neuropsych:   { label: "Neuropsicológica",   color: "rgba(110,220,255,1)",   bg: "rgba(90,200,240,0.10)"  },
  other:        { label: "Outro",              color: "rgba(160,150,210,0.8)", bg: "rgba(130,120,200,0.09)" },
};

const MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: "entry",      label: "Entrada"          },
  { value: "exit",       label: "Saída"             },
  { value: "adjustment", label: "Ajuste"            },
  { value: "loss",       label: "Perda"             },
  { value: "internal",   label: "Consumo Interno"   },
];

const EMPTY_PRODUCT  = { name: "", test_name: "", category: "", quantity: "", min_quantity: "", unit_price: "", supplier: "", expiry_date: "" };
const EMPTY_MOVEMENT = { type: "entry" as StockMovementType, quantity: "", notes: "" };

function fmt(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function stockColor(p: Product) {
  if (p.quantity === 0) return "rgba(255,110,110,0.9)";
  if (p.is_low_stock)  return "rgba(255,210,80,0.9)";
  return "rgba(80,220,140,0.9)";
}
function stockBadge(p: Product): { label: string; variant: "success" | "warning" | "danger" } {
  if (p.quantity === 0) return { label: "Zerado", variant: "danger"  };
  if (p.is_low_stock)  return { label: "Baixo",  variant: "warning" };
  return                      { label: "Normal", variant: "success" };
}

// Resolve the neuro category for a product via its test_name
function resolveCategory(p: Product, scales: NeurotestScale[]) {
  if (!p.test_name) return null;
  return scales.find((s) => (s.abbreviation || s.name).toLowerCase() === p.test_name.toLowerCase()) ?? null;
}

export default function InventoryPage() {
  const navigate = useNavigate();

  const [showProductForm, setShowProductForm]     = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState<Product | null>(null);
  const [deleteScaleTarget, setDeleteScaleTarget] = useState<NeurotestScale | null>(null);
  const [movementTarget, setMovementTarget]       = useState<Product | null>(null);
  const [historyTarget, setHistoryTarget]         = useState<Product | null>(null);
  const [productForm, setProductForm]             = useState(EMPTY_PRODUCT);
  const [movementForm, setMovementForm]           = useState(EMPTY_MOVEMENT);
  const [filterCat, setFilterCat]                 = useState("");
  const [collapsedGroups, setCollapsedGroups]     = useState<Set<string>>(new Set());
  const [formTestCategory, setFormTestCategory]   = useState("");

  const { data: products = [], isLoading } = useProducts();
  const { data: alerts   = [] }            = useAlerts();
  const { data: scales   = [] }            = useScales();
  const { data: movements = [], isLoading: loadingMovements } = useProductMovements(historyTarget?.id ?? "");

  const createProduct  = useCreateProduct();
  const deleteProduct  = useDeleteProduct();
  const deleteScale    = useDeleteScale();
  const createMovement = useCreateMovement();

  const totalValue = products.reduce((acc, p) => acc + parseFloat(p.unit_price || "0") * p.quantity, 0);

  const CAT_ORDER = ["intelligence","memory","attention","development","autism","personality","neuropsych","other"];

  // Build groups using scales as primary source (all registered tests appear),
  // then attach products by test_name match. Products without a scale go to a trailing group.
  const categoryGroups = useMemo(() => {
    // index products by test_name (lowercase key)
    const productsByTest = new Map<string, Product[]>();
    const unlinkedProducts: Product[] = [];
    for (const p of products) {
      if (p.test_name) {
        const k = p.test_name.toLowerCase();
        if (!productsByTest.has(k)) productsByTest.set(k, []);
        productsByTest.get(k)!.push(p);
      } else {
        unlinkedProducts.push(p);
      }
    }

    // group scales by category
    const catMap = new Map<string, NeurotestScale[]>();
    for (const s of scales) {
      if (!s.is_active) continue;
      const cat = s.category || "other";
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(s);
    }

    const result = [...catMap.entries()]
      .sort(([ak], [bk]) => {
        const ai = CAT_ORDER.indexOf(ak); const bi = CAT_ORDER.indexOf(bk);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([catKey, catScales]) => ({
        catKey,
        meta: NEURO_CATEGORIES[catKey] ?? NEURO_CATEGORIES.other,
        tests: catScales
          .sort((a, b) => (a.abbreviation || a.name).localeCompare(b.abbreviation || b.name, "pt-BR"))
          .map((s) => {
            const key   = (s.abbreviation || s.name).toLowerCase();
            const items = productsByTest.get(key) ?? [];
            return { testKey: s.abbreviation || s.name, scale: s, items };
          }),
      }))
      .filter(({ catKey }) => !filterCat || catKey === filterCat);

    // products with test_name that didn't match any scale
    const matchedKeys = new Set(scales.map((s) => (s.abbreviation || s.name).toLowerCase()));
    const orphanProducts = products.filter(
      (p) => p.test_name && !matchedKeys.has(p.test_name.toLowerCase())
    );
    if (orphanProducts.length > 0 && !filterCat) {
      // group orphans by their test_name
      const orphanMap = new Map<string, Product[]>();
      for (const p of orphanProducts) {
        if (!orphanMap.has(p.test_name)) orphanMap.set(p.test_name, []);
        orphanMap.get(p.test_name)!.push(p);
      }
      result.push({
        catKey: "__orphan__",
        meta: { label: "Outros (sem escala)", color: "rgba(160,150,210,0.7)", bg: "rgba(130,120,200,0.09)" },
        tests: [...orphanMap.entries()].map(([tk, items]) => ({ testKey: tk, scale: null, items })),
      });
    }
    if (unlinkedProducts.length > 0 && !filterCat) {
      result.push({
        catKey: "__none__",
        meta: { label: "Sem teste vinculado", color: "rgba(130,110,180,0.55)", bg: "rgba(100,80,160,0.07)" },
        tests: [{ testKey: "__none__", scale: null, items: unlinkedProducts }],
      });
    }

    return result;
  }, [products, scales, filterCat]);

  const toggleCollapse = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const openAddForTest = (testKey: string) => {
    setProductForm({ ...EMPTY_PRODUCT, test_name: testKey, name: `Protocolo ${testKey}`, quantity: "1", min_quantity: "4" });
    setFormTestCategory("");
    setShowProductForm(true);
  };

  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.quantity) return;
    await createProduct.mutateAsync({
      name:         productForm.name,
      test_name:    productForm.test_name,
      category:     productForm.category,
      quantity:     Number(productForm.quantity),
      min_quantity: Number(productForm.min_quantity) || 4,
      unit_price:   productForm.unit_price || "0",
      supplier:     productForm.supplier,
      expiry_date:  productForm.expiry_date || undefined,
    } as Partial<Product>);
    setProductForm(EMPTY_PRODUCT);
    setFormTestCategory("");
    setShowProductForm(false);
  };

  const handleCreateMovement = async () => {
    if (!movementTarget || !movementForm.quantity) return;
    await createMovement.mutateAsync({
      product:  movementTarget.id,
      type:     movementForm.type,
      quantity: Number(movementForm.quantity),
      notes:    movementForm.notes,
    });
    setMovementForm(EMPTY_MOVEMENT);
    setMovementTarget(null);
  };

  return (
    <AppLayout>
      <div style={{ padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,225,255,0.96)", margin: 0 }}>Materiais de Teste</h2>
            <p style={{ fontSize: 13, color: "rgba(180,160,220,0.5)", margin: "4px 0 0" }}>
              {products.length} material(is) · {categoryGroups.reduce((s, g) => s + g.tests.length, 0)} teste(s) · protocolos, cadernos e kits neuropsicológicos
            </p>
          </div>
          <Button onClick={() => setShowProductForm(true)}>
            <Plus size={15} /> Novo Material
          </Button>
        </motion.div>

        {/* Cards de resumo */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <SummaryCard icon={<Package size={18} />}       label="Total de Produtos"  value={String(products.length)}
            iconBg="rgba(130,50,255,0.15)"  iconColor="rgba(190,130,255,0.9)"  border="rgba(130,50,255,0.2)" />
          <SummaryCard icon={<AlertTriangle size={18} />} label="Alertas"            value={String(alerts.length)}
            iconBg={alerts.length > 0 ? "rgba(240,180,30,0.14)" : "rgba(20,180,100,0.12)"}
            iconColor={alerts.length > 0 ? "rgba(255,210,80,0.9)" : "rgba(80,220,140,0.9)"}
            border={alerts.length > 0 ? "rgba(240,180,30,0.25)" : "rgba(20,180,100,0.2)"}
            valueColor={alerts.length > 0 ? "rgba(255,210,80,1)" : undefined} />
          <SummaryCard icon={<DollarSign size={18} />}    label="Valor em Estoque"   value={fmt(totalValue)}
            iconBg="rgba(40,140,255,0.12)"  iconColor="rgba(110,180,255,0.9)"  border="rgba(40,140,255,0.2)" />
        </motion.div>

        {/* Alertas */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ borderRadius: 14, border: "1px solid rgba(240,180,30,0.25)", background: "rgba(240,180,30,0.06)", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={14} style={{ color: "rgba(255,210,80,0.9)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,210,80,0.8)" }}>
                  {alerts.length} alerta(s) de estoque
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {alerts.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "rgba(225,215,255,0.85)", fontWeight: 600 }}>{a.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "rgba(180,160,220,0.5)", fontSize: 12 }}>
                        {a.alert_type === "low_stock"
                          ? `Estoque: ${a.quantity} (mín: ${a.min_quantity})`
                          : `Vence: ${a.expiry_date ? new Date(a.expiry_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}`}
                      </span>
                      <Badge label={a.alert_type === "low_stock" ? "Estoque baixo" : "Vencendo"} variant="warning" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter chips */}
        {scales.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFilterCat("")}
              style={{ padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: !filterCat ? "1.5px solid rgba(160,80,255,0.5)" : "1px solid rgba(120,80,255,0.18)", background: !filterCat ? "rgba(130,50,255,0.18)" : "rgba(255,255,255,0.02)", color: !filterCat ? "rgba(210,180,255,0.95)" : "rgba(160,140,200,0.5)", transition: "all 0.13s" }}>
              Todos ({products.length})
            </motion.button>
            {Object.entries(NEURO_CATEGORIES).map(([key, meta]) => {
              const scaleCount = scales.filter((s) => s.is_active && s.category === key).length;
              if (scaleCount === 0) return null;
              const prodCount = products.filter((p) => resolveCategory(p, scales)?.category === key).length;
              const isActive = filterCat === key;
              return (
                <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setFilterCat(isActive ? "" : key)}
                  style={{ padding: "5px 13px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: isActive ? `1.5px solid ${meta.color.replace(/[\d.]+\)$/, "0.55)")}` : "1px solid rgba(120,80,255,0.15)", background: isActive ? meta.bg : "rgba(255,255,255,0.02)", color: isActive ? meta.color : "rgba(160,140,200,0.5)", transition: "all 0.13s", display: "flex", alignItems: "center", gap: 5 }}>
                  {meta.label}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {scaleCount} teste{scaleCount > 1 ? "s" : ""}{prodCount > 0 ? ` · ${prodCount} mat.` : ""}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Lista agrupada: Categoria → Testes → Produtos */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {isLoading && (
            <div style={{ padding: "48px", textAlign: "center", color: "rgba(160,140,210,0.4)" }}>Carregando...</div>
          )}

          {!isLoading && products.length === 0 && (
            <div style={{ padding: "56px 16px", textAlign: "center", borderRadius: 18, border: "1px solid rgba(120,80,255,0.15)", background: "rgba(12,8,28,0.8)" }}>
              <ShoppingCart size={36} style={{ margin: "0 auto 10px", color: "rgba(150,120,220,0.2)" }} />
              <p style={{ color: "rgba(160,140,210,0.4)", fontSize: 14, margin: 0 }}>Nenhum produto cadastrado.</p>
            </div>
          )}

          <AnimatePresence>
            {categoryGroups.map((catGroup, ci) => {
              const { catKey, meta, tests } = catGroup;
              const isNoneCat      = catKey === "__none__";
              const isCatCollapsed = collapsedGroups.has(`cat:${catKey}`);
              const accentColor    = meta?.color ?? "rgba(160,150,210,0.5)";
              const totalItems     = tests.reduce((s, t) => s + t.items.length, 0);
              const totalQty       = tests.reduce((s, t) => s + t.items.reduce((ss, p) => ss + p.quantity, 0), 0);
              const hasAlert       = tests.some((t) => t.items.some((p) => p.quantity === 0 || p.is_low_stock));
              const testsWithStock = tests.filter((t) => t.items.length > 0).length;

              return (
                <motion.div key={catKey}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: ci * 0.05 }}
                  style={{ borderRadius: 18, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, "0.2)")}`, background: "rgba(10,6,24,0.9)", overflow: "hidden" }}>

                  {/* ── Cabeçalho da CATEGORIA ── */}
                  <button onClick={() => toggleCollapse(`cat:${catKey}`)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: `${accentColor.replace(/[\d.]+\)$/, "0.07)")}`, border: "none", cursor: "pointer", borderBottom: isCatCollapsed ? "none" : `1px solid ${accentColor.replace(/[\d.]+\)$/, "0.12)")}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = accentColor.replace(/[\d.]+\)$/, "0.11)"))}
                    onMouseLeave={(e) => (e.currentTarget.style.background = accentColor.replace(/[\d.]+\)$/, "0.07)"))}>

                    <div style={{ width: 4, height: 32, borderRadius: 2, background: accentColor, flexShrink: 0 }} />

                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {isNoneCat ? "Sem categoria" : meta?.label}
                        </span>
                        {hasAlert && <AlertTriangle size={12} style={{ color: "rgba(255,200,60,0.85)" }} />}
                      </div>
                      <span style={{ fontSize: 11, color: accentColor.replace(/[\d.]+\)$/, "0.45)"), display: "block", marginTop: 1 }}>
                        {tests.length} teste{tests.length > 1 ? "s" : ""}
                        {testsWithStock > 0 && ` · ${testsWithStock} com material · ${totalItems} item(ns)`}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 10, color: accentColor.replace(/[\d.]+\)$/, "0.4)"), display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>total</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: totalQty === 0 ? "rgba(255,110,110,0.9)" : "rgba(220,210,255,0.9)", fontFamily: "monospace" }}>{totalQty}</span>
                      </div>
                      <ChevronDown size={15} style={{ color: accentColor.replace(/[\d.]+\)$/, "0.5)"), transform: isCatCollapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }} />
                    </div>
                  </button>

                  {/* ── Testes dentro da categoria ── */}
                  <AnimatePresence>
                    {!isCatCollapsed && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                        {tests.map((testGroup, ti) => {
                          const { testKey, scale, items } = testGroup;
                          const isNoneTest = testKey === "__none__";
                          const testQty   = items.reduce((s, p) => s + p.quantity, 0);
                          const testAlert = items.some((p) => p.quantity === 0 || p.is_low_stock);
                          const isLast    = ti === tests.length - 1;

                          return (
                            <div key={testKey} style={{ borderBottom: isLast ? "none" : `1px solid ${accentColor.replace(/[\d.]+\)$/, "0.08)")}` }}>

                              {/* Cabeçalho do TESTE */}
                              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px 11px 32px", borderBottom: items.length > 0 ? `1px solid ${accentColor.replace(/[\d.]+\)$/, "0.06)")}` : "none" }}>

                                <div style={{ width: 2, height: 20, borderRadius: 1, background: accentColor.replace(/[\d.]+\)$/, "0.4)"), flexShrink: 0 }} />

                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: isNoneTest ? "rgba(150,130,200,0.5)" : "rgba(220,210,255,0.9)" }}>
                                      {isNoneTest ? "Sem teste vinculado" : testKey}
                                    </span>
                                    {!isNoneTest && scale?.name && scale.name !== testKey && (
                                      <span style={{ fontSize: 11, color: "rgba(140,120,190,0.38)" }}>{scale.name}</span>
                                    )}
                                    {testAlert && <AlertTriangle size={11} style={{ color: "rgba(255,200,60,0.75)" }} />}
                                  </div>
                                  {items.length === 0 && (
                                    <span style={{ fontSize: 11, color: "rgba(130,110,180,0.28)", display: "block", marginTop: 1, fontStyle: "italic" }}>
                                      sem material cadastrado
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                  {!isNoneTest && (
                                    <button
                                      type="button"
                                      onClick={() => openAddForTest(testKey)}
                                      title="Adicionar material"
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${accentColor.replace(/[\d.]+\)$/, "0.3)")}`, background: accentColor.replace(/[\d.]+\)$/, "0.08)"), color: accentColor.replace(/[\d.]+\)$/, "0.8)"), transition: "all 0.13s" }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentColor.replace(/[\d.]+\)$/, "0.15)"); }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentColor.replace(/[\d.]+\)$/, "0.08)"); }}>
                                      <Plus size={11} /> Adicionar
                                    </button>
                                  )}
                                  {scale && catKey !== "__orphan__" && catKey !== "__none__" && (
                                    <>
                                      <button type="button"
                                        onClick={() => navigate("/neurotests")}
                                        title="Editar teste"
                                        style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid rgba(120,60,255,0.22)", background: "rgba(120,60,255,0.08)", cursor: "pointer", transition: "all 0.13s" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,60,255,0.18)"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,60,255,0.08)"; }}>
                                        <Edit2 size={11} style={{ color: "rgba(160,120,255,0.8)" }} />
                                      </button>
                                      <button type="button"
                                        onClick={() => setDeleteScaleTarget(scale)}
                                        title="Excluir teste"
                                        style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid rgba(220,50,50,0.2)", background: "rgba(220,50,50,0.06)", cursor: "pointer", transition: "all 0.13s" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,50,50,0.18)"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,50,50,0.06)"; }}>
                                        <Trash2 size={11} style={{ color: "rgba(255,100,100,0.8)" }} />
                                      </button>
                                    </>
                                  )}
                                  {items.length > 0 && (
                                    <span style={{ fontSize: 15, fontWeight: 800, color: testQty === 0 ? "rgba(255,110,110,0.9)" : accentColor.replace(/[\d.]+\)$/, "0.8)"), fontFamily: "monospace", minWidth: 28, textAlign: "right" }}>
                                      {testQty}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Produtos do teste — sempre visíveis */}
                              {items.length > 0 && (
                                <div>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                      <thead>
                                        <tr style={{ background: "rgba(255,255,255,0.015)" }}>
                                          {["Tipo / Nome", "Qtd", "Mín", "Fornecedor", "Validade", "Status", ""].map((h, i) => (
                                            <th key={i} style={{ padding: "7px 14px 7px " + (i === 0 ? "44px" : "14px"), textAlign: i === 1 || i === 2 ? "center" : "left", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(130,110,180,0.38)" }}>
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {items.map((p) => {
                                          const sb = stockBadge(p);
                                          const sc = stockColor(p);
                                          return (
                                            <tr key={p.id}
                                              style={{ borderTop: "1px solid rgba(255,255,255,0.025)", transition: "background 0.1s" }}
                                              onMouseEnter={(e) => (e.currentTarget.style.background = accentColor.replace(/[\d.]+\)$/, "0.05)"))}
                                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                              <td style={{ padding: "10px 14px 10px 44px" }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(215,205,250,0.85)", margin: 0 }}>{p.name}</p>
                                                {p.category && <span style={{ fontSize: 11, color: "rgba(140,120,190,0.42)", display: "block", marginTop: 1 }}>{p.category}</span>}
                                              </td>
                                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: sc, fontFamily: "monospace" }}>{p.quantity}</span>
                                              </td>
                                              <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 13, color: "rgba(150,130,200,0.42)", fontFamily: "monospace" }}>{p.min_quantity}</td>
                                              <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(170,150,220,0.55)" }}>{p.supplier || "—"}</td>
                                              <td style={{ padding: "10px 14px", fontSize: 12, color: "rgba(150,130,200,0.42)" }}>
                                                {p.expiry_date ? new Date(p.expiry_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                                              </td>
                                              <td style={{ padding: "10px 14px" }}><Badge label={sb.label} variant={sb.variant} /></td>
                                              <td style={{ padding: "10px 14px" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                  <ActionBtn icon={<ArrowUpDown size={12} />} label="Movimentar"
                                                    color="rgba(110,180,255,0.9)" bg="rgba(40,140,255,0.1)" hoverBg="rgba(40,140,255,0.2)" border="rgba(40,140,255,0.25)"
                                                    onClick={() => { setMovementForm(EMPTY_MOVEMENT); setMovementTarget(p); }} />
                                                  <ActionBtn icon={<History size={12} />} label=""
                                                    color="rgba(180,120,255,1)" bg="rgba(140,60,255,0.12)" hoverBg="rgba(140,60,255,0.22)" border="rgba(140,60,255,0.28)"
                                                    onClick={() => setHistoryTarget(p)} />
                                                  <ActionBtn icon={<Trash2 size={12} />} label=""
                                                    color="rgba(255,100,100,0.9)" bg="rgba(220,50,50,0.08)" hoverBg="rgba(220,50,50,0.18)" border="rgba(220,50,50,0.22)"
                                                    onClick={() => setDeleteTarget(p)} />
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal: novo produto */}
      <Modal open={showProductForm} onClose={() => { setShowProductForm(false); setProductForm(EMPTY_PRODUCT); }} title="Novo Material de Teste" size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Nome do Produto">
            <input placeholder="Ex: Protocolo WISC-V (caderno de resposta)" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={inputStyle} />
          </Field>
          <div style={{ borderRadius: 12, border: "1px solid rgba(130,80,255,0.2)", background: "rgba(130,60,255,0.04)", padding: "14px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(200,170,255,0.9)" }}>
              Vincular ao Teste (Nome no Laudo)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {Object.entries(NEURO_CATEGORIES).map(([key, meta]) => {
                const count = scales.filter((s) => s.category === key).length;
                if (count === 0) return null;
                const isActive = formTestCategory === key;
                return (
                  <motion.button key={key} type="button" whileTap={{ scale: 0.95 }}
                    onClick={() => setFormTestCategory(isActive ? "" : key)}
                    style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", border: isActive ? `1.5px solid ${meta.color.replace(/[\d.]+\)$/, "0.55)")}` : "1px solid rgba(120,80,255,0.18)", background: isActive ? meta.bg : "rgba(255,255,255,0.02)", color: isActive ? meta.color : "rgba(160,140,200,0.5)", transition: "all 0.13s", display: "flex", alignItems: "center", gap: 4 }}>
                    {meta.label} <span style={{ fontSize: 10, opacity: 0.65 }}>({count})</span>
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {formTestCategory && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {scales.filter((s) => s.category === formTestCategory).map((s) => {
                    const key        = s.abbreviation || s.name;
                    const isSelected = productForm.test_name === key;
                    return (
                      <motion.button key={s.id} type="button" whileTap={{ scale: 0.93 }}
                        onClick={() => setProductForm({ ...productForm, test_name: key, name: productForm.name || `Protocolo ${key}` })}
                        style={{ padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: isSelected ? "1.5px solid rgba(80,220,140,0.55)" : "1px solid rgba(130,80,255,0.25)", background: isSelected ? "rgba(80,220,140,0.1)" : "rgba(130,60,255,0.08)", color: isSelected ? "rgba(80,220,140,0.95)" : "rgba(200,175,255,0.8)", transition: "all 0.13s", display: "flex", alignItems: "center", gap: 5 }}>
                        {isSelected && <Check size={11} />}{key}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            {productForm.test_name ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(80,220,140,0.08)", border: "1px solid rgba(80,220,140,0.3)" }}>
                <Check size={13} style={{ color: "rgba(80,220,140,0.9)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(80,220,140,0.9)" }}>Vinculado: {productForm.test_name}</span>
                <button type="button" onClick={() => setProductForm({ ...productForm, test_name: "" })}
                  style={{ marginLeft: "auto", fontSize: 11, color: "rgba(160,130,200,0.5)", background: "none", border: "none", cursor: "pointer" }}>remover</button>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 11, color: "rgba(150,130,200,0.4)", fontStyle: "italic" }}>
                {formTestCategory ? "Clique em um teste acima para vincular" : "Selecione uma categoria para ver os testes"}
              </p>
            )}
            <p style={{ fontSize: 11, color: "rgba(160,130,220,0.4)", margin: "6px 0 0" }}>
              A sigla vinculada abate estoque automaticamente ao aplicar laudos.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Categoria">
              <Select value={productForm.category} onChange={(v) => setProductForm({ ...productForm, category: v })}
                placeholder="Selecione..." options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Fornecedor">
              <input placeholder="Nome do fornecedor" value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Quantidade">
              <input type="number" min="0" placeholder="0" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Estoque mínimo">
              <input type="number" min="0" placeholder="0" value={productForm.min_quantity} onChange={(e) => setProductForm({ ...productForm, min_quantity: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Preço unitário">
              <input type="number" step="0.01" min="0" placeholder="0,00" value={productForm.unit_price} onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <Field label="Validade (opcional)">
            <input type="date" value={productForm.expiry_date} onChange={(e) => setProductForm({ ...productForm, expiry_date: e.target.value })} style={inputStyle} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setShowProductForm(false); setProductForm(EMPTY_PRODUCT); }}>Cancelar</Button>
            <Button loading={createProduct.isPending} onClick={handleCreateProduct} disabled={!productForm.name || !productForm.quantity}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: movimentar estoque */}
      <Modal open={!!movementTarget} onClose={() => setMovementTarget(null)} title={`Movimentar — ${movementTarget?.name ?? ""}`} size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Tipo de Movimento">
            <Select value={movementForm.type} onChange={(v) => setMovementForm({ ...movementForm, type: v as StockMovementType })}
              options={MOVEMENT_TYPES.map((m) => ({
                value: m.value, label: m.label,
                description: m.value === "entry" ? "Adiciona unidades ao estoque" : m.value === "exit" ? "Remove unidades do estoque" : m.value === "internal" ? "Uso em avaliação de paciente" : m.value === "loss" ? "Perda ou dano do material" : "Correção manual de quantidade",
                color: m.value === "entry" ? "rgba(80,220,140,0.95)" : m.value === "exit" || m.value === "loss" ? "rgba(255,110,100,0.95)" : m.value === "internal" ? "rgba(110,180,255,0.95)" : "rgba(200,170,255,0.9)",
              }))} />
          </Field>
          <Field label="Quantidade">
            <input type="number" min="1" placeholder="0" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Observações">
            <textarea placeholder="Observações opcionais..." value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setMovementTarget(null)}>Cancelar</Button>
            <Button loading={createMovement.isPending} onClick={handleCreateMovement} disabled={!movementForm.quantity}>Registrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: histórico */}
      <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Histórico — ${historyTarget?.name ?? ""}`} size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loadingMovements && <p style={{ textAlign: "center", color: "rgba(160,140,210,0.4)", fontSize: 14 }}>Carregando...</p>}
          {!loadingMovements && movements.length === 0 && (
            <p style={{ textAlign: "center", color: "rgba(160,140,210,0.4)", fontSize: 14, padding: "24px 0" }}>Nenhum movimento registrado.</p>
          )}
          {movements.map((m) => {
            const mt  = MOVEMENT_TYPES.find((x) => x.value === m.type);
            const isIn = m.type === "entry" || m.type === "adjustment";
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(225,215,255,0.85)", margin: 0 }}>{mt?.label ?? m.type}</p>
                  {m.notes && <p style={{ fontSize: 12, color: "rgba(160,140,210,0.5)", margin: "2px 0 0" }}>{m.notes}</p>}
                  <p style={{ fontSize: 11, color: "rgba(140,120,190,0.4)", margin: "2px 0 0" }}>
                    {m.performed_by_name} · {new Date(m.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: isIn ? "rgba(80,220,140,0.9)" : "rgba(255,110,110,0.9)", fontFamily: "monospace" }}>
                  {isIn ? "+" : "-"}{m.quantity}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Modal: confirmar exclusão de escala */}
      <Modal open={!!deleteScaleTarget} onClose={() => setDeleteScaleTarget(null)} title="Excluir Teste" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir o teste <strong style={{ color: "rgba(235,225,255,0.95)" }}>"{deleteScaleTarget?.abbreviation || deleteScaleTarget?.name}"</strong>?
            Ele deixará de aparecer no seletor de laudos e no estoque. Os materiais vinculados <strong>não</strong> serão excluídos.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteScaleTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteScale.isPending}
              onClick={() => deleteScale.mutate(deleteScaleTarget!.id, { onSuccess: () => setDeleteScaleTarget(null) })}>
              Excluir Teste
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: confirmar exclusão */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Produto" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "rgba(210,195,245,0.8)", margin: 0, lineHeight: 1.6 }}>
            Excluir o produto <strong style={{ color: "rgba(235,225,255,0.95)" }}>"{deleteTarget?.name}"</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleteProduct.isPending}
              onClick={() => deleteProduct.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function SummaryCard({ icon, label, value, iconBg, iconColor, border, valueColor }: {
  icon: React.ReactNode; label: string; value: string;
  iconBg: string; iconColor: string; border: string; valueColor?: string;
}) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: "rgba(12,8,28,0.8)", padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(160,130,220,0.55)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 800, color: valueColor ?? "rgba(235,225,255,0.96)", margin: "4px 0 0", fontFamily: "monospace" }}>{value}</p>
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
      style={{ display: "flex", alignItems: "center", gap: label ? 5 : 0, padding: label ? "5px 11px" : "5px 8px", borderRadius: 8, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s, transform 0.1s, box-shadow 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${border}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
      {icon}{label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(120,80,255,0.22)",
  background: "rgba(8,5,22,0.75)", color: "rgba(225,215,255,0.9)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
