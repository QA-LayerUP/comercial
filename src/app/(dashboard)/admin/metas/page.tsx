import { getProfile } from "@/lib/actions/auth";
import { getMetasPageData } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
<<<<<<< Updated upstream
import { CATEGORIAS } from "@/lib/utils";
import { MetasGrid } from "@/components/admin/metas-grid";
import { YearSelector } from "@/components/dashboard/year-selector";
=======
import { formatMoney } from "@/lib/utils";
import { MetasGrid } from "@/components/admin/metas-grid";
import { YearSelector } from "@/components/dashboard/year-selector";
import { AddYearDialog } from "@/components/admin/add-year-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Layers } from "lucide-react";
>>>>>>> Stashed changes

export default async function MetasPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string }>;
}) {
    const profile = await getProfile();
    if (!["admin", "financeiro"].includes(profile?.role ?? "")) redirect("/");

    const params = await searchParams;
    const anoAtual = new Date().getFullYear();
    let ano = params.ano ? parseInt(params.ano, 10) : anoAtual;
    if (Number.isNaN(ano)) ano = anoAtual;

    const data = await getMetasPageData(ano);
    if (!data) redirect("/login");

<<<<<<< Updated upstream
    const metas: Record<string, Record<number, number>> = {};
    CATEGORIAS.forEach((cat) => { metas[cat] = {}; });
    metasData?.forEach((m) => {
        if (m.mes) {
            if (!metas[m.categoria]) metas[m.categoria] = {};
            metas[m.categoria][m.mes] = Number(m.valor_meta);
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
                    <p className="text-muted-foreground">Defina as metas mensais por categoria</p>
                </div>
                <YearSelector anos={anos} anoSelecionado={ano} />
            </div>
            <MetasGrid ano={ano} initialMetas={metas} />
=======
    const { anos, categorias, metas, kpis } = data;

    return (
        <div className="space-y-6 min-w-0">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
                    <p className="text-sm text-muted-foreground">
                        Defina as metas mensais por categoria — {data.ano}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <YearSelector anos={anos} anoSelecionado={data.ano} />
                    <AddYearDialog />
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Resumo das metas">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" aria-hidden />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">
                            Meta Anual Total
                        </p>
                        <p className="text-3xl font-bold font-mono text-[#1A1A1A] mt-1">
                            {formatMoney(kpis.totalMeta)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Categorias Ativas
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {kpis.categoriasComMeta}
                                    <span className="text-lg text-muted-foreground font-normal ml-1">
                                        / {categorias.length}
                                    </span>
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-[#E91E8C]" aria-hidden />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Média Mensal
                                </p>
                                <p className="text-3xl font-bold font-mono mt-1">
                                    {formatMoney(kpis.mediaMensal)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#00C896]" aria-hidden />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <MetasGrid ano={data.ano} initialMetas={metas} readOnly={profile?.role !== "admin"} />
>>>>>>> Stashed changes
        </div>
    );
}
