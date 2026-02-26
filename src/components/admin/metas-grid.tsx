"use client";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Loader2 } from "lucide-react";
import { MESES, CATEGORIAS } from "@/lib/utils";
import { saveMetas } from "@/lib/actions/admin";
=======
=======
>>>>>>> Stashed changes
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Save, Loader2, Target, CalendarDays, LayoutGrid } from "lucide-react";
import { MESES, CATEGORIAS, formatMoney } from "@/lib/utils";
import { saveMetas, addCategoryToAllYears } from "@/lib/actions/admin";
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import { toast } from "sonner";
import type { MetasByCategory } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// CurrencyInput — exibe formatado quando fora do foco, numérico ao editar
// ---------------------------------------------------------------------------

interface CurrencyInputProps {
    value: number;
    onChange: (val: number) => void;
    className?: string;
    ariaLabel?: string;
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export function MetasGrid({ ano, initialMetas }: MetasGridProps) {
    const [loading, setLoading] = useState(false);
    const [metas, setMetas] = useState(initialMetas);
=======
=======
>>>>>>> Stashed changes
function CurrencyInput({ value, onChange, className, ariaLabel }: CurrencyInputProps) {
    const [focused, setFocused] = useState(false);
    const [raw, setRaw] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
<<<<<<< Updated upstream

    function handleFocus() {
        setRaw(value === 0 ? "" : String(value));
        setFocused(true);
        // Selecionar todo o texto após o estado ser atualizado
        requestAnimationFrame(() => inputRef.current?.select());
    }

    function handleBlur() {
        // Remove qualquer caracter que não seja dígito, vírgula ou ponto
        const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
        const parsed = parseFloat(cleaned) || 0;
        onChange(parsed);
        setFocused(false);
    }

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className={className}
            value={focused ? raw : formatMoney(value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => setRaw(e.target.value)}
            aria-label={ariaLabel}
        />
    );
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const STICKY_CELL =
    "sticky left-0 z-20 border-r border-[#F1F5F9] min-w-[260px] -translate-x-px " +
    "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-black/10 after:to-transparent after:pointer-events-none";

const INPUT_CLASS =
    "w-full h-9 rounded-lg bg-[#F8FAFC] border-transparent px-2.5 text-xs text-right font-mono font-medium " +
    "transition-all focus:bg-white focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857] outline-none group-hover:bg-[#F1F5F9]";

const QUARTERS = [
    { label: "Q1", months: [1, 2, 3] as const },
    { label: "Q2", months: [4, 5, 6] as const },
    { label: "Q3", months: [7, 8, 9] as const },
    { label: "Q4", months: [10, 11, 12] as const },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
    "Novo Cliente": "#00C896",
    "Cliente Recorrente": "#3A86FF",
    "Horas Extras": "#8A2BE2",
    Renovacao: "#FFC857",
};

const FALLBACK_COLORS = [
    "#E91E8C", "#00C896", "#3A86FF", "#FFC857", "#8A2BE2", "#FF6B6B",
    "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#9B59B6",
    "#34495E", "#16A085", "#27AE60", "#2980B9", "#E67E22", "#E74C3C", "#434343",
];
>>>>>>> Stashed changes

function getCategoryColor(category: string): string {
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** Distribui um valor total de forma uniforme pelos meses do quarter.
 *  O centavo residual (arredondamento) é adicionado ao primeiro mês. */
function distributeQuarter(total: number, months: readonly number[]): Record<number, number> {
    const base = Math.round(total / months.length);
    const remainder = Math.round(total - base * months.length);
    return Object.fromEntries(
        months.map((m, i) => [m, i === 0 ? base + remainder : base])
    );
}

// ---------------------------------------------------------------------------
// Props + tipos
// ---------------------------------------------------------------------------

type ViewMode = "mensal" | "trimestral";

export interface MetasGridProps {
    ano: number;
    initialMetas: MetasByCategory;
    readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useMetasGrid(ano: number, initialMetas: MetasByCategory) {
    const [loading, setLoading] = useState(false);
    const [addingCategory, setAddingCategory] = useState(false);
    const [view, setView] = useState<ViewMode>("mensal");
    const [metas, setMetas] = useState(initialMetas);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [newCatName, setNewCatName] = useState("");

    useEffect(() => {
        setMetas(initialMetas);
        const custom = Object.keys(initialMetas).filter(
            (cat) => !(CATEGORIAS as readonly string[]).includes(cat)
        );
        setCustomCategories(custom);
    }, [ano, initialMetas]);

    const allCategories = [...(CATEGORIAS as readonly string[]), ...customCategories];

    // --- Setters ---
    const setMonthValue = useCallback((cat: string, mes: number, val: number) => {
        setMetas((prev) => ({ ...prev, [cat]: { ...prev[cat], [mes]: val } }));
    }, []);

    const setQuarterValue = useCallback((cat: string, months: readonly number[], total: number) => {
        const distributed = distributeQuarter(total, months);
        setMetas((prev) => ({
            ...prev,
            [cat]: { ...prev[cat], ...distributed },
        }));
    }, []);

=======

    function handleFocus() {
        setRaw(value === 0 ? "" : String(value));
        setFocused(true);
        // Selecionar todo o texto após o estado ser atualizado
        requestAnimationFrame(() => inputRef.current?.select());
    }

    function handleBlur() {
        // Remove qualquer caracter que não seja dígito, vírgula ou ponto
        const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
        const parsed = parseFloat(cleaned) || 0;
        onChange(parsed);
        setFocused(false);
    }

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className={className}
            value={focused ? raw : formatMoney(value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => setRaw(e.target.value)}
            aria-label={ariaLabel}
        />
    );
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const STICKY_CELL =
    "sticky left-0 z-20 border-r border-[#F1F5F9] min-w-[260px] -translate-x-px " +
    "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-black/10 after:to-transparent after:pointer-events-none";

const INPUT_CLASS =
    "w-full h-9 rounded-lg bg-[#F8FAFC] border-transparent px-2.5 text-xs text-right font-mono font-medium " +
    "transition-all focus:bg-white focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857] outline-none group-hover:bg-[#F1F5F9]";

const QUARTERS = [
    { label: "Q1", months: [1, 2, 3] as const },
    { label: "Q2", months: [4, 5, 6] as const },
    { label: "Q3", months: [7, 8, 9] as const },
    { label: "Q4", months: [10, 11, 12] as const },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
    "Novo Cliente": "#00C896",
    "Cliente Recorrente": "#3A86FF",
    "Horas Extras": "#8A2BE2",
    Renovacao: "#FFC857",
};

const FALLBACK_COLORS = [
    "#E91E8C", "#00C896", "#3A86FF", "#FFC857", "#8A2BE2", "#FF6B6B",
    "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD", "#D4A5A5", "#9B59B6",
    "#34495E", "#16A085", "#27AE60", "#2980B9", "#E67E22", "#E74C3C", "#434343",
];

function getCategoryColor(category: string): string {
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** Distribui um valor total de forma uniforme pelos meses do quarter.
 *  O centavo residual (arredondamento) é adicionado ao primeiro mês. */
function distributeQuarter(total: number, months: readonly number[]): Record<number, number> {
    const base = Math.round(total / months.length);
    const remainder = Math.round(total - base * months.length);
    return Object.fromEntries(
        months.map((m, i) => [m, i === 0 ? base + remainder : base])
    );
}

// ---------------------------------------------------------------------------
// Props + tipos
// ---------------------------------------------------------------------------

type ViewMode = "mensal" | "trimestral";

export interface MetasGridProps {
    ano: number;
    initialMetas: MetasByCategory;
    readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useMetasGrid(ano: number, initialMetas: MetasByCategory) {
    const [loading, setLoading] = useState(false);
    const [addingCategory, setAddingCategory] = useState(false);
    const [view, setView] = useState<ViewMode>("mensal");
    const [metas, setMetas] = useState(initialMetas);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [newCatName, setNewCatName] = useState("");

    useEffect(() => {
        setMetas(initialMetas);
        const custom = Object.keys(initialMetas).filter(
            (cat) => !(CATEGORIAS as readonly string[]).includes(cat)
        );
        setCustomCategories(custom);
    }, [ano, initialMetas]);

    const allCategories = [...(CATEGORIAS as readonly string[]), ...customCategories];

    // --- Setters ---
    const setMonthValue = useCallback((cat: string, mes: number, val: number) => {
        setMetas((prev) => ({ ...prev, [cat]: { ...prev[cat], [mes]: val } }));
    }, []);

    const setQuarterValue = useCallback((cat: string, months: readonly number[], total: number) => {
        const distributed = distributeQuarter(total, months);
        setMetas((prev) => ({
            ...prev,
            [cat]: { ...prev[cat], ...distributed },
        }));
    }, []);

>>>>>>> Stashed changes
    // --- Helpers de total ---
    const rowTotal = useCallback(
        (cat: string) => Object.values(metas[cat] || {}).reduce((s, v) => s + v, 0),
        [metas]
    );
    const colMonthTotal = useCallback(
        (mes: number) => allCategories.reduce((s, cat) => s + (metas[cat]?.[mes] || 0), 0),
        [metas, allCategories]
    );
    const colQuarterTotal = useCallback(
        (months: readonly number[]) => months.reduce((s, m) => s + colMonthTotal(m), 0),
        [colMonthTotal]
    );
    const quarterValue = useCallback(
        (cat: string, months: readonly number[]) =>
            months.reduce((s, m) => s + (metas[cat]?.[m] || 0), 0),
        [metas]
    );
    const grandTotal = allCategories.reduce((s, cat) => s + rowTotal(cat), 0);

    // --- Categoria ---
    const handleAddCategory = useCallback(async () => {
        const name = newCatName.trim();
        if (!name) return;
        if (allCategories.includes(name)) {
            toast.error("Categoria já existe");
            return;
        }
        setCustomCategories((prev) => [...prev, name]);
        setMetas((prev) => ({ ...prev, [name]: {} }));
        setNewCatName("");

        setAddingCategory(true);
        const result = await addCategoryToAllYears(name);
        setAddingCategory(false);

        if (result.error) toast.error(result.error);
        else toast.success(`Categoria "${name}" adicionada a todos os anos.`);
    }, [newCatName, allCategories]);

    // --- Salvar ---
    const handleSave = useCallback(async () => {
        setLoading(true);
        const result = await saveMetas(ano, metas);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else toast.success("Metas salvas com sucesso!");
    }, [ano, metas]);
<<<<<<< Updated upstream
=======

    return {
        metas,
        view,
        setView,
        loading,
        addingCategory,
        allCategories,
        newCatName,
        setNewCatName,
        setMonthValue,
        setQuarterValue,
        rowTotal,
        colMonthTotal,
        colQuarterTotal,
        quarterValue,
        grandTotal,
        handleAddCategory,
        handleSave,
    };
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function MetasGrid({ ano, initialMetas, readOnly = false }: MetasGridProps) {
    const {
        metas,
        view,
        setView,
        loading,
        addingCategory,
        allCategories,
        newCatName,
        setNewCatName,
        setMonthValue,
        setQuarterValue,
        rowTotal,
        colMonthTotal,
        colQuarterTotal,
        quarterValue,
        grandTotal,
        handleAddCategory,
        handleSave,
    } = useMetasGrid(ano, initialMetas);

    const isMensal = view === "mensal";
>>>>>>> Stashed changes

<<<<<<< Updated upstream
    return (
<<<<<<< Updated upstream
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Metas {ano}</CardTitle>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
                </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background">Categoria</TableHead>
                            {MESES.map((m) => (
                                <TableHead key={m} className="text-center min-w-[80px]">{m}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {CATEGORIAS.map((cat) => (
                            <TableRow key={cat}>
                                <TableCell className="sticky left-0 bg-background font-medium text-sm whitespace-nowrap">{cat}</TableCell>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                    <TableCell key={mes} className="p-1">
                                        <Input
                                            type="number"
                                            className="w-20 h-8 text-xs text-right"
                                            value={metas[cat]?.[mes] || 0}
                                            onChange={(e) => setMetaValue(cat, mes, parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
=======
    return {
        metas,
        view,
        setView,
        loading,
        addingCategory,
        allCategories,
        newCatName,
        setNewCatName,
        setMonthValue,
        setQuarterValue,
        rowTotal,
        colMonthTotal,
        colQuarterTotal,
        quarterValue,
        grandTotal,
        handleAddCategory,
        handleSave,
    };
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function MetasGrid({ ano, initialMetas, readOnly = false }: MetasGridProps) {
    const {
        metas,
        view,
        setView,
        loading,
        addingCategory,
        allCategories,
        newCatName,
        setNewCatName,
        setMonthValue,
        setQuarterValue,
        rowTotal,
        colMonthTotal,
        colQuarterTotal,
        quarterValue,
        grandTotal,
        handleAddCategory,
        handleSave,
    } = useMetasGrid(ano, initialMetas);

    const isMensal = view === "mensal";

    return (
        <Card className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F1F1] px-6 py-4">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#E91E8C]" aria-hidden />
                    <h2 className="text-sm font-semibold">Metas {ano}</h2>
                </div>

                {/* Toggle de visão */}
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
                    <button
                        onClick={() => setView("mensal")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                            isMensal
                                ? "bg-white text-[#1E293B] shadow-sm"
                                : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                    >
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        Mensal
                    </button>
                    <button
                        onClick={() => setView("trimestral")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                            !isMensal
                                ? "bg-white text-[#1E293B] shadow-sm"
                                : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                        Trimestral
                    </button>
                </div>

                {!readOnly && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#E91E8C] px-5 text-white hover:bg-[#D4177F]"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Metas
                            </>
                        )}
                    </Button>
                )}
            </div>

            <CardContent className="p-0 min-w-0">
                {isMensal ? (
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                                <TableHead className={`${STICKY_CELL} bg-[#F8FAFC] z-30 text-[10px] font-bold uppercase tracking-widest text-[#64748B] border-[#E2E8F0]`}>
                                    Categoria
                                </TableHead>
                                {MESES.map((m) => (
                                    <TableHead key={m} className="min-w-[110px] px-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                        {m}
                                    </TableHead>
                                ))}
                                <TableHead className="min-w-[120px] border-l border-[#E2E8F0] bg-[#F1F5F9] text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCategories.map((cat) => (
                                <MensalRow
                                    key={cat}
                                    category={cat}
                                    color={getCategoryColor(cat)}
                                    metas={metas[cat]}
                                    onSetValue={(mes, val) => setMonthValue(cat, mes, val)}
                                    total={rowTotal(cat)}
                                    stickyClass={STICKY_CELL}
                                    inputClass={INPUT_CLASS}
                                    readOnly={readOnly}
                                />
                            ))}
=======
        <Card className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F1F1] px-6 py-4">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#E91E8C]" aria-hidden />
                    <h2 className="text-sm font-semibold">Metas {ano}</h2>
                </div>

                {/* Toggle de visão */}
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
                    <button
                        onClick={() => setView("mensal")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                            isMensal
                                ? "bg-white text-[#1E293B] shadow-sm"
                                : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                    >
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        Mensal
                    </button>
                    <button
                        onClick={() => setView("trimestral")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                            !isMensal
                                ? "bg-white text-[#1E293B] shadow-sm"
                                : "text-[#64748B] hover:text-[#1E293B]"
                        }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                        Trimestral
                    </button>
                </div>

                {!readOnly && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#E91E8C] px-5 text-white hover:bg-[#D4177F]"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Metas
                            </>
                        )}
                    </Button>
                )}
            </div>

            <CardContent className="p-0 min-w-0">
                {isMensal ? (
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                                <TableHead className={`${STICKY_CELL} bg-[#F8FAFC] z-30 text-[10px] font-bold uppercase tracking-widest text-[#64748B] border-[#E2E8F0]`}>
                                    Categoria
                                </TableHead>
                                {MESES.map((m) => (
                                    <TableHead key={m} className="min-w-[110px] px-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                        {m}
                                    </TableHead>
                                ))}
                                <TableHead className="min-w-[120px] border-l border-[#E2E8F0] bg-[#F1F5F9] text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCategories.map((cat) => (
                                <MensalRow
                                    key={cat}
                                    category={cat}
                                    color={getCategoryColor(cat)}
                                    metas={metas[cat]}
                                    onSetValue={(mes, val) => setMonthValue(cat, mes, val)}
                                    total={rowTotal(cat)}
                                    stickyClass={STICKY_CELL}
                                    inputClass={INPUT_CLASS}
                                    readOnly={readOnly}
                                />
                            ))}
>>>>>>> Stashed changes
                            {!readOnly && (
                                <AddCategoryRow
                                    newCatName={newCatName}
                                    onNewCatNameChange={setNewCatName}
                                    onAdd={handleAddCategory}
                                    loading={addingCategory}
                                    stickyClass={STICKY_CELL}
                                    colSpan={14}
                                />
                            )}
                            <TotalsRow
                                stickyClass={STICKY_CELL}
                                grandTotal={grandTotal}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                    <TableCell key={mes} className="px-3 text-right">
                                        <span className="font-mono text-xs font-semibold text-[#1A1A1A]">
                                            {formatMoney(colMonthTotal(mes))}
                                        </span>
                                    </TableCell>
                                ))}
                            </TotalsRow>
                        </TableBody>
                    </Table>
                ) : (
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                                <TableHead className={`${STICKY_CELL} bg-[#F8FAFC] z-30 text-[10px] font-bold uppercase tracking-widest text-[#64748B] border-[#E2E8F0]`}>
                                    Categoria
                                </TableHead>
                                {QUARTERS.map((q) => (
                                    <TableHead key={q.label} className="min-w-[160px] px-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                        <span>{q.label}</span>
                                        <span className="ml-1 font-normal text-[#94A3B8]">
                                            {q.months.map((m) => MESES[m - 1]).join("·")}
                                        </span>
                                    </TableHead>
                                ))}
                                <TableHead className="min-w-[120px] border-l border-[#E2E8F0] bg-[#F1F5F9] text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCategories.map((cat) => (
                                <TrimestralRow
                                    key={cat}
                                    category={cat}
                                    color={getCategoryColor(cat)}
                                    quarterValue={(months) => quarterValue(cat, months)}
                                    onSetQuarter={(months, val) => setQuarterValue(cat, months, val)}
                                    total={rowTotal(cat)}
                                    stickyClass={STICKY_CELL}
                                    inputClass={INPUT_CLASS}
                                    readOnly={readOnly}
                                />
                            ))}
                            {!readOnly && (
                                <AddCategoryRow
                                    newCatName={newCatName}
                                    onNewCatNameChange={setNewCatName}
                                    onAdd={handleAddCategory}
                                    loading={addingCategory}
                                    stickyClass={STICKY_CELL}
                                    colSpan={6}
                                />
                            )}
                            <TotalsRow
                                stickyClass={STICKY_CELL}
                                grandTotal={grandTotal}
                            >
                                {QUARTERS.map((q) => (
                                    <TableCell key={q.label} className="px-3 text-right">
                                        <span className="font-mono text-xs font-semibold text-[#1A1A1A]">
                                            {formatMoney(colQuarterTotal(q.months))}
                                        </span>
                                    </TableCell>
                                ))}
                            </TotalsRow>
                        </TableBody>
                    </Table>
                )}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

interface MensalRowProps {
    category: string;
    color: string;
    metas: Record<number, number>;
    onSetValue: (mes: number, val: number) => void;
    total: number;
    stickyClass: string;
    inputClass: string;
    readOnly?: boolean;
}

function MensalRow({ category, color, metas, onSetValue, total, stickyClass, inputClass, readOnly }: MensalRowProps) {
    return (
        <TableRow className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]/50">
            <TableCell className={`${stickyClass} bg-white font-semibold text-sm text-[#1E293B] whitespace-nowrap`}>
                <CategoryLabel category={category} color={color} />
            </TableCell>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                <TableCell key={mes} className="p-1 px-1.5">
                    <div className="group relative">
                        {readOnly ? (
                            <span className="block px-2 py-1 text-right font-mono text-xs text-[#1E293B]">
                                {formatMoney(metas?.[mes] ?? 0)}
                            </span>
                        ) : (
                            <CurrencyInput
                                value={metas?.[mes] ?? 0}
                                onChange={(val) => onSetValue(mes, val)}
                                className={inputClass}
                                ariaLabel={`${category} - mês ${mes}`}
                            />
                        )}
                    </div>
                </TableCell>
            ))}
            <TableCell className="border-l border-[#F1F5F9] bg-[#F8FAFC] text-right">
                <span className="font-mono text-xs font-bold" style={{ color }}>
                    {formatMoney(total)}
                </span>
            </TableCell>
        </TableRow>
    );
}

interface TrimestralRowProps {
    category: string;
    color: string;
    quarterValue: (months: readonly number[]) => number;
    onSetQuarter: (months: readonly number[], val: number) => void;
    total: number;
    stickyClass: string;
    inputClass: string;
    readOnly?: boolean;
}

function TrimestralRow({
    category,
    color,
    quarterValue,
    onSetQuarter,
    total,
    stickyClass,
    inputClass,
    readOnly,
}: TrimestralRowProps) {
    return (
        <TableRow className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]/50">
            <TableCell className={`${stickyClass} bg-white font-semibold text-sm text-[#1E293B] whitespace-nowrap`}>
                <CategoryLabel category={category} color={color} />
            </TableCell>
            {QUARTERS.map((q) => (
                <TableCell key={q.label} className="p-1 px-1.5">
                    <div className="group relative">
                        {readOnly ? (
                            <span className="block px-2 py-1 text-right font-mono text-xs text-[#1E293B]">
                                {formatMoney(quarterValue(q.months))}
                            </span>
                        ) : (
                            <CurrencyInput
                                value={quarterValue(q.months)}
                                onChange={(val) => onSetQuarter(q.months, val)}
                                className={inputClass}
                                ariaLabel={`${category} - ${q.label}`}
                            />
                        )}
                    </div>
                </TableCell>
            ))}
            <TableCell className="border-l border-[#F1F5F9] bg-[#F8FAFC] text-right">
                <span className="font-mono text-xs font-bold" style={{ color }}>
                    {formatMoney(total)}
                </span>
            </TableCell>
        </TableRow>
    );
}

function CategoryLabel({ category, color }: { category: string; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: color }} aria-hidden />
            <span>{category}</span>
        </div>
    );
}

