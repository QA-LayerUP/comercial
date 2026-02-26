import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/actions/auth";
import { canCreateVenda } from "@/lib/permissions";
import { VendaForm } from "@/components/vendas/venda-form";

export default async function NovaVendaPage() {
    const profile = await getProfile();
    if (!canCreateVenda(profile)) redirect("/vendas");

    const supabase = await createClient();

    const { data: salesPeople } = await supabase
        .from("sales_people")
        .select("*")
        .eq("ativo", true)
        .order("cargo")
        .order("nome");

    const { data: clientes } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");

    return (
        <VendaForm
            salesPeople={salesPeople || []}
            clientes={(clientes || []) as any}
        />
    );
}
