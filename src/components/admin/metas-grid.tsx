"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Loader2, Target } from "lucide-react";
import { MESES, CATEGORIAS, CORES_CATEGORIA, formatMoney } from "@/lib/utils";
import { saveMetas } from "@/lib/actions/admin";
import { toast } from "sonner";

interface MetasGridProps {
    ano: number;
    initialMetas: Record<string, Record<number, number>>;
}

const CAT_COLORS: Record<string, string> = {
    "Novo Cliente": "#00C896",
    "Cliente Recorrente": "#3A86FF",
    "Horas Extras": "#8A2BE2",
    "Renovacao": "#FFC857",
};

export function MetasGrid({ ano, initialMetas }: MetasGridProps) {
    const [loading, setLoading] = useState(false);
    const [metas, setMetas] = useState(initialMetas);

    function setMetaValue(cat: string, mes: number, val: number) {
        setMetas((prev) => ({
            ...prev,
            [cat]: { ...prev[cat], [mes]: val },
        }));
    }

    async function handleSave() {
        setLoading(true);
        const result = await saveMetas(ano, metas);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else toast.success("Metas salvas com sucesso!");
    }

    // Calculate row totals
    function rowTotal(cat: string): number {
        return Object.values(metas[cat] || {}).reduce((s, v) => s + v, 0);
    }

    // Calculate column totals
    function colTotal(mes: number): number {
        return CATEGORIAS.reduce((s, cat) => s + (metas[cat]?.[mes] || 0), 0);
    }

    const grandTotal = CATEGORIAS.reduce((s, cat) => s + rowTotal(cat), 0);

    return (
        <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#E91E8C]" />
                    <h3 className="font-semibold text-sm">Metas {ano}</h3>
                </div>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-5"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Metas
                        </>
                    )}
                </Button>
            </div>

            {/* Grid */}
            <CardContent className="overflow-x-auto p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="sticky left-0 bg-[#F5F6FA] z-10 text-xs font-semibold uppercase tracking-wider text-[#616161] min-w-[140px]">
                                Categoria
                            </TableHead>
                            {MESES.map((m) => (
                                <TableHead key={m} className="text-center text-xs font-semibold uppercase tracking-wider text-[#616161] min-w-[90px]">
                                    {m.slice(0, 3)}
                                </TableHead>
                            ))}
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#616161] min-w-[110px] bg-[#F0F0F3]">
                                Total
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {CATEGORIAS.map((cat) => {
                            const color = CAT_COLORS[cat] || "#999";
                            const total = rowTotal(cat);

                            return (
                                <TableRow key={cat} className="hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            {cat}
                                        </div>
                                    </TableCell>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                        <TableCell key={mes} className="p-1">
                                            <input
                                                type="number"
                                                className="w-full h-8 rounded-lg bg-[#F5F6FA] border-transparent px-2 text-xs text-right font-mono transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none"
                                                value={metas[cat]?.[mes] || 0}
                                                onChange={(e) => setMetaValue(cat, mes, parseFloat(e.target.value) || 0)}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right bg-[#FAFAFA]">
                                        <span className="font-mono font-semibold text-xs" style={{ color }}>
                                            {formatMoney(total)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Column totals */}
                        <TableRow className="border-t-2 border-[#E0E0E0] bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                            <TableCell className="sticky left-0 bg-[#FAFAFA] z-10 font-bold text-xs uppercase tracking-wider text-[#616161]">
                                Total
                            </TableCell>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                <TableCell key={mes} className="text-center">
                                    <span className="font-mono font-semibold text-xs text-[#1A1A1A]">
                                        {formatMoney(colTotal(mes))}
                                    </span>
                                </TableCell>
                            ))}
                            <TableCell className="text-right bg-[#F0F0F3]">
                                <span className="font-mono font-bold text-sm text-[#E91E8C]">
                                    {formatMoney(grandTotal)}
                                </span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
