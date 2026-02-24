"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./auth";

export async function createVenda(formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const valor = parseFloat(formData.get("valor") as string) || 0;
    const valorRepasse = parseFloat(formData.get("valor_repasse") as string) || 0;
    const valorCalculo = valor - valorRepasse;
    const comissaoPct = parseFloat(formData.get("comissao_percentual") as string) || 0;
    const comissaoValor = valorCalculo * (comissaoPct / 100);

    const { error } = await supabase.from("vendas").insert({
        ano: parseInt(formData.get("ano") as string),
        mes: parseInt(formData.get("mes") as string),
        nome_cliente: formData.get("nome_cliente") as string,
        cliente_id: formData.get("cliente_id") ? parseInt(formData.get("cliente_id") as string) : null,
        venda_codigo: formData.get("venda_codigo") as string || "",
        produto: formData.get("produto") as string,
        categoria: formData.get("categoria") as string,
        perfil: formData.get("perfil") as string,
        tipo: formData.get("tipo") as string,
        especificacao: formData.get("especificacao") as string,
        vigencia: formData.get("vigencia") as string || "",
        valor,
        repasse_desconto: formData.get("repasse_desconto") as string || "",
        valor_repasse: valorRepasse,
        valor_calculo_comissao: valorCalculo,
        volume_horas: parseFloat(formData.get("volume_horas") as string) || 0,
        valor_por_hora: parseFloat(formData.get("valor_por_hora") as string) || 0,
        volume_sales_people: parseInt(formData.get("volume_sales_people") as string) || 1,
        estrategia1_id: formData.get("estrategia1_id") ? parseInt(formData.get("estrategia1_id") as string) : null,
        estrategia2_id: formData.get("estrategia2_id") ? parseInt(formData.get("estrategia2_id") as string) : null,
        vendedor1_id: formData.get("vendedor1_id") ? parseInt(formData.get("vendedor1_id") as string) : null,
        vendedor2_id: formData.get("vendedor2_id") ? parseInt(formData.get("vendedor2_id") as string) : null,
        gestao_projetos_id: formData.get("gestao_projetos_id") ? parseInt(formData.get("gestao_projetos_id") as string) : null,
        customer_success_id: formData.get("customer_success_id") ? parseInt(formData.get("customer_success_id") as string) : null,
        sdr_id: formData.get("sdr_id") ? parseInt(formData.get("sdr_id") as string) : null,
        comissao_percentual: comissaoPct,
        comissao_valor: comissaoValor,
        observacoes: formData.get("observacoes") as string || "",
        created_by: user?.id,
    });

    if (error) return { error: `Erro ao cadastrar venda: ${error.message}` };

    revalidatePath("/vendas");
    return { success: true };
}

export async function updateVenda(id: number, formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();

    const valor = parseFloat(formData.get("valor") as string) || 0;
    const valorRepasse = parseFloat(formData.get("valor_repasse") as string) || 0;
    const valorCalculo = valor - valorRepasse;
    const comissaoPct = parseFloat(formData.get("comissao_percentual") as string) || 0;
    const comissaoValor = valorCalculo * (comissaoPct / 100);

    const { error } = await supabase
        .from("vendas")
        .update({
            ano: parseInt(formData.get("ano") as string),
            mes: parseInt(formData.get("mes") as string),
            nome_cliente: formData.get("nome_cliente") as string,
            cliente_id: formData.get("cliente_id") ? parseInt(formData.get("cliente_id") as string) : null,
            venda_codigo: formData.get("venda_codigo") as string || "",
            produto: formData.get("produto") as string,
            categoria: formData.get("categoria") as string,
            perfil: formData.get("perfil") as string,
            tipo: formData.get("tipo") as string,
            especificacao: formData.get("especificacao") as string,
            vigencia: formData.get("vigencia") as string || "",
            valor,
            repasse_desconto: formData.get("repasse_desconto") as string || "",
            valor_repasse: valorRepasse,
            valor_calculo_comissao: valorCalculo,
            volume_horas: parseFloat(formData.get("volume_horas") as string) || 0,
            valor_por_hora: parseFloat(formData.get("valor_por_hora") as string) || 0,
            volume_sales_people: parseInt(formData.get("volume_sales_people") as string) || 1,
            estrategia1_id: formData.get("estrategia1_id") ? parseInt(formData.get("estrategia1_id") as string) : null,
            estrategia2_id: formData.get("estrategia2_id") ? parseInt(formData.get("estrategia2_id") as string) : null,
            vendedor1_id: formData.get("vendedor1_id") ? parseInt(formData.get("vendedor1_id") as string) : null,
            vendedor2_id: formData.get("vendedor2_id") ? parseInt(formData.get("vendedor2_id") as string) : null,
            gestao_projetos_id: formData.get("gestao_projetos_id") ? parseInt(formData.get("gestao_projetos_id") as string) : null,
            customer_success_id: formData.get("customer_success_id") ? parseInt(formData.get("customer_success_id") as string) : null,
            sdr_id: formData.get("sdr_id") ? parseInt(formData.get("sdr_id") as string) : null,
            comissao_percentual: comissaoPct,
            comissao_valor: comissaoValor,
            observacoes: formData.get("observacoes") as string || "",
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: `Erro ao atualizar venda: ${error.message}` };

    revalidatePath("/vendas");
    revalidatePath(`/vendas/${id}`);
    return { success: true };
}

export async function deleteVenda(id: number) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito a administradores." };

    const supabase = await createClient();
    const { error } = await supabase.from("vendas").delete().eq("id", id);

    if (error) return { error: `Erro ao excluir venda: ${error.message}` };

    revalidatePath("/vendas");
    return { success: true };
}
