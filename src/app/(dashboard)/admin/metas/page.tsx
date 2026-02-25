import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { CATEGORIAS, formatMoney } from "@/lib/utils";
import { MetasGrid } from "@/components/admin/metas-grid";
import { YearSelector } from "@/components/dashboard/year-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Layers } from "lucide-react";

export default async function MetasPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string }>;
}) {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const params = await searchParams;
    const anoAtual = new Date().getFullYear();
    const ano = params.ano ? parseInt(params.ano) : anoAtual;
    const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

    const supabase = await createClient();
    const { data: metasData } = await supabase
        .from("metas")
        .select("*")
        .eq("ano", ano);

    const metas: Record<string, Record<number, number>> = {};
    CATEGORIAS.forEach((cat) => { metas[cat] = {}; });
    metasData?.forEach((m) => {
        if (m.mes) {
            if (!metas[m.categoria]) metas[m.categoria] = {};
            metas[m.categoria][m.mes] = Number(m.valor_meta);
        }
    });

    // KPIs
    const totalMeta = Object.values(metas).reduce(
        (total, catMetas) => total + Object.values(catMetas).reduce((s, v) => s + v, 0),
        0
    );
    const categoriasComMeta = Object.entries(metas).filter(
        ([, catMetas]) => Object.values(catMetas).some((v) => v > 0)
    ).length;
    const mediaMensal = totalMeta > 0 ? totalMeta / 12 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
                    <p className="text-sm text-muted-foreground">Defina as metas mensais por categoria — {ano}</p>
                </div>
                <YearSelector anos={anos} anoSelecionado={ano} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Meta Anual Total</p>
                        <p className="text-3xl font-bold font-mono text-[#1A1A1A] mt-1">{formatMoney(totalMeta)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Categorias</p>
                                <p className="text-3xl font-bold mt-1">{categoriasComMeta}<span className="text-lg text-muted-foreground font-normal">/{CATEGORIAS.length}</span></p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-[#E91E8C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Média Mensal</p>
                                <p className="text-3xl font-bold font-mono mt-1">{formatMoney(mediaMensal)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Grid */}
            <MetasGrid ano={ano} initialMetas={metas} />
        </div>
    );
}
