import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { EquipeChart } from "@/components/equipe/equipe-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
import { Users2, Trophy, TrendingUp, ShoppingCart, Crown } from "lucide-react";
import type { SalesPerson, Venda } from "@/lib/types/database";

const SP_FIELDS: { key: keyof Venda; label: string }[] = [
    { key: "vendedor1_id", label: "Vendedor" },
    { key: "vendedor2_id", label: "Vendedor 2" },
    { key: "sdr_id", label: "SDR" },
    { key: "estrategia1_id", label: "Estratégia" },
    { key: "estrategia2_id", label: "Estratégia 2" },
    { key: "gestao_projetos_id", label: "Gestão de Projetos" },
    { key: "customer_success_id", label: "Customer Success" },
];

// Brand colors for top 3 podium
const PODIUM = [
    { bg: "bg-[#FFC857]", text: "text-[#1A1A1A]", bar: "#FFC857", icon: "🥇" },
    { bg: "bg-[#C0C0C0]", text: "text-[#1A1A1A]", bar: "#B0BEC5", icon: "🥈" },
    { bg: "bg-[#CD7F32]", text: "text-white", bar: "#CD7F32", icon: "🥉" },
];

const CARGO_COLORS: Record<string, { bg: string; text: string }> = {
    "Vendedor": { bg: "bg-[#E91E8C]/10", text: "text-[#E91E8C]" },
    "Estrategia": { bg: "bg-[#FFC857]/15", text: "text-[#B8941F]" },
    "SDR": { bg: "bg-[#3A86FF]/10", text: "text-[#3A86FF]" },
    "Customer Success": { bg: "bg-[#00C896]/10", text: "text-[#00C896]" },
    "Gestao de projetos": { bg: "bg-[#8A2BE2]/10", text: "text-[#8A2BE2]" },
};

export default async function EquipePage({
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

    // Sales people
    const { data: salesPeople } = await supabase
        .from("sales_people")
        .select("*")
        .eq("ativo", true)
        .order("nome");

    // Vendas do ano
    const { data: vendas } = await supabase
        .from("vendas")
        .select("*")
        .eq("ano", anoSelecionado);

    // Calcular vendas por vendedor
    const vendedorMap: Record<number, { nome: string; cargo: string; totalVendas: number; qtdVendas: number }> = {};

    const spMap = new Map<number, SalesPerson>();
    (salesPeople || []).forEach((sp) => spMap.set(sp.id, sp as SalesPerson));

    (vendas || []).forEach((venda) => {
        const participantes = new Set<number>();
        SP_FIELDS.forEach((field) => {
            const spId = venda[field.key] as number | null;
            if (spId && !participantes.has(spId)) {
                participantes.add(spId);
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

    // Ranking (sorted by total desc)
    const ranking = Object.entries(vendedorMap)
        .map(([id, data]) => ({
            id: Number(id),
            ...data,
        }))
        .sort((a, b) => b.totalVendas - a.totalVendas);

    const maxVendas = ranking.length > 0 ? ranking[0].totalVendas : 1;

    // Chart data
    const chartData = ranking.map((v) => ({
        nome: v.nome.split(" ").slice(0, 1).join(" "),
        nomeCompleto: v.nome,
        valor: v.totalVendas,
    }));

    // KPIs
    const totalVendas = (vendas || []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
    const totalParticipantes = ranking.length;
    const mediaVendedor = totalParticipantes > 0 ? totalVendas / totalParticipantes : 0;
    const totalNegociacoes = (vendas || []).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Equipe Comercial</h1>
                    <p className="text-sm text-muted-foreground">
                        Performance de vendas por vendedor — {anoSelecionado}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Hero: Faturamento */}
                <Card className="rounded-2xl border-0 overflow-hidden relative bg-gradient-to-br from-[#FFC857] to-[#FFB020] shadow-[0_8px_24px_rgba(255,200,87,0.3)]">
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/15 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]/10 flex items-center justify-center">
                                <Crown className="w-4 h-4 text-[#1A1A1A]/70" />
                            </div>
                            <p className="text-xs text-[#1A1A1A]/60 uppercase tracking-wider font-semibold">Faturamento Total</p>
                        </div>
                        <p className="text-3xl font-bold font-mono text-[#1A1A1A]">{formatMoney(totalVendas)}</p>
                    </CardContent>
                </Card>

                {/* Participantes */}
                <Card className="rounded-2xl border-0 overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(58,134,255,0.12)] transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3A86FF]" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Participantes</p>
                                <p className="text-3xl font-bold mt-2">{totalParticipantes}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#3A86FF]/10 flex items-center justify-center">
                                <Users2 className="w-6 h-6 text-[#3A86FF]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Negociações */}
                <Card className="rounded-2xl border-0 overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(233,30,140,0.12)] transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E91E8C]" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Negociações</p>
                                <p className="text-3xl font-bold mt-2">{totalNegociacoes}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-[#E91E8C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Média */}
                <Card className="rounded-2xl border-0 overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,200,150,0.12)] transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C896]" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Média / Vendedor</p>
                                <p className="text-3xl font-bold font-mono mt-2">{formatMoney(mediaVendedor)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#00C896]/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <EquipeChart data={chartData} />

            {/* Ranking */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#FFC857]" />
                        <h3 className="font-semibold text-sm">Ranking de Vendas</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {ranking.length} vendedor{ranking.length !== 1 ? "es" : ""}
                    </span>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y divide-[#F5F6FA]">
                        {ranking.map((v, index) => {
                            const pct = (v.totalVendas / maxVendas) * 100;
                            const podium = index < 3 ? PODIUM[index] : null;
                            const cargoStyle = CARGO_COLORS[v.cargo] || { bg: "bg-muted", text: "text-muted-foreground" };

                            return (
                                <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F9F9FB] transition-colors group">
                                    {/* Rank badge */}
                                    {podium ? (
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${podium.bg} ${podium.text} shadow-sm`}>
                                            {podium.icon}
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 bg-[#F5F6FA] text-muted-foreground">
                                            {index + 1}º
                                        </div>
                                    )}

                                    {/* Name + cargo + progress bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <span className="font-medium text-sm truncate">{v.nome}</span>
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${cargoStyle.bg} ${cargoStyle.text}`}>
                                                {v.cargo}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: podium?.bar || "#E91E8C",
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">
                                                {pct.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-semibold text-sm">{formatMoney(v.totalVendas)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {v.qtdVendas} {v.qtdVendas === 1 ? "venda" : "vendas"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {ranking.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <Users2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-muted-foreground">Nenhuma venda registrada para {anoSelecionado}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
