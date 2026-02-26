import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { EquipeChart } from "@/components/equipe/equipe-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
import { CargoTabs } from "@/components/equipe/cargo-tabs";
import type { SalesPerson, Venda } from "@/lib/types/database";
import { Users, TrendingUp, Award, BarChart2 } from "lucide-react";
import { Suspense } from "react";

const SP_FIELDS: { key: keyof Venda }[] = [
    { key: "vendedor1_id" },
    { key: "vendedor2_id" },
    { key: "sdr_id" },
    { key: "estrategia1_id" },
    { key: "estrategia2_id" },
    { key: "gestao_projetos_id" },
    { key: "customer_success_id" },
];

const CARGO_COLORS: Record<string, { bg: string; text: string; avatar: string; bar: string }> = {
    SDR:                    { bg: "bg-[#E91E8C]/10",  text: "text-[#E91E8C]",  avatar: "bg-[#E91E8C]/15 text-[#E91E8C]",  bar: "#E91E8C" },
    Vendedor:               { bg: "bg-[#3A86FF]/10",  text: "text-[#3A86FF]",  avatar: "bg-[#3A86FF]/15 text-[#3A86FF]",  bar: "#3A86FF" },
    Estrategia:             { bg: "bg-[#8B5CF6]/10",  text: "text-[#8B5CF6]",  avatar: "bg-[#8B5CF6]/15 text-[#8B5CF6]",  bar: "#8B5CF6" },
    "Gestao de projetos":   { bg: "bg-[#00C896]/10",  text: "text-[#00C896]",  avatar: "bg-[#00C896]/15 text-[#00C896]",  bar: "#00C896" },
    "Customer Success":     { bg: "bg-[#FFC857]/20",  text: "text-[#B8882A]",  avatar: "bg-[#FFC857]/20 text-[#B8882A]",  bar: "#FFC857" },
};

const CARGO_LABELS: Record<string, string> = {
    "Gestao de projetos": "Gestão de Projetos",
};

function cargoStyle(cargo: string) {
    return CARGO_COLORS[cargo] ?? { bg: "bg-muted", text: "text-muted-foreground", avatar: "bg-muted text-muted-foreground", bar: "#94A3B8" };
}

