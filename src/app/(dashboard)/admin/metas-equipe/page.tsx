import { getProfile } from "@/lib/actions/auth";
import { getMetasEquipePageData, initializeEquipeYear } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { MetasEquipeGrid } from "@/components/admin/metas-equipe-grid";
import { YearSelector } from "@/components/dashboard/year-selector";
import { AddYearDialog } from "@/components/admin/add-year-dialog-equipe";
import { Card, CardContent } from "@/components/ui/card";
import { Users2, Target, TrendingUp } from "lucide-react";

export default async function MetasEquipePage({
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

    const data = await getMetasEquipePageData(ano);
    if (!data) redirect("/login");

    const { anos, categorias, salesPeople, metasEquipe, metasGlobais } = data;

    // KPIs
    const totalAlocado = Object.values(metasEquipe).reduce(
        (s1, byPerson) =>
            s1 +
            Object.values(byPerson).reduce(
                (s2, byMes) =>
                    s2 + Object.values(byMes).reduce((s3, v) => s3 + (Number(v) || 0), 0),
                0
            ),
        0
    );
    const totalGlobal = Object.values(metasGlobais).reduce(
        (s, byMes) => s + Object.values(byMes).reduce((a, b) => a + b, 0),
        0
    );
    const pessoasAtivas = salesPeople.length;

    return (
        <div className="space-y-6 min-w-0">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Metas Individuais</h1>
                    <p className="text-sm text-muted-foreground">
                        Distribuição de metas por pessoa da equipe — {ano}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <YearSelector anos={anos} anoSelecionado={ano} />
                    <AddYearDialog />
                </div>
            </header>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#1A1A1A] overflow-hidden relative text-white">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-white/50 uppercase tracking-wider font-medium">
                            Meta Global {ano}
                        </p>
                        <p className="text-3xl font-bold font-mono mt-1">{formatMoney(totalGlobal)}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Total Alocado
                                </p>
                                <p className="text-3xl font-bold font-mono mt-1">{formatMoney(totalAlocado)}</p>
                                {totalGlobal > 0 && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {((totalAlocado / totalGlobal) * 100).toFixed(1)}% da meta global
                                    </p>
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <Target className="w-5 h-5 text-[#E91E8C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Pessoas na Equipe
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {pessoasAtivas}
                                    <span className="text-lg text-muted-foreground font-normal ml-1">ativos</span>
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <Users2 className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {salesPeople.length === 0 ? (
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-12 text-center">
                        <Users2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">
                            Nenhuma pessoa ativa na equipe.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Adicione membros em{" "}
                            <a href="/admin/equipe" className="text-[#E91E8C] underline">
                                Admin → Equipe
                            </a>
                            .
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <MetasEquipeGrid
                    ano={ano}
                    salesPeople={salesPeople}
                    categorias={categorias}
                    initialData={metasEquipe}
                    metasGlobais={metasGlobais}
                />
            )}
        </div>
    );
}
