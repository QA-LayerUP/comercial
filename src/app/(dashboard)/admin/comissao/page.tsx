import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ComissaoManager } from "@/components/admin/comissao-manager";

export default async function ComissaoPage() {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const supabase = await createClient();
    const { data: regras } = await supabase.from("regra_comissao").select("*").order("produto").order("categoria");

    return <ComissaoManager regras={(regras || []) as any} />;
}
