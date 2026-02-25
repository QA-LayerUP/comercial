import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, MESES } from "@/lib/utils";
import { ComparativoChart } from "@/components/comparativo/comparativo-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart3, Calendar } from "lucide-react";

export default async function ComparativoPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    // Anos disponíveis
    const { data: anosData } = await supabase
        .from("vendas")
        .select("ano")
        .order("ano", { ascending: false });

    const anos = [...new Set(anosData?.map((v) => v.ano) || [])];
    if (anos.length === 0) anos.push(new Date().getFullYear());

    const anoSelecionado = params.ano ? parseInt(params.ano) : anos[0];
    const anoAnterior = anoSelecionado - 1;

    // Vendas de ambos os anos
    const { data: vendasAtual } = await supabase
        .from("vendas")
        .select("mes, valor")
        .eq("ano", anoSelecionado);

    const { data: vendasAnterior } = await supabase
        .from("vendas")
        .select("mes, valor")
        .eq("ano", anoAnterior);

    // Mensal
    const mensalAtual: Record<number, number> = {};
    const mensalAnterior: Record<number, number> = {};

    vendasAtual?.forEach((v) => {
        mensalAtual[v.mes] = (mensalAtual[v.mes] || 0) + Number(v.valor);
    });
    vendasAnterior?.forEach((v) => {
        mensalAnterior[v.mes] = (mensalAnterior[v.mes] || 0) + Number(v.valor);
    });

    // Totais
    const totalAtual = Object.values(mensalAtual).reduce((s, v) => s + v, 0);
    const totalAnterior = Object.values(mensalAnterior).reduce((s, v) => s + v, 0);
    const diferenca = totalAtual - totalAnterior;
    const pctChange = totalAnterior > 0 ? ((diferenca / totalAnterior) * 100) : 0;

    // Trimestral
    const trimestres = [
        { label: "Q1", meses: [1, 2, 3], color: "#E91E8C" },
        { label: "Q2", meses: [4, 5, 6], color: "#FFC857" },
        { label: "Q3", meses: [7, 8, 9], color: "#00C896" },
        { label: "Q4", meses: [10, 11, 12], color: "#3A86FF" },
    ];

    const trimestreData = trimestres.map((q) => {
        const atual = q.meses.reduce((s, m) => s + (mensalAtual[m] || 0), 0);
        const anterior = q.meses.reduce((s, m) => s + (mensalAnterior[m] || 0), 0);
        const diff = atual - anterior;
        const pct = anterior > 0 ? ((diff / anterior) * 100) : 0;
        return { ...q, atual, anterior, diff, pct };
    });

    // Mensal detalhado
    const mensalDetalhe = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const atual = mensalAtual[mes] || 0;
        const anterior = mensalAnterior[mes] || 0;
        return { mes: MESES[i], atual, anterior, diff: atual - anterior };
    });

    const chartData = {
        mensalAtual,
        mensalAnterior,
        anoSelecionado,
        anoAnterior,
    };

    const maxMensal = Math.max(
        ...mensalDetalhe.map(r => Math.max(r.atual, r.anterior)),
        1
    );

    function DiffBadge({ value }: { value: number }) {
        if (value === 0) {
            return (
                <span className="text-muted-foreground font-mono text-sm">
                    <Minus className="w-3.5 h-3.5 inline mr-1" />
                    R$ 0
                </span>
            );
        }
        const positive = value > 0;
        return (
            <span className={`font-mono text-sm font-semibold ${positive ? "text-[#00C896]" : "text-[#E63946]"}`}>
                {positive ? (
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                ) : (
                    <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                )}
                {positive ? "+" : ""}
                {formatMoney(value)}
            </span>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comparativo Year-over-Year</h1>
                    <p className="text-sm text-muted-foreground">
                        Análise comparativa de faturamento {anoSelecionado} vs {anoAnterior}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ano Atual - Yellow hero */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
                    <CardContent className="p-6 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total {anoSelecionado}</p>
                        <p className="text-3xl font-bold font-mono text-[#1A1A1A] mt-2">{formatMoney(totalAtual)}</p>
                    </CardContent>
                </Card>

                {/* Ano Anterior - Dark */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                    <CardContent className="p-6 relative">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Total {anoAnterior}</p>
                        <p className="text-3xl font-bold font-mono text-white mt-2">{formatMoney(totalAnterior)}</p>
                    </CardContent>
                </Card>

                {/* Diferença */}
                <Card className={`rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden relative ${diferenca >= 0 ? "bg-gradient-to-br from-[#00C896]/10 to-[#00C896]/5" : "bg-gradient-to-br from-[#E63946]/10 to-[#E63946]/5"}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -mr-8 -mt-8" />
                    <CardContent className="p-6 relative">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Diferença</p>
                        <div className="flex items-end gap-3 mt-2">
                            <span className={`text-3xl font-bold font-mono ${diferenca >= 0 ? "text-[#00C896]" : "text-[#E63946]"}`}>
                                {diferenca >= 0 ? "+" : ""}{formatMoney(diferenca)}
                            </span>
                        </div>
                        {totalAnterior > 0 && (
                            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${diferenca >= 0 ? "bg-[#00C896]/15 text-[#00C896]" : "bg-[#E63946]/15 text-[#E63946]"}`}>
                                {diferenca >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(pctChange).toFixed(1)}%
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Line Chart */}
            <ComparativoChart data={chartData} />

            {/* Visão Trimestral */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-[#E91E8C]" />
                    <h2 className="text-lg font-semibold">Visão Trimestral</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {trimestreData.map((q) => {
                        const isPositive = q.diff >= 0;
                        const maxVal = Math.max(q.atual, q.anterior, 1);

                        return (
                            <Card key={q.label} className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
                                <CardContent className="p-0">
                                    {/* Header with accent bar */}
                                    <div className="relative px-5 pt-5 pb-3">
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1"
                                            style={{ backgroundColor: q.color }}
                                        />
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-[#1A1A1A]">{q.label}</h3>
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: q.color + "18" }}
                                            >
                                                <BarChart3 className="w-4 h-4" style={{ color: q.color }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Year comparison with bars */}
                                    <div className="px-5 space-y-3">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-muted-foreground">{anoSelecionado}</span>
                                                <span className="font-mono text-sm font-semibold">{formatMoney(q.atual)}</span>
                                            </div>
                                            <div className="h-2 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${(q.atual / maxVal) * 100}%`,
                                                        backgroundColor: q.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-muted-foreground">{anoAnterior}</span>
                                                <span className="font-mono text-sm font-medium text-muted-foreground">{formatMoney(q.anterior)}</span>
                                            </div>
                                            <div className="h-2 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#D0D0D0] transition-all duration-500"
                                                    style={{ width: `${(q.anterior / maxVal) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Diff footer */}
                                    <div className="mx-5 mt-4 mb-5 pt-3 border-t border-[#F1F1F1] flex items-center justify-between">
                                        <DiffBadge value={q.diff} />
                                        {q.anterior > 0 && (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? "bg-[#00C896]/12 text-[#00C896]" : "bg-[#E63946]/12 text-[#E63946]"}`}>
                                                {isPositive ? "+" : ""}{q.pct.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Detalhamento Mensal */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Detalhamento Mensal</h3>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Mês</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">{anoSelecionado}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">{anoAnterior}</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Comparativo</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Diferença</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mensalDetalhe.map((row) => {
                            const maxRow = Math.max(row.atual, row.anterior, 1);
                            return (
                                <TableRow key={row.mes} className="hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell className="font-medium text-sm">{row.mes}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{formatMoney(row.atual)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatMoney(row.anterior)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 items-center min-w-[120px]">
                                            <div className="flex-1 h-1.5 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-[#E91E8C]" style={{ width: `${(row.atual / maxMensal) * 100}%` }} />
                                            </div>
                                            <div className="flex-1 h-1.5 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-[#D0D0D0]" style={{ width: `${(row.anterior / maxMensal) * 100}%` }} />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DiffBadge value={row.diff} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {/* Total row */}
                        <TableRow className="border-t-2 border-[#E0E0E0] bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                            <TableCell className="font-bold text-sm">Total</TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm">{formatMoney(totalAtual)}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm text-muted-foreground">{formatMoney(totalAnterior)}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right">
                                <DiffBadge value={diferenca} />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
