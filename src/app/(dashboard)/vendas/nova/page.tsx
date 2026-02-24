import { createClient } from "@/lib/supabase/server";
import { VendaForm } from "@/components/vendas/venda-form";

export default async function NovaVendaPage() {
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
