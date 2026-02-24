"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./auth";

export async function createCliente(formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();

    const { error } = await supabase.from("clientes").insert({
        confidencialidade: formData.get("confidencialidade") as string || "",
        nome: (formData.get("nome") as string).trim(),
        cnpj_cpf: (formData.get("cnpj_cpf") as string || "").trim(),
        contato_nome: formData.get("contato_nome") as string || "",
        contato_email: formData.get("contato_email") as string || "",
        contato_telefone: formData.get("contato_telefone") as string || "",
        contrato_ativo: formData.get("contrato_ativo") === "on",
        data_primeiro_contrato: formData.get("data_primeiro_contrato") as string || null,
        data_renovacao: formData.get("data_renovacao") as string || null,
        link_contrato: formData.get("link_contrato") as string || "",
        link_proposta: formData.get("link_proposta") as string || "",
        observacoes: formData.get("observacoes") as string || "",
    });

    if (error) return { error: `Erro ao cadastrar cliente: ${error.message}` };

    revalidatePath("/clientes");
    return { success: true };
}

export async function updateCliente(id: number, formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();

    const { error } = await supabase
        .from("clientes")
        .update({
            confidencialidade: formData.get("confidencialidade") as string || "",
            nome: (formData.get("nome") as string).trim(),
            cnpj_cpf: (formData.get("cnpj_cpf") as string || "").trim(),
            contato_nome: formData.get("contato_nome") as string || "",
            contato_email: formData.get("contato_email") as string || "",
            contato_telefone: formData.get("contato_telefone") as string || "",
            contrato_ativo: formData.get("contrato_ativo") === "on",
            data_primeiro_contrato: formData.get("data_primeiro_contrato") as string || null,
            data_renovacao: formData.get("data_renovacao") as string || null,
            link_contrato: formData.get("link_contrato") as string || "",
            link_proposta: formData.get("link_proposta") as string || "",
            observacoes: formData.get("observacoes") as string || "",
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: `Erro ao atualizar cliente: ${error.message}` };

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true };
}

export async function deleteCliente(id: number) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();

    // Verificar se tem vendas vinculadas (regra de negócio original)
    const { count } = await supabase
        .from("vendas")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", id);

    if (count && count > 0) {
        return { error: `Não é possível excluir: cliente possui ${count} venda(s) vinculada(s).` };
    }

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    if (error) return { error: `Erro ao excluir cliente: ${error.message}` };

    revalidatePath("/clientes");
    return { success: true };
}
