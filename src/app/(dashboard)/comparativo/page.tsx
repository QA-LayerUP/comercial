import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatMoney, MESES } from "@/lib/utils";
import { ComparativoChart } from "@/components/comparativo/comparativo-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    BarChart3,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

function calcPct(atual: number, anterior: number): number | null {
    if (anterior === 0) return null;
    return ((atual - anterior) / anterior) * 100;
}

function PctBadge({ atual, anterior }: { atual: number; anterior: number }) {
    const p = calcPct(atual, anterior);
    if (p === null)
        return <span className="text-xs text-muted-foreground font-mono">—</span>;
    if (Math.abs(p) < 0.05)
        return <span className="text-xs text-muted-foreground font-mono">0%</span>;
    const positive = p > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                positive
                    ? "bg-[#00C896]/10 text-[#00C896]"
                    : "bg-[#E63946]/10 text-[#E63946]"
            }`}
        >
            {positive ? (
                <ArrowUpRight className="w-3 h-3" />
            ) : (
                <ArrowDownRight className="w-3 h-3" />
            )}
            {positive ? "+" : ""}
            {p.toFixed(1)}%
        </span>
    );
}

function DiffBadge({ value }: { value: number }) {
    if (value === 0) {
        return (
            <span className="text-muted-foreground font-mono text-sm flex items-center gap-1">
                <Minus className="w-3.5 h-3.5" />
                R$&nbsp;0
            </span>
        );
    }
    const positive = value > 0;
    return (
        <span
            className={`font-mono text-sm font-semibold flex items-center gap-1 ${
                positive ? "text-[#00C896]" : "text-[#E63946]"
            }`}
        >
            {positive ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            )}
            {positive ? "+" : ""}
            {formatMoney(value)}
        </span>
    );
}

export default async function ComparativoPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    const { data: anosData } = await supabase
        .from("vendas")
        .select("ano")
        .order("ano", { ascending: false });

    const anos = [...new Set(anosData?.map((v) => v.ano) || [])];
    if (anos.length === 0) anos.push(new Date().getFullYear());

    const anoSelecionado = params.ano ? parseInt(params.ano) : anos[0];
    const anoAnterior = anoSelecionado - 1;

    const [{ data: vendasAtual }, { data: vendasAnterior }] = await Promise.all([
        supabase.from("vendas").select("mes, valor").eq("ano", anoSelecionado),
        supabase.from("vendas").select("mes, valor").eq("ano", anoAnterior),
    ]);

    const mensalAtual: Record<number, number> = {};
    const mensalAnterior: Record<number, number> = {};

    vendasAtual?.forEach((v) => {
        mensalAtual[v.mes] = (mensalAtual[v.mes] || 0) + Number(v.valor);
    });
    vendasAnterior?.forEach((v) => {
        mensalAnterior[v.mes] = (mensalAnterior[v.mes] || 0) + Number(v.valor);
    });

    const totalAtual = Object.values(mensalAtual).reduce((s, v) => s + v, 0);
    const totalAnterior = Object.values(mensalAnterior).reduce((s, v) => s + v, 0);
    const diferenca = totalAtual - totalAnterior;

    const trimestres = [
        { label: "Q1", meses: [1, 2, 3] },
        { label: "Q2", meses: [4, 5, 6] },
        { label: "Q3", meses: [7, 8, 9] },
        { label: "Q4", meses: [10, 11, 12] },
    ];

    const trimestreData = trimestres.map((q) => {
        const atual = q.meses.reduce((s, m) => s + (mensalAtual[m] || 0), 0);
        const anterior = q.meses.reduce((s, m) => s + (mensalAnterior[m] || 0), 0);
        return { label: q.label, atual, anterior, diff: atual - anterior };
    });

    const mensalDetalhe = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const atual = mensalAtual[mes] || 0;
        const anterior = mensalAnterior[mes] || 0;
        return { mes: MESES[i], atual, anterior, diff: atual - anterior };
    });

    // melhor mês do ano atual
    const maxMensal = Math.max(...Object.values(mensalAtual), 1);

    const chartData = { mensalAtual, mensalAnterior, anoSelecionado, anoAnterior };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comparativo Anual</h1>
                    <p className="text-sm text-muted-foreground">
                        Análise de faturamento {anoSelecionado} vs {anoAnterior}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ano atual */}
                <Card className="rounded-2xl border-0 shadow-[0_4px_16px_rgba(233,30,140,0.08)] bg-gradient-to-br from-[#E91E8C]/5 to-transparent">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm text-muted-foreground font-medium">
                                Total {anoSelecionado}
                            </p>
                            <span className="p-2 bg-[#E91E8C]/10 rounded-xl">
                                <TrendingUp className="w-4 h-4 text-[#E91E8C]" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">
                            {formatMoney(totalAtual)}
                        </p>
                        {totalAnterior > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                <PctBadge atual={totalAtual} anterior={totalAnterior} />
                                <span className="text-xs text-muted-foreground">
                                    vs {anoAnterior}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ano anterior */}
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm text-muted-foreground font-medium">
                                Total {anoAnterior}
                            </p>
                            <span className="p-2 bg-muted rounded-xl">
                                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight text-muted-foreground">
                            {formatMoney(totalAnterior)}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">Referência anterior</p>
                    </CardContent>
                </Card>

                {/* Variação */}
                <Card
                    className={`rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${
                        diferenca > 0
                            ? "bg-gradient-to-br from-[#00C896]/5 to-transparent"
                            : diferenca < 0
                            ? "bg-gradient-to-br from-[#E63946]/5 to-transparent"
                            : ""
                    }`}
                >
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm text-muted-foreground font-medium">Variação</p>
                            <span
                                className={`p-2 rounded-xl ${
                                    diferenca > 0
                                        ? "bg-[#00C896]/10"
                                        : diferenca < 0
                                        ? "bg-[#E63946]/10"
                                        : "bg-muted"
                                }`}
                            >
                                {diferenca > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-[#00C896]" />
                                ) : diferenca < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-[#E63946]" />
                                ) : (
                                    <Minus className="w-4 h-4 text-muted-foreground" />
                                )}
                            </span>
                        </div>
                        <div className="text-3xl font-bold tracking-tight">
                            <DiffBadge value={diferenca} />
                        </div>
                        <div className="mt-2">
                            <PctBadge atual={totalAtual} anterior={totalAnterior} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <ComparativoChart data={chartData} />

            {/* Visão Trimestral */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-base font-semibold">Visão Trimestral</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {trimestreData.map((q) => {
                        const maxVal = Math.max(q.atual, q.anterior, 1);
                        const barAtual = (q.atual / maxVal) * 100;
                        const barAnterior = (q.anterior / maxVal) * 100;
                        return (
                            <Card
                                key={q.label}
                                className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {q.label}
                                        </h3>
                                        <PctBadge atual={q.atual} anterior={q.anterior} />
                                    </div>

                                    <p className="text-xl font-bold mt-1">
                                        {formatMoney(q.atual)}
                                    </p>

                                    {/* Mini progress bars */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 text-xs text-[#E91E8C] font-semibold shrink-0">
                                                {String(anoSelecionado).slice(2)}
                                            </span>
                                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-[#E91E8C] h-full rounded-full"
                                                    style={{ width: `${barAtual}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 text-xs text-muted-foreground font-semibold shrink-0">
                                                {String(anoAnterior).slice(2)}
                                            </span>
                                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-[#BDBDBD] h-full rounded-full"
                                                    style={{ width: `${barAnterior}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t">
                                        <DiffBadge value={q.diff} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Detalhamento Mensal */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Detalhamento Mensal</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                                Mês
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                                {anoSelecionado}
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                                {anoAnterior}
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                                Diferença
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                                Var %
                            </TableHead>
                            <TableHead className="w-28 pl-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                                Participação
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mensalDetalhe.map((row) => {
                            const participacao =
                                totalAtual > 0 ? (row.atual / totalAtual) * 100 : 0;
                            return (
                                <TableRow key={row.mes} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{row.mes}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {row.atual > 0 ? (
                                            formatMoney(row.atual)
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                        {row.anterior > 0 ? (
                                            formatMoney(row.anterior)
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(row.atual > 0 || row.anterior > 0) ? (
                                            <DiffBadge value={row.diff} />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(row.atual > 0 || row.anterior > 0) ? (
                                            <PctBadge atual={row.atual} anterior={row.anterior} />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="pl-3 hidden sm:table-cell">
                                        {row.atual > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-[#E91E8C]/60 h-full rounded-full"
                                                        style={{
                                                            width: `${(row.atual / maxMensal) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-10 text-right">
                                                    {participacao.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Total row */}
                        <TableRow className="border-t-2 bg-muted/20 font-bold hover:bg-muted/20">
                            <TableCell className="font-bold text-sm">Total</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                                {formatMoney(totalAtual)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-muted-foreground">
                                {formatMoney(totalAnterior)}
                            </TableCell>
                            <TableCell className="text-right">
                                <DiffBadge value={diferenca} />
                            </TableCell>
                            <TableCell className="text-right">
                                <PctBadge atual={totalAtual} anterior={totalAnterior} />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell" />
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
