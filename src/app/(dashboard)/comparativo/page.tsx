import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, MESES } from "@/lib/utils";
import { ComparativoChart } from "@/components/comparativo/comparativo-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

    // Trimestral
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
                    <p className="text-muted-foreground">
                        Análise comparativa de faturamento {anoSelecionado} vs {anoAnterior}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground font-medium">Total {anoSelecionado}</p>
                        <p className="text-3xl font-bold tracking-tight mt-1 text-[#1F1F1F]">{formatMoney(totalAtual)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground font-medium">Total {anoAnterior}</p>
                        <p className="text-3xl font-bold tracking-tight mt-1 text-[#1F1F1F]">{formatMoney(totalAnterior)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground font-medium">Diferença</p>
                        <div className="mt-1">
                            <DiffBadge value={diferenca} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Line Chart */}
            <ComparativoChart data={chartData} />

            {/* Visão Trimestral */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Visão Trimestral</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {trimestreData.map((q) => (
                        <Card key={q.label} className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                            <CardContent className="p-5">
                                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">{q.label}</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{anoSelecionado}</span>
                                        <span className="font-mono font-medium">{formatMoney(q.atual)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{anoAnterior}</span>
                                        <span className="font-mono font-medium">{formatMoney(q.anterior)}</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                    <DiffBadge value={q.diff} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Detalhamento Mensal */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Detalhamento Mensal</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mês</TableHead>
                            <TableHead className="text-right">{anoSelecionado}</TableHead>
                            <TableHead className="text-right">{anoAnterior}</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mensalDetalhe.map((row) => (
                            <TableRow key={row.mes}>
                                <TableCell className="font-medium">{row.mes}</TableCell>
                                <TableCell className="text-right font-mono">{formatMoney(row.atual)}</TableCell>
                                <TableCell className="text-right font-mono">{formatMoney(row.anterior)}</TableCell>
                                <TableCell className="text-right">
                                    <DiffBadge value={row.diff} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* Total row */}
                        <TableRow className="border-t-2 font-bold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono">{formatMoney(totalAtual)}</TableCell>
                            <TableCell className="text-right font-mono">{formatMoney(totalAnterior)}</TableCell>
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
