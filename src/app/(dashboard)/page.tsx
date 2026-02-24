import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Target, TrendingUp, Percent, ShoppingCart } from "lucide-react";
import { formatMoney, formatPercent, CORES_CATEGORIA } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { YearSelector } from "@/components/dashboard/year-selector";

export default async function DashboardPage({
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

    // Realizado por categoria
    const { data: vendasAno } = await supabase
        .from("vendas")
        .select("categoria, valor")
        .eq("ano", anoSelecionado);

    const realizadoPorCategoria: Record<string, { total: number; qtd: number }> = {};
    vendasAno?.forEach((v) => {
        if (!realizadoPorCategoria[v.categoria]) {
            realizadoPorCategoria[v.categoria] = { total: 0, qtd: 0 };
        }
        realizadoPorCategoria[v.categoria].total += Number(v.valor) || 0;
        realizadoPorCategoria[v.categoria].qtd += 1;
    });

    // Metas por categoria
    const { data: metasData } = await supabase
        .from("metas")
        .select("categoria, valor_meta")
        .eq("ano", anoSelecionado)
        .not("mes", "is", null);

    const metasPorCategoria: Record<string, number> = {};
    metasData?.forEach((m) => {
        metasPorCategoria[m.categoria] = (metasPorCategoria[m.categoria] || 0) + Number(m.valor_meta);
    });

    // Totais
    const totalRealizado = Object.values(realizadoPorCategoria).reduce((s, v) => s + v.total, 0);
    const totalMeta = Object.values(metasPorCategoria).reduce((s, v) => s + v, 0);
    const totalVendas = Object.values(realizadoPorCategoria).reduce((s, v) => s + v.qtd, 0);
    const pctAtingido = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

    // Dados para gráficos (mensal)
    const { data: vendasMensal } = await supabase
        .from("vendas")
        .select("mes, categoria, valor")
        .eq("ano", anoSelecionado);

    // Mensal ano anterior
    const anoAnterior = anoSelecionado - 1;
    const { data: vendasAnterior } = await supabase
        .from("vendas")
        .select("mes, categoria, valor")
        .eq("ano", anoAnterior);

    // Preparar dados de chart
    const realizadoAnterior: Record<string, number> = {};
    vendasAnterior?.forEach((v) => {
        realizadoAnterior[v.categoria] = (realizadoAnterior[v.categoria] || 0) + Number(v.valor);
    });

    const mensalAtual: Record<number, number> = {};
    const mensalAnterior: Record<number, number> = {};
    const mensalPorCategoria: Record<number, Record<string, number>> = {};

    vendasMensal?.forEach((v) => {
        mensalAtual[v.mes] = (mensalAtual[v.mes] || 0) + Number(v.valor);
        if (!mensalPorCategoria[v.mes]) mensalPorCategoria[v.mes] = {};
        mensalPorCategoria[v.mes][v.categoria] =
            (mensalPorCategoria[v.mes][v.categoria] || 0) + Number(v.valor);
    });
    vendasAnterior?.forEach((v) => {
        mensalAnterior[v.mes] = (mensalAnterior[v.mes] || 0) + Number(v.valor);
    });

    const chartData = {
        realizadoPorCategoria,
        metasPorCategoria,
        realizadoAnterior,
        mensalAtual,
        mensalAnterior,
        mensalPorCategoria,
        anoSelecionado,
        anoAnterior,
    };

    const categorias = [
        ...new Set([
            ...Object.keys(realizadoPorCategoria),
            ...Object.keys(metasPorCategoria),
        ]),
    ];

    const kpis = [
        {
            label: "Meta Total",
            value: formatMoney(totalMeta),
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Realizado",
            value: formatMoney(totalRealizado),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "% Atingido",
            value: formatPercent(pctAtingido),
            icon: Percent,
            color:
                pctAtingido >= 100
                    ? "text-emerald-600"
                    : pctAtingido >= 70
                        ? "text-amber-600"
                        : "text-red-600",
            bg:
                pctAtingido >= 100
                    ? "bg-emerald-50"
                    : pctAtingido >= 70
                        ? "bg-amber-50"
                        : "bg-red-50",
        },
        {
            label: "Total de Vendas",
            value: totalVendas.toString(),
            icon: ShoppingCart,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Visão geral do desempenho comercial
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className="overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {kpi.label}
                                    </p>
                                    <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                                        {kpi.value}
                                    </p>
                                </div>
                                <div
                                    className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center`}
                                >
                                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <DashboardCharts data={chartData} />

            {/* Tabela detalhada */}
            <Card>
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Detalhamento por Categoria</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Meta</TableHead>
                            <TableHead className="text-right">Realizado</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead className="text-right">Qtd. Vendas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categorias.map((cat) => {
                            const meta = metasPorCategoria[cat] || 0;
                            const real = realizadoPorCategoria[cat]?.total || 0;
                            const pct = meta > 0 ? (real / meta) * 100 : 0;
                            const qtd = realizadoPorCategoria[cat]?.qtd || 0;
                            const cor = CORES_CATEGORIA[cat];

                            return (
                                <TableRow key={cat}>
                                    <TableCell>
                                        <Badge
                                            className={`${cor?.tw || "bg-gray-500"} text-white hover:opacity-80`}
                                        >
                                            {cat}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatMoney(meta)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatMoney(real)}
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-semibold ${pct >= 100
                                                ? "text-emerald-600"
                                                : pct >= 70
                                                    ? "text-amber-600"
                                                    : "text-red-600"
                                            }`}
                                    >
                                        {formatPercent(pct)}
                                    </TableCell>
                                    <TableCell className="text-right">{qtd}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
