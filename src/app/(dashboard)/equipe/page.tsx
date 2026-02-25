import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, MESES } from "@/lib/utils";
import { EquipeChart } from "@/components/equipe/equipe-chart";
import { YearSelector } from "@/components/dashboard/year-selector";
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

    // Calcular vendas por vendedor (cada venda conta integralmente para cada participante)
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

    // Rank colors for badges
    const RANK_BADGE = [
        "bg-amber-400 text-amber-950", // 1st — gold
        "bg-gray-300 text-gray-800",   // 2nd — silver
        "bg-amber-600 text-amber-50",  // 3rd — bronze
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Equipe Comercial</h1>
                    <p className="text-muted-foreground">
                        Performance de vendas por vendedor — {anoSelecionado}
                    </p>
                </div>
                <YearSelector anos={anos} anoSelecionado={anoSelecionado} />
            </div>

            {/* Chart */}
            <EquipeChart data={chartData} />

            {/* Detalhamento por Vendedor */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Detalhamento por Vendedor</h3>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {ranking.map((v, index) => {
                            const pct = (v.totalVendas / maxVendas) * 100;
                            const badgeClass = index < 3
                                ? RANK_BADGE[index]
                                : "bg-muted text-muted-foreground";

                            return (
                                <div key={v.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors">
                                    {/* Rank badge */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badgeClass}`}>
                                        {index + 1}
                                    </div>

                                    {/* Name + progress bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-medium text-sm truncate">{v.nome}</span>
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                {v.cargo} · {v.qtdVendas} {v.qtdVendas === 1 ? "venda" : "vendas"}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: index < 3 ? "#00C896" : "#3A86FF",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Value */}
                                    <span className="font-mono font-semibold text-sm text-right shrink-0 min-w-[100px]">
                                        {formatMoney(v.totalVendas)}
                                    </span>
                                </div>
                            );
                        })}
                        {ranking.length === 0 && (
                            <div className="px-5 py-8 text-center text-muted-foreground">
                                Nenhuma venda registrada para {anoSelecionado}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
