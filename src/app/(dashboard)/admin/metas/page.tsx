import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { CATEGORIAS } from "@/lib/utils";
import { MetasGrid } from "@/components/admin/metas-grid";
import { YearSelector } from "@/components/dashboard/year-selector";

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
        </div>
    );
}