function initials(nome: string) {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const RANK_STYLE = [
    { bg: "bg-amber-400",   text: "text-amber-950" },
    { bg: "bg-slate-300",   text: "text-slate-800" },
    { bg: "bg-amber-600",   text: "text-amber-50"  },
];

export default async function EquipePage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string; cargo?: string }>;
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
    const cargoFiltro = params.cargo || "";

    const [{ data: salesPeople }, { data: vendas }] = await Promise.all([
        supabase.from("sales_people").select("*").eq("ativo", true).order("nome"),
        supabase.from("vendas").select("*").eq("ano", anoSelecionado),
    ]);

    const spMap = new Map<number, SalesPerson>();
    (salesPeople || []).forEach((sp) => spMap.set(sp.id, sp as SalesPerson));

    // Map: spId → stats
    const vendedorMap: Record<
        number,
        { nome: string; cargo: string; totalVendas: number; qtdVendas: number }
    > = {};

    (vendas || []).forEach((venda) => {
        const vistos = new Set<number>();
        SP_FIELDS.forEach(({ key }) => {
            const spId = venda[key] as number | null;
            if (spId && !vistos.has(spId)) {
                vistos.add(spId);
                const sp = spMap.get(spId);
                if (sp) {
                    if (!vendedorMap[spId]) {
                        vendedorMap[spId] = { nome: sp.nome, cargo: sp.cargo, totalVendas: 0, qtdVendas: 0 };
                    }
                    vendedorMap[spId].totalVendas += Number(venda.valor) || 0;
                    vendedorMap[spId].qtdVendas += 1;
                }
            }
        });
    });

    // Full ranking (for KPIs and chart)
    const rankingAll = Object.entries(vendedorMap)
        .map(([id, d]) => ({ id: Number(id), ...d }))
        .sort((a, b) => b.totalVendas - a.totalVendas);

    // Filtered ranking (for the list view)
    const ranking = cargoFiltro
        ? rankingAll.filter((v) => v.cargo === cargoFiltro)
        : rankingAll;

    // KPIs (always from full ranking)
    const totalFaturamento = (vendas || []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
    const totalParticipantes = rankingAll.length;
    const mediaVendedor = totalParticipantes > 0 ? totalFaturamento / totalParticipantes : 0;
    const topPerformer = rankingAll[0] ?? null;

    const maxVendas = ranking.length > 0 ? ranking[0].totalVendas : 1;
    const totalRankingVendas = ranking.reduce((s, v) => s + v.totalVendas, 0);

    // Chart data (filtered)
    const chartData = ranking.map((v) => ({
        nome: v.nome.split(" ")[0],
        nomeCompleto: v.nome,
        cargo: v.cargo,
        valor: v.totalVendas,
    }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Equipe Comercial</h1>
                    <p className="text-sm text-muted-foreground">
                        Performance de vendas por vendedor — {anoSelecionado}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Faturamento
                            </p>
                            <span className="p-1.5 bg-[#E91E8C]/10 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-[#E91E8C]" />
                            </span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{formatMoney(totalFaturamento)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{anoSelecionado}</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Participantes
                            </p>
                            <span className="p-1.5 bg-[#3A86FF]/10 rounded-lg">
                                <Users className="w-4 h-4 text-[#3A86FF]" />
                            </span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{totalParticipantes}</p>
                        <p className="text-xs text-muted-foreground mt-1">vendedores ativos</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Média / Vendedor
                            </p>
                            <span className="p-1.5 bg-[#8B5CF6]/10 rounded-lg">
                                <BarChart2 className="w-4 h-4 text-[#8B5CF6]" />
                            </span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{formatMoney(mediaVendedor)}</p>
                        <p className="text-xs text-muted-foreground mt-1">faturamento médio</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Top Performer
                            </p>
                            <span className="p-1.5 bg-amber-400/20 rounded-lg">
                                <Award className="w-4 h-4 text-amber-600" />
                            </span>
                        </div>
                        {topPerformer ? (
                            <>
                                <p className="text-base font-bold tracking-tight leading-tight truncate">
                                    {topPerformer.nome.split(" ")[0]}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    {formatMoney(topPerformer.totalVendas)}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <EquipeChart data={chartData} />

            {/* Ranking */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-semibold">Ranking de Vendedores</h2>
                    <Suspense>
                        <CargoTabs cargo={cargoFiltro} />
                    </Suspense>
                </div>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="divide-y">
                        {ranking.map((v, index) => {
                            const pctBar = (v.totalVendas / maxVendas) * 100;
                            const pctShare =
                                totalRankingVendas > 0
                                    ? (v.totalVendas / totalRankingVendas) * 100
                                    : 0;
                            const ticketMedio =
                                v.qtdVendas > 0 ? v.totalVendas / v.qtdVendas : 0;
                            const style = cargoStyle(v.cargo);
                            const rankBadge = index < 3 ? RANK_STYLE[index] : null;
                            const cargoLabel = CARGO_LABELS[v.cargo] ?? v.cargo;

                            return (
                                <div
                                    key={v.id}
                                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                                >
                                    {/* Rank */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            rankBadge
                                                ? `${rankBadge.bg} ${rankBadge.text}`
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${style.avatar}`}
                                    >
                                        {initials(v.nome)}
                                    </div>

                                    {/* Name + bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
                                            <span className="font-semibold text-sm">{v.nome}</span>
                                            <span
                                                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
                                            >
                                                {cargoLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${pctBar}%`, backgroundColor: style.bar }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {v.qtdVendas} {v.qtdVendas === 1 ? "venda" : "vendas"}
                                            {ticketMedio > 0 && (
                                                <> · ticket médio {formatMoney(ticketMedio)}</>
                                            )}
                                        </p>
                                    </div>

                                    {/* Value + share */}
                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-bold text-sm">
                                            {formatMoney(v.totalVendas)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {pctShare.toFixed(1)}% do total
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {ranking.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma venda registrada
                                    {cargoFiltro ? ` para ${CARGO_LABELS[cargoFiltro] ?? cargoFiltro}` : ""} em {anoSelecionado}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
