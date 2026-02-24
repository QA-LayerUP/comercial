import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { EquipeManager } from "@/components/admin/equipe-manager";

export default async function EquipePage() {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const supabase = await createClient();
    const { data: salesPeople } = await supabase.from("sales_people").select("*").order("cargo").order("nome");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Equipe Comercial</h1>
                <p className="text-muted-foreground">Gerencie a equipe de vendas</p>
            </div>
            <EquipeManager salesPeople={(salesPeople || []) as any} />
        </div>
    );
}
