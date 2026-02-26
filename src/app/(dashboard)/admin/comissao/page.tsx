import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ComissaoManager } from "@/components/admin/comissao-manager";

export default async function ComissaoPage() {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const supabase = await createClient();
    const { data: regras } = await supabase
        .from("regra_comissao")
        .select("*")
        .order("produto")
        .order("categoria");

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Regras de Comissão</h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie as regras de cálculo de comissão por produto e tipo
                </p>
            </header>

            <ComissaoManager regras={(regras || []) as any} />
        </div>
    );
}
