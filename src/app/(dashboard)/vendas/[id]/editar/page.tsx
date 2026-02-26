import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { canEditVenda } from "@/lib/permissions";
import { VendaForm } from "@/components/vendas/venda-form";

export default async function EditarVendaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const profile = await getProfile();
    if (!canEditVenda(profile)) redirect("/vendas");

    const supabase = await createClient();

    const { data: venda } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", parseInt(id))
        .single();

    if (!venda) notFound();

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
            venda={venda as any}
            salesPeople={salesPeople || []}
            clientes={(clientes || []) as any}
        />
    );
}
