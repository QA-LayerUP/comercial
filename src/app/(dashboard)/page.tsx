import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatPercent, CORES_CATEGORIA, CATEGORIAS } from "@/lib/utils";
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
    const anoAnterior = anoSelecionado - 1;

    // Vendas do ano selecionado
    const { data: vendasAno } = await supabase
        .from("vendas")
        .select("mes, categoria, valor, nome_cliente")
        .eq("ano", anoSelecionado);

    // Vendas do ano anterior
    const { data: vendasAnterior } = await supabase
        .from("vendas")
        .select("mes, categoria, valor")
        .eq("ano", anoAnterior);

    // Metas por categoria
    const { data: metasData } = await supabase
        .from("metas")
        .select("categoria, valor_meta")
        .eq("ano", anoSelecionado)
        .not("mes", "is", null);

    // Meta anual total (sum de metas sem mês = meta anual, ou soma das metas mensais)
    const { data: metaAnualData } = await supabase
        .from("metas")
        .select("categoria, valor_meta")
        .eq("ano", anoSelecionado)
        .is("mes", null);

    // Realizado por categoria
    const realizadoPorCategoria: Record<string, { total: number; qtd: number }> = {};
    vendasAno?.forEach((v) => {
        if (!realizadoPorCategoria[v.categoria]) {
            realizadoPorCategoria[v.categoria] = { total: 0, qtd: 0 };
        }
        realizadoPorCategoria[v.categoria].total += Number(v.valor) || 0;
        realizadoPorCategoria[v.categoria].qtd += 1;
    });

    // Metas por categoria (soma mensal)
    const metasPorCategoria: Record<string, number> = {};
    metasData?.forEach((m) => {
        metasPorCategoria[m.categoria] = (metasPorCategoria[m.categoria] || 0) + Number(m.valor_meta);
    });

    // Meta anual por categoria (se houver)
    const metaAnualPorCategoria: Record<string, number> = {};
    metaAnualData?.forEach((m) => {
        metaAnualPorCategoria[m.categoria] = Number(m.valor_meta);
    });

    // Normalize helper — remove accents para evitar duplicatas (ex: "Renovacao" vs "Renovação")
    function normalizeKey(key: string): string {
        return key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function findValue<T>(map: Record<string, T>, key: string): T | undefined {
        // Exact match first
        if (map[key] !== undefined) return map[key];
        // Normalized match
        const normKey = normalizeKey(key);
        for (const k of Object.keys(map)) {
            if (normalizeKey(k) === normKey) return map[k];
        }
        return undefined;
    }

    // Use meta anual se existir, senão soma mensal
    const metaFinalPorCategoria: Record<string, number> = {};
    // Usar CATEGORIAS fixas para evitar duplicatas
    CATEGORIAS.forEach((cat) => {
        metaFinalPorCategoria[cat] = findValue(metaAnualPorCategoria, cat) ?? findValue(metasPorCategoria, cat) ?? 0;
    });

    // Totais
    const totalRealizado = Object.values(realizadoPorCategoria).reduce((s, v) => s + v.total, 0);
    const totalMeta = Object.values(metaFinalPorCategoria).reduce((s, v) => s + v, 0);
    const pctAtingido = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

    // Mensal
    const mensalAtual: Record<number, number> = {};
    const mensalAnterior: Record<number, number> = {};
    const mensalPorCategoria: Record<number, Record<string, number>> = {};

    vendasAno?.forEach((v) => {
        mensalAtual[v.mes] = (mensalAtual[v.mes] || 0) + Number(v.valor);
        if (!mensalPorCategoria[v.mes]) mensalPorCategoria[v.mes] = {};
        mensalPorCategoria[v.mes][v.categoria] =
            (mensalPorCategoria[v.mes][v.categoria] || 0) + Number(v.valor);
    });
    vendasAnterior?.forEach((v) => {
        mensalAnterior[v.mes] = (mensalAnterior[v.mes] || 0) + Number(v.valor);
    });

    // Top 10 Clientes
    const clienteMap: Record<string, number> = {};
    vendasAno?.forEach((v) => {
        clienteMap[v.nome_cliente] = (clienteMap[v.nome_cliente] || 0) + Number(v.valor);
    });
    const top10Clientes = Object.entries(clienteMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([nome, valor]) => ({ nome, valor }));

    // Category cards — sempre 4 cards fixos
    const categoryCards = CATEGORIAS.map((cat) => {
        const realizadoEntry = findValue(realizadoPorCategoria, cat);
        const realizado = realizadoEntry?.total || 0;
        const meta = metaFinalPorCategoria[cat] || 0;
        const pct = meta > 0 ? (realizado / meta) * 100 : 0;
        const cor = CORES_CATEGORIA[cat];
        return { categoria: cat, realizado, meta, pct, cor };
    });

    const chartData = {
        realizadoPorCategoria,
        metaFinalPorCategoria,
        mensalAtual,
        mensalAnterior,
        mensalPorCategoria,
        top10Clientes,
        anoSelecionado,
        anoAnterior,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Comercial</h1>
                    <p className="text-muted-foreground">
                        Visão geral das metas e resultados — {anoSelecionado}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* Hero Card */}
            <Card className="overflow-hidden bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white border-0 rounded-2xl shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-white/70 text-sm font-medium">
                                Total Realizado {anoSelecionado}
                            </p>
                            <p className="text-4xl font-bold mt-1 tracking-tight">
                                {formatMoney(totalRealizado)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/70 text-sm font-medium">Meta Anual</p>
                            <p className="text-2xl font-bold mt-1">
                                {formatMoney(totalMeta)}
                            </p>
                            <p className="text-white/70 text-sm mt-0.5">
                                {formatPercent(pctAtingido)} atingido
                            </p>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-white/15 rounded-full h-3">
                        <div
                            className="bg-[#E91E8C] rounded-full h-3 transition-all duration-500"
                            style={{ width: `${Math.min(pctAtingido, 100)}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categoryCards.map((card) => {
                    const pctColor = card.pct >= 100 ? "text-[#00C896]" : "text-[#E63946]";
                    return (
                        <Card key={card.categoria} className="overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        {card.categoria}
                                    </h3>
                                    <span className={`text-sm font-semibold ${pctColor}`}>
                                        {card.pct >= 100 ? "↗" : "↘"} {formatPercent(card.pct)}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
                                    {formatMoney(card.realizado)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Meta: {formatMoney(card.meta)}
                                </p>
                                {/* Progress bar */}
                                <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                                    <div
                                        className="rounded-full h-1.5 transition-all duration-500"
                                        style={{
                                            width: `${Math.min(card.pct, 100)}%`,
                                            backgroundColor: card.cor?.border || "#FFC857",
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <DashboardCharts data={chartData} />
        </div>
    );
}
