"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Save, Loader2, CalendarDays, LayoutGrid } from "lucide-react";
import { MESES, CATEGORIAS, formatMoney } from "@/lib/utils";
import { saveMetasEquipe } from "@/lib/actions/admin";
import { toast } from "sonner";
import type { MetasEquipeData, MetasByCategory, SalesPerson } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const QUARTERS = [
    { label: "Q1", months: [1, 2, 3] as const, color: "#3A86FF" },
    { label: "Q2", months: [4, 5, 6] as const, color: "#E91E8C" },
    { label: "Q3", months: [7, 8, 9] as const, color: "#00C896" },
    { label: "Q4", months: [10, 11, 12] as const, color: "#FFC857" },
] as const;

const STICKY_CELL =
    "sticky left-0 z-20 border-r border-[#F1F5F9] min-w-[200px] -translate-x-px " +
    "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 " +
    "after:bg-gradient-to-r after:from-black/10 after:to-transparent after:pointer-events-none";

const CATEGORY_COLORS: Record<string, string> = {
    "Novo Cliente": "#00C896",
    "Cliente Recorrente": "#3A86FF",
    "Horas Extras": "#8A2BE2",
    Renovacao: "#FFC857",
};
const FALLBACK_COLORS = [
    "#E91E8C", "#00C896", "#3A86FF", "#FFC857", "#8A2BE2",
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#9B59B6", "#E67E22",
];
function getCatColor(cat: string): string {
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function distributeQuarter(total: number, months: readonly number[]): Record<number, number> {
    const base = Math.round(total / months.length);
    const rem = Math.round(total - base * months.length);
    return Object.fromEntries(months.map((m, i) => [m, i === 0 ? base + rem : base]));
}

// ---------------------------------------------------------------------------
// CurrencyInput
// ---------------------------------------------------------------------------

interface CurrencyInputProps {
    value: number;
    onChange: (v: number) => void;
    ariaLabel?: string;
    disabled?: boolean;
}

function CurrencyInput({ value, onChange, ariaLabel, disabled }: CurrencyInputProps) {
    const [focused, setFocused] = useState(false);
    const [raw, setRaw] = useState("");
    const ref = useRef<HTMLInputElement>(null);

    const inputClass =
        "w-full h-8 rounded-md bg-[#F8FAFC] border-transparent px-2 text-xs text-right font-mono font-medium " +
        "transition-all focus:bg-white focus:ring-2 focus:ring-[#FFC857]/30 focus:border-[#FFC857] outline-none " +
        "hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <input
            ref={ref}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            className={inputClass}
            value={focused ? raw : formatMoney(value)}
            onFocus={() => {
                setRaw(value === 0 ? "" : String(value));
                setFocused(true);
                requestAnimationFrame(() => ref.current?.select());
            }}
            onBlur={() => {
                const parsed = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
                onChange(parsed);
                setFocused(false);
            }}
            onChange={(e) => setRaw(e.target.value)}
            aria-label={ariaLabel}
        />
    );
}

// ---------------------------------------------------------------------------
// Props + tipos internos
// ---------------------------------------------------------------------------

type ViewMode = "mensal" | "trimestral";