interface AddCategoryRowProps {
    newCatName: string;
    onNewCatNameChange: (v: string) => void;
    onAdd: () => void;
    loading: boolean;
    stickyClass: string;
    colSpan: number;
}

function AddCategoryRow({ newCatName, onNewCatNameChange, onAdd, loading, stickyClass, colSpan }: AddCategoryRowProps) {
    return (
        <TableRow className="border-b border-[#F1F5F9] bg-white/50">
            <TableCell className={`${stickyClass} bg-white p-3`}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nova categoria..."
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs outline-none transition-all focus:border-[#E91E8C] focus:bg-white focus:ring-2 focus:ring-[#E91E8C]/10 disabled:opacity-50"
                        value={newCatName}
                        onChange={(e) => onNewCatNameChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !loading && onAdd()}
                        disabled={loading}
                        aria-label="Nome da nova categoria"
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-[10px] font-bold uppercase text-[#E91E8C] hover:bg-[#E91E8C]/5 hover:text-[#D4177F]"
                        onClick={onAdd}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Adicionar"}
                    </Button>
                </div>
            </TableCell>
            <TableCell colSpan={colSpan} className="bg-[#F8FAFC]/30" />
        </TableRow>
    );
}

interface TotalsRowProps {
    stickyClass: string;
    grandTotal: number;
    children: React.ReactNode;
}

function TotalsRow({ stickyClass, grandTotal, children }: TotalsRowProps) {
    return (
        <TableRow className="border-t-2 border-[#E0E0E0] bg-[#FAFAFA] hover:bg-[#FAFAFA]">
            <TableCell className={`${stickyClass} bg-[#FAFAFA] font-bold text-xs uppercase tracking-wider text-[#616161] border-[#E2E8F0]`}>
                Total
            </TableCell>
            {children}
            <TableCell className="bg-[#F0F0F3] text-right">
                <span className="font-mono text-sm font-bold text-[#E91E8C]">
                    {formatMoney(grandTotal)}
                </span>
            </TableCell>
        </TableRow>
    );
}
