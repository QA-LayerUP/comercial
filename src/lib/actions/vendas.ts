"use server";

import { createClient, getAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin, hasAnyRole } from "./auth";
import { calcComissao } from "@/lib/utils";

export async function createVenda(formData: FormData) {
    const allowed = await hasAnyRole(["admin", "financeiro", "vendas"]);
    if (!allowed) return { error: "Sem permissão para cadastrar vendas." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const valor = parseFloat(formData.get("valor") as string) || 0;
    const valorRepasse = parseFloat(formData.get("valor_repasse") as string) || 0;
    const comissaoPct = parseFloat(formData.get("comissao_percentual") as string) || 0;
    const volumeSalesPeople = parseInt(formData.get("volume_sales_people") as string) || 1;
    const tipo = formData.get("tipo") as string || "";
    const { baseCalculo, comissaoPorVendedor } = calcComissao(tipo, valor, valorRepasse, comissaoPct, volumeSalesPeople);

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
        valor_calculo_comissao: baseCalculo,
        volume_horas: parseFloat(formData.get("volume_horas") as string) || 0,
        valor_por_hora: parseFloat(formData.get("valor_por_hora") as string) || 0,
        volume_sales_people: volumeSalesPeople,
        estrategia1_id: formData.get("estrategia1_id") ? parseInt(formData.get("estrategia1_id") as string) : null,
        estrategia2_id: formData.get("estrategia2_id") ? parseInt(formData.get("estrategia2_id") as string) : null,
        vendedor1_id: formData.get("vendedor1_id") ? parseInt(formData.get("vendedor1_id") as string) : null,
        vendedor2_id: formData.get("vendedor2_id") ? parseInt(formData.get("vendedor2_id") as string) : null,
        gestao_projetos_id: formData.get("gestao_projetos_id") ? parseInt(formData.get("gestao_projetos_id") as string) : null,
        customer_success_id: formData.get("customer_success_id") ? parseInt(formData.get("customer_success_id") as string) : null,
        sdr_id: formData.get("sdr_id") ? parseInt(formData.get("sdr_id") as string) : null,
        comissao_percentual: comissaoPct,
        comissao_valor: comissaoPorVendedor,
        observacoes: formData.get("observacoes") as string || "",
        created_by: user?.id,
    });

    if (error) return { error: `Erro ao cadastrar venda: ${error.message}` };

    revalidatePath("/vendas");
    return { success: true };
}

export async function updateVenda(id: number, formData: FormData) {
    const allowed = await hasAnyRole(["admin", "financeiro", "vendas"]);
    if (!allowed) return { error: "Sem permissão para editar vendas." };

    const supabase = await createClient();

    const valor = parseFloat(formData.get("valor") as string) || 0;
    const valorRepasse = parseFloat(formData.get("valor_repasse") as string) || 0;
    const comissaoPct = parseFloat(formData.get("comissao_percentual") as string) || 0;
    const volumeSalesPeople = parseInt(formData.get("volume_sales_people") as string) || 1;
    const tipo = formData.get("tipo") as string || "";
    const { baseCalculo, comissaoPorVendedor } = calcComissao(tipo, valor, valorRepasse, comissaoPct, volumeSalesPeople);

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
            valor_calculo_comissao: baseCalculo,
            volume_horas: parseFloat(formData.get("volume_horas") as string) || 0,
            valor_por_hora: parseFloat(formData.get("valor_por_hora") as string) || 0,
            volume_sales_people: volumeSalesPeople,
            estrategia1_id: formData.get("estrategia1_id") ? parseInt(formData.get("estrategia1_id") as string) : null,
            estrategia2_id: formData.get("estrategia2_id") ? parseInt(formData.get("estrategia2_id") as string) : null,
            vendedor1_id: formData.get("vendedor1_id") ? parseInt(formData.get("vendedor1_id") as string) : null,
            vendedor2_id: formData.get("vendedor2_id") ? parseInt(formData.get("vendedor2_id") as string) : null,
            gestao_projetos_id: formData.get("gestao_projetos_id") ? parseInt(formData.get("gestao_projetos_id") as string) : null,
            customer_success_id: formData.get("customer_success_id") ? parseInt(formData.get("customer_success_id") as string) : null,
            sdr_id: formData.get("sdr_id") ? parseInt(formData.get("sdr_id") as string) : null,
            comissao_percentual: comissaoPct,
            comissao_valor: comissaoPorVendedor,
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
    const allowed = await hasAnyRole(["admin", "financeiro"]);
    if (!allowed) return { error: "Sem permissão para excluir vendas." };

    const supabase = await createClient();
    const { error } = await supabase.from("vendas").delete().eq("id", id);

    if (error) return { error: `Erro ao excluir venda: ${error.message}` };

    revalidatePath("/vendas");
    return { success: true };
}

