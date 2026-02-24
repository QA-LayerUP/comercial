import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/clientes/cliente-form";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: cliente } = await supabase.from("clientes").select("*").eq("id", parseInt(id)).single();
    if (!cliente) notFound();
    return <ClienteForm cliente={cliente as any} />;
}