export interface MetasEquipeGridProps {
    ano: number;
    salesPeople: SalesPerson[];
    categorias: string[];
    initialData: MetasEquipeData;
    metasGlobais: MetasByCategory;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useMetasEquipeGrid(
    ano: number,
    initialData: MetasEquipeData,
    salesPeople: SalesPerson[],
    categorias: string[]
) {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ViewMode>("trimestral");
    const [data, setData] = useState<MetasEquipeData>(initialData);

    useEffect(() => {
        setData(initialData);
    }, [ano, initialData]);

    const setMonthValue = useCallback(
        (cat: string, personId: number, mes: number, val: number) => {
            setData((prev) => ({
                ...prev,
                [cat]: {
                    ...prev[cat],
                    [personId]: { ...prev[cat]?.[personId], [mes]: val },
                },
            }));
        },
        []
    );

    const setQuarterValue = useCallback(
        (cat: string, personId: number, months: readonly number[], total: number) => {
            const dist = distributeQuarter(total, months);
            setData((prev) => ({
                ...prev,
                [cat]: {
                    ...prev[cat],
                    [personId]: { ...prev[cat]?.[personId], ...dist },
                },
            }));
        },
        []
    );

    const personPeriodValue = useCallback(
        (cat: string, personId: number, months: readonly number[]) =>
            months.reduce((s, m) => s + (data[cat]?.[personId]?.[m] || 0), 0),
        [data]
    );

    const totalPeriodAlloc = useCallback(
        (cat: string, months: readonly number[]) =>
            salesPeople.reduce((s, sp) => s + personPeriodValue(cat, sp.id, months), 0),
        [salesPeople, personPeriodValue]
    );

    const handleSave = useCallback(async () => {
        setLoading(true);
        const result = await saveMetasEquipe(ano, data);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else toast.success("Metas da equipe salvas com sucesso!");
    }, [ano, data]);

    return {
        data,
        view,
        setView,
        loading,
        setMonthValue,
        setQuarterValue,
        personPeriodValue,
        totalPeriodAlloc,
        handleSave,
    };
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function MetasEquipeGrid({
    ano,
    salesPeople,
    categorias,
    initialData,
    metasGlobais,
}: MetasEquipeGridProps) {
    const {
        data,
        view,
        setView,
        loading,
        setMonthValue,
        setQuarterValue,
        personPeriodValue,
        totalPeriodAlloc,
        handleSave,
    } = useMetasEquipeGrid(ano, initialData, salesPeople, categorias);

    const isTrimestral = view === "trimestral";

    const periods = isTrimestral
        ? QUARTERS.map((q) => ({ label: q.label, months: q.months, color: q.color, sublabel: q.months.map((m) => MESES[m - 1]).join(" · ") }))
        : Array.from({ length: 12 }, (_, i) => ({
              label: MESES[i],
              months: [i + 1] as const,
              color: "#64748B",
              sublabel: String(ano),
          }));

    return (
        <div className="space-y-4">
            {/* Header global */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
                    <button
                        onClick={() => setView("trimestral")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isTrimestral ? "bg-white text-[#1E293B] shadow-sm" : "text-[#64748B] hover:text-[#1E293B]"}`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Trimestral
                    </button>
                    <button
                        onClick={() => setView("mensal")}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${!isTrimestral ? "bg-white text-[#1E293B] shadow-sm" : "text-[#64748B] hover:text-[#1E293B]"}`}
                    >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Mensal
                    </button>
                </div>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#E91E8C] px-5 text-white hover:bg-[#D4177F]"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Metas
                        </>
                    )}
                </Button>
            </div>

            {/* Um card por período */}
            {periods.map((period) => (
                <PeriodCard
                    key={period.label}
                    ano={ano}
                    period={period}
                    categorias={categorias}
                    salesPeople={salesPeople}
                    data={data}
                    metasGlobais={metasGlobais}
                    isTrimestral={isTrimestral}
                    personPeriodValue={personPeriodValue}
                    totalPeriodAlloc={totalPeriodAlloc}
                    onSetMonth={setMonthValue}
                    onSetQuarter={setQuarterValue}
                />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// PeriodCard — um card por quarter ou por mês
// ---------------------------------------------------------------------------

interface PeriodInfo {
    label: string;
    months: readonly number[];
    color: string;
    sublabel: string;
}

interface PeriodCardProps {
    ano: number;
    period: PeriodInfo;
    categorias: string[];
    salesPeople: SalesPerson[];
    data: MetasEquipeData;
    metasGlobais: MetasByCategory;
    isTrimestral: boolean;
    personPeriodValue: (cat: string, personId: number, months: readonly number[]) => number;
    totalPeriodAlloc: (cat: string, months: readonly number[]) => number;
    onSetMonth: (cat: string, personId: number, mes: number, val: number) => void;
    onSetQuarter: (cat: string, personId: number, months: readonly number[], total: number) => void;
}

function PeriodCard({
    ano,
    period,
    categorias,
    salesPeople,
    data,
    metasGlobais,
    isTrimestral,
    personPeriodValue,
    totalPeriodAlloc,
    onSetMonth,
    onSetQuarter,
}: PeriodCardProps) {
    // Total da meta global para o período
    function globalPeriodMeta(cat: string): number {
        return period.months.reduce((s, m) => s + (metasGlobais[cat]?.[m] || 0), 0);
    }

    // Totais da linha de totais (por pessoa)
    function personGrandTotal(personId: number): number {
        return categorias.reduce((s, cat) => s + personPeriodValue(cat, personId, period.months), 0);
    }
    const totalAllocGrand = categorias.reduce(
        (s, cat) => s + totalPeriodAlloc(cat, period.months),
        0
    );
    const totalGlobalGrand = categorias.reduce((s, cat) => s + globalPeriodMeta(cat), 0);

    return (
        <Card className="w-full min-w-0 overflow-hidden rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {/* Period header */}
            <div
                className="flex items-center gap-3 px-6 py-3 border-b border-[#F1F1F1]"
                style={{ borderLeft: `4px solid ${period.color}` }}
            >
                <span className="text-sm font-bold" style={{ color: period.color }}>
                    {period.label}
                </span>
                <span className="text-xs text-[#64748B]">/</span>
                <span className="text-xs text-[#64748B]">{period.sublabel}</span>
                <span className="text-xs text-[#64748B]">{ano}</span>
            </div>

            <CardContent className="p-0 min-w-0">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        <TableRow className="border-b border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                            {/* KRs */}
                            <TableHead className={`${STICKY_CELL} bg-[#F8FAFC] z-30 text-[10px] font-bold uppercase tracking-widest text-[#64748B] border-[#E2E8F0]`}>
                                KRs
                            </TableHead>
                            {/* Meta total (global) */}
                            <TableHead className="min-w-[130px] border-r border-[#E2E8F0] bg-[#1A1A1A] text-right text-[10px] font-bold uppercase tracking-widest text-white px-3">
                                Meta {ano}
                            </TableHead>
                            {/* Período total */}
                            <TableHead
                                className="min-w-[130px] border-r border-[#E2E8F0] text-right text-[10px] font-bold uppercase tracking-widest text-white px-3"
                                style={{ backgroundColor: period.color }}
                            >
                                {period.label}/{ano}
                            </TableHead>
                            {/* Colunas por pessoa */}
                            {salesPeople.map((sp) => (
                                <TableHead
                                    key={sp.id}
                                    className="min-w-[120px] px-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#64748B]"
                                >
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span>{sp.nome.split(" ")[0]}</span>
                                        <span className="text-[9px] font-normal text-[#94A3B8] normal-case">{sp.cargo}</span>
                                    </div>
                                </TableHead>
                            ))}
                            {/* Alocado */}
                            <TableHead className="min-w-[120px] border-l border-[#E2E8F0] bg-[#F1F5F9] text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B] px-3">
                                Alocado
                            </TableHead>
                            {/* Saldo */}
                            <TableHead className="min-w-[120px] border-l border-[#E2E8F0] bg-[#F1F5F9] text-right text-[10px] font-bold uppercase tracking-widest text-[#64748B] px-3">
                                Saldo
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categorias.map((cat) => {
                            const globalMeta = globalPeriodMeta(cat);
                            const globalAnual = Object.values(metasGlobais[cat] || {}).reduce((s, v) => s + v, 0);
                            const alocado = totalPeriodAlloc(cat, period.months);
                            const saldo = globalMeta - alocado;
                            const color = getCatColor(cat);

                            return (
                                <TableRow
                                    key={cat}
                                    className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]/50"
                                >
                                    {/* Categoria */}
                                    <TableCell className={`${STICKY_CELL} bg-white font-semibold text-sm text-[#1E293B] whitespace-nowrap`}>
                                        <div className="flex items-center gap-2.5">
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                            {cat}
                                        </div>
                                    </TableCell>
                                    {/* Meta anual (global, readonly) */}
                                    <TableCell className="border-r border-[#E2E8F0] bg-[#1A1A1A]/5 text-right px-3">
                                        <span className="font-mono text-xs font-semibold text-[#1E293B]">
                                            {formatMoney(globalAnual)}
                                        </span>
                                    </TableCell>
                                    {/* Meta período (global, readonly) */}
                                    <TableCell className="border-r border-[#E2E8F0] text-right px-3" style={{ backgroundColor: `${period.color}15` }}>
                                        <span className="font-mono text-xs font-semibold" style={{ color: period.color }}>
                                            {formatMoney(globalMeta)}
                                        </span>
                                    </TableCell>
                                    {/* Por pessoa */}
                                    {salesPeople.map((sp) => {
                                        const val = personPeriodValue(cat, sp.id, period.months);
                                        return (
                                            <TableCell key={sp.id} className="p-1 px-1.5">
                                                <div className="group relative">
                                                    {isTrimestral ? (
                                                        <CurrencyInput
                                                            value={val}
                                                            onChange={(v) => onSetQuarter(cat, sp.id, period.months, v)}
                                                            ariaLabel={`${cat} - ${sp.nome} - ${period.label}`}
                                                        />
                                                    ) : (
                                                        <CurrencyInput
                                                            value={val}
                                                            onChange={(v) => onSetMonth(cat, sp.id, period.months[0], v)}
                                                            ariaLabel={`${cat} - ${sp.nome} - ${period.label}`}
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                    {/* Alocado */}
                                    <TableCell className="border-l border-[#F1F5F9] bg-[#F8FAFC] text-right px-3">
                                        <span className="font-mono text-xs font-bold" style={{ color }}>
                                            {formatMoney(alocado)}
                                        </span>
                                    </TableCell>
                                    {/* Saldo */}
                                    <TableCell className="border-l border-[#F1F5F9] bg-[#F8FAFC] text-right px-3">
                                        <SaldoBadge saldo={saldo} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Linha de totais */}
                        <TableRow className="border-t-2 border-[#E0E0E0] bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                            <TableCell className={`${STICKY_CELL} bg-[#FAFAFA] font-bold text-xs uppercase tracking-wider text-[#616161] border-[#E2E8F0]`}>
                                Total
                            </TableCell>
                            <TableCell className="border-r border-[#E2E8F0] bg-[#1A1A1A]/5 text-right px-3">
                                <span className="font-mono text-xs font-bold text-[#1E293B]">
                                    {formatMoney(categorias.reduce((s, cat) => s + Object.values(metasGlobais[cat] || {}).reduce((a, b) => a + b, 0), 0))}
                                </span>
                            </TableCell>
                            <TableCell className="border-r border-[#E2E8F0] text-right px-3" style={{ backgroundColor: `${period.color}15` }}>
                                <span className="font-mono text-xs font-bold" style={{ color: period.color }}>
                                    {formatMoney(totalGlobalGrand)}
                                </span>
                            </TableCell>
                            {salesPeople.map((sp) => (
                                <TableCell key={sp.id} className="text-right px-2">
                                    <span className="font-mono text-xs font-semibold text-[#1A1A1A]">
                                        {formatMoney(personGrandTotal(sp.id))}
                                    </span>
                                </TableCell>
                            ))}
                            <TableCell className="border-l border-[#F1F5F9] bg-[#F0F0F3] text-right px-3">
                                <span className="font-mono text-sm font-bold text-[#E91E8C]">
                                    {formatMoney(totalAllocGrand)}
                                </span>
                            </TableCell>
                            <TableCell className="border-l border-[#F1F5F9] bg-[#F0F0F3] text-right px-3">
                                <SaldoBadge saldo={totalGlobalGrand - totalAllocGrand} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// SaldoBadge — verde se saldo ≥ 0, vermelho se negativo
// ---------------------------------------------------------------------------

function SaldoBadge({ saldo }: { saldo: number }) {
    const isOver = saldo < 0;
    return (
        <span
            className={`inline-block font-mono text-xs font-bold tabular-nums ${
                isOver ? "text-red-500" : "text-[#00C896]"
            }`}
        >
            {isOver ? "−" : "+"}
            {formatMoney(Math.abs(saldo))}
        </span>
    );
}