export interface RecalcPreviewItem {
    id: number;
    tipo: string;
    nome_cliente: string;
    baseCalculoAnterior: number;
    comissaoAnterior: number;
    baseCalculoNova: number;
    comissaoNova: number;
    diff: number;
}

export interface RecalcResult {
    total: number;
    alteradas: number;
    preview: RecalcPreviewItem[];
    error?: string;
    debug?: string;
}

/** Arredonda para 2 casas decimais — mesma precisão do numeric(15,2) do Postgres */
function round2(n: number) {
    return parseFloat(n.toFixed(2));
}

export async function recalcularComissoes(dryRun: boolean = true): Promise<RecalcResult> {
    const admin = await isAdmin();
    if (!admin) return { total: 0, alteradas: 0, preview: [], error: "Acesso restrito a administradores." };

    const supabase = await createClient();

    const { data: vendas, error } = await supabase
        .from("vendas")
        .select("id, tipo, nome_cliente, valor, valor_repasse, comissao_percentual, volume_sales_people, valor_calculo_comissao, comissao_valor")
        .order("id");

    if (error) return { total: 0, alteradas: 0, preview: [], error: `SELECT falhou: ${error.message}` };

    const preview: RecalcPreviewItem[] = [];
    const updates: Array<{ id: number; valor_calculo_comissao: number; comissao_valor: number }> = [];

    for (const v of vendas || []) {
        const { baseCalculo, comissaoPorVendedor } = calcComissao(
            v.tipo || "",
            Number(v.valor),
            Number(v.valor_repasse),
            Number(v.comissao_percentual),
            v.volume_sales_people || 1
        );

        // Compara com a mesma precisão de numeric(15,2) para evitar falsos positivos
        const novaBase = round2(baseCalculo);
        const novaComissao = round2(comissaoPorVendedor);
        const antigaBase = round2(Number(v.valor_calculo_comissao));
        const antigaComissao = round2(Number(v.comissao_valor));

        const diff = novaComissao - antigaComissao;

        if (Math.abs(diff) > 0.01 || Math.abs(novaBase - antigaBase) > 0.01) {
            preview.push({
                id: v.id,
                tipo: v.tipo || "",
                nome_cliente: v.nome_cliente,
                baseCalculoAnterior: antigaBase,
                comissaoAnterior: antigaComissao,
                baseCalculoNova: novaBase,
                comissaoNova: novaComissao,
                diff,
            });
            updates.push({ id: v.id, valor_calculo_comissao: novaBase, comissao_valor: novaComissao });
        }
    }

    if (!dryRun && updates.length > 0) {
        const adminClient = getAdminClient();

        if (!adminClient) {
            return {
                total: 0, alteradas: 0, preview,
                error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
            };
        }

        // Primeiro, verifica se o adminClient consegue ler uma venda (teste de conectividade)
        const { data: testRead, error: testErr } = await adminClient
            .from("vendas")
            .select("id, comissao_valor")
            .eq("id", updates[0].id)
            .single();

        if (testErr) {
            return {
                total: (vendas || []).length,
                alteradas: 0,
                preview,
                error: `AdminClient falhou na leitura de teste: ${testErr.message} (code: ${testErr.code})`,
                debug: `Tentando ler id=${updates[0].id}`,
            };
        }

        const errors: string[] = [];
        let successCount = 0;
        let firstUpdated: { id: number; before: number; after: number } | null = null;

        for (const upd of updates) {
            const { error: updErr } = await adminClient
                .from("vendas")
                .update({
                    valor_calculo_comissao: upd.valor_calculo_comissao,
                    comissao_valor: upd.comissao_valor,
                })
                .eq("id", upd.id);

            if (updErr) {
                errors.push(`#${upd.id}: ${updErr.message}`);
            } else {
                if (successCount === 0) {
                    firstUpdated = {
                        id: upd.id,
                        before: Number(vendas?.find(v => v.id === upd.id)?.comissao_valor),
                        after: upd.comissao_valor,
                    };
                }
                successCount++;
            }
        }

        if (errors.length > 0) {
            return {
                total: (vendas || []).length,
                alteradas: successCount,
                preview,
                error: `Falha em ${errors.length} update(s): ${errors.slice(0, 3).join(" | ")}`,
                debug: firstUpdated
                    ? `Primeira venda #${firstUpdated.id}: ${firstUpdated.before} → ${firstUpdated.after}`
                    : "Nenhuma atualização bem-sucedida",
            };
        }

        revalidatePath("/vendas");
        revalidatePath("/comissoes");
        revalidatePath("/admin/recalcular");

        return {
            total: (vendas || []).length,
            alteradas: successCount,
            preview: [],
            debug: `adminClient OK | teste leu id=${testRead?.id} (comissao_valor=${testRead?.comissao_valor}) | ${firstUpdated ? `1ª atualizada #${firstUpdated.id}: ${firstUpdated.before}→${firstUpdated.after}` : ""}`,
        };
    }

    return {
        total: (vendas || []).length,
        alteradas: updates.length,
        preview,
    };
}
