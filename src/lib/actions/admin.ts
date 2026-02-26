"use server";

import { createClient as createServerClient, getAdminClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./auth";
import { CATEGORIAS } from "@/lib/utils";
import type { MetasByCategory, MetasPageData, MetasEquipePageData, MetasEquipeData } from "@/lib/types/database";

// ---- USERS ----
export async function createUser(formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const nome = (formData.get("nome") as string)?.trim();
    const role = (formData.get("role") as string) || "visitante";

    if (!email || !password || !nome) {
        return { error: "Preencha todos os campos obrigatórios." };
    }

    if (password.length < 6) {
        return { error: "A senha precisa ter no mínimo 6 caracteres." };
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada. Configure no .env.local." };
    }

    // Create auth user via Admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
    });

    if (authError) {
        if (authError.message.includes("already been registered")) {
            return { error: "Este email já está cadastrado." };
        }
        return { error: `Erro ao criar usuário: ${authError.message}` };
    }

    // Update profile with correct role (trigger creates it as 'reader')
    await adminClient.from("profiles").update({ role, nome }).eq("id", authData.user.id);

    revalidatePath("/admin/usuarios");
    return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

    if (error) return { error: `Erro: ${error.message}` };

    revalidatePath("/admin/usuarios");
    return { success: true };
}

export async function toggleUserActive(userId: string, currentAtivo: boolean) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const { error } = await supabase
        .from("profiles")
        .update({ ativo: !currentAtivo })
        .eq("id", userId);

    if (error) return { error: `Erro: ${error.message}` };

    revalidatePath("/admin/usuarios");
    return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    if (newPassword.length < 6) {
        return { error: "A senha precisa ter no mínimo 6 caracteres." };
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada." };
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
    });

    if (error) return { error: `Erro ao resetar senha: ${error.message}` };

    return { success: true };
}

// ---- METAS ----
/** Carrega todos os dados necessários para a página /admin/metas (server-only). */
export async function getMetasPageData(ano: number): Promise<MetasPageData | null> {
    const adminClient = getAdminClient();
    if (!adminClient) return null;

    const anoAtual = new Date().getFullYear();
    const anosSet = new Set<number>([
        ano,
        anoAtual - 2,
        anoAtual - 1,
        anoAtual,
        anoAtual + 1,
        anoAtual + 2,
    ]);

    try {
        const [{ data: anosData }, { data: categoriasData }, { data: metasData }] = await Promise.all([
            adminClient.from("metas").select("ano"),
            adminClient.from("metas").select("categoria"),
            adminClient.from("metas").select("ano, categoria, mes, valor_meta").eq("ano", ano),
        ]);

        anosData?.forEach((r: { ano: number | null }) => {
            if (r.ano != null) anosSet.add(r.ano);
        });
        const anos = Array.from(anosSet).sort((a, b) => b - a);

        const catSet = new Set<string>(CATEGORIAS as unknown as string[]);
        categoriasData?.forEach((m: { categoria: string | null }) => {
            if (m.categoria) catSet.add(m.categoria.trim());
        });
        const categorias = Array.from(catSet);

        const metas: MetasByCategory = {};
        categorias.forEach((cat) => {
            metas[cat] = {};
        });
        metasData?.forEach((m: { categoria: string | null; mes: number | null; valor_meta: number }) => {
            if (m.mes != null && m.categoria) {
                const cat = m.categoria.trim();
                if (!metas[cat]) metas[cat] = {};
                metas[cat][m.mes] = Number(m.valor_meta || 0);
            }
        });

        const totalMeta = Object.values(metas).reduce(
            (sum, byMes) => sum + Object.values(byMes).reduce((s, v) => s + (Number(v) || 0), 0),
            0
        );
        const categoriasComMeta = Object.entries(metas).filter(([, byMes]) =>
            Object.values(byMes || {}).some((v) => (Number(v) || 0) > 0)
        ).length;
        const mediaMensal = totalMeta > 0 ? totalMeta / 12 : 0;

        return {
            ano,
            anos,
            categorias,
            metas,
            kpis: { totalMeta, categoriasComMeta, mediaMensal },
        };
    } catch (err) {
        console.error("getMetasPageData:", err);
        return null;
    }
}

/**
 * Cria todas as linhas (categoria × 12 meses) para um ano ainda sem dados.
 * Usa as categorias já existentes em outros anos + as categorias padrão.
 * Retorna { alreadyExists: true } se o ano já possui dados (não sobrescreve).
 */
export async function initializeYear(
    ano: number
): Promise<{ success?: boolean; alreadyExists?: boolean; error?: string }> {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = getAdminClient();
    if (!supabase) return { error: "Erro de configuração: Service Role não encontrada." };

    try {
        // Verificar se o ano já tem dados
        const { data: existing } = await supabase
            .from("metas")
            .select("id")
            .eq("ano", ano)
            .limit(1);

        if (existing && existing.length > 0) return { success: true, alreadyExists: true };

        // Buscar categorias globais já cadastradas
        const { data: categoriasData } = await supabase.from("metas").select("categoria");
        const catSet = new Set<string>(CATEGORIAS as unknown as string[]);
        categoriasData?.forEach((m: { categoria: string | null }) => {
            if (m.categoria) catSet.add(m.categoria.trim());
        });
        const categorias = Array.from(catSet);

        // Próximo ID disponível
        const { data: lastItem } = await supabase
            .from("metas")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);
        let nextId = (lastItem?.[0]?.id || 0) + 1;

        const rows = categorias.flatMap((cat) =>
            Array.from({ length: 12 }, (_, i) => ({
                id: nextId++,
                ano,
                categoria: cat,
                mes: i + 1,
                valor_meta: 0,
            }))
        );

        if (rows.length === 0) return { success: true };

        const { error } = await supabase.from("metas").insert(rows);
        if (error) return { error: `Erro ao criar o ano: ${error.message}` };

        revalidatePath("/admin/metas");
        return { success: true };
    } catch (err) {
        console.error("initializeYear:", err);
        return { error: "Erro interno ao criar o ano." };
    }
}

/**
 * Insere a categoria nova (12 linhas com valor_meta = 0) em TODOS os anos
 * que ainda não a possuem.
 */
export async function addCategoryToAllYears(
    categoria: string
): Promise<{ success?: boolean; error?: string }> {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = getAdminClient();
    if (!supabase) return { error: "Erro de configuração: Service Role não encontrada." };

    try {
        const cat = categoria.trim();
        if (!cat) return { error: "Nome de categoria inválido." };

        // Anos distintos existentes no banco
        const { data: anosData } = await supabase.from("metas").select("ano");
        const anosSet = new Set<number>();
        anosData?.forEach((r: { ano: number | null }) => {
            if (r.ano != null) anosSet.add(r.ano);
        });
        const todosAnos = Array.from(anosSet);
        if (todosAnos.length === 0) return { success: true };

        // Descobrir em quais anos a categoria já existe (evitar duplicatas)
        const { data: existingData } = await supabase
            .from("metas")
            .select("ano")
            .eq("categoria", cat);
        const anosComCategoria = new Set<number>(
            existingData?.map((r: { ano: number }) => r.ano) ?? []
        );

        const anosParaInserir = todosAnos.filter((a) => !anosComCategoria.has(a));
        if (anosParaInserir.length === 0) return { success: true };

        // Próximo ID disponível
        const { data: lastItem } = await supabase
            .from("metas")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);
        let nextId = (lastItem?.[0]?.id || 0) + 1;

        const rows = anosParaInserir.flatMap((ano) =>
            Array.from({ length: 12 }, (_, i) => ({
                id: nextId++,
                ano,
                categoria: cat,
                mes: i + 1,
                valor_meta: 0,
            }))
        );

        const { error } = await supabase.from("metas").insert(rows);
        if (error) return { error: `Erro ao adicionar categoria: ${error.message}` };

        revalidatePath("/admin/metas");
        return { success: true };
    } catch (err) {
        console.error("addCategoryToAllYears:", err);
        return { error: "Erro interno ao adicionar a categoria." };
    }
}

export async function saveMetas(ano: number, metasData: Record<string, Record<number, number>>) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = getAdminClient();
    if (!supabase) return { error: "Erro de configuração: Service Role não encontrada." };

    try {
        // 1. Buscar o ID máximo atual para evitar colisão na sequência (manual ID assignment)
        const { data: lastItem } = await supabase
            .from("metas")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);

        let nextId = (lastItem?.[0]?.id || 0) + 1;

        // 2. Preparar e limpar dados
        const rows = [];
        const processedCategories = new Set();

        for (const [rawCat, meses] of Object.entries(metasData)) {
            const categoria = rawCat.trim();
            if (!categoria || processedCategories.has(categoria)) continue;
            processedCategories.add(categoria);

            for (let i = 1; i <= 12; i++) {
                rows.push({
                    id: nextId++, // Atribuição manual de ID para resolver metas_pkey violation
                    ano,
                    categoria,
                    mes: i,
                    valor_meta: meses[i] || 0,
                });
            }
        }

        if (rows.length === 0) return { success: true };

        // 3. Deletar e Inserir (abordagem atômica para evitar duplicatas e inconsistências)
        const { error: deleteError } = await supabase
            .from("metas")
            .delete()
            .eq("ano", ano);

        if (deleteError) {
            console.error("Erro ao limpar metas antigas:", deleteError);
            return { error: `Erro ao preparar o salvamento: ${deleteError.message}` };
        }

        const { error: insertError } = await supabase
            .from("metas")
            .insert(rows);

        if (insertError) {
            console.error("Erro ao inserir metas:", insertError);
            return { error: `Erro ao gravar os dados: ${insertError.message}` };
        }

        revalidatePath("/admin/metas");
        revalidatePath("/");
        return { success: true };
    } catch (err) {
        console.error("Erro inesperado em saveMetas:", err);
        return { error: "Erro interno ao salvar as metas. Tente novamente." };
    }
}

// ---- EQUIPE ----
export async function addSalesPerson(formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const nome = (formData.get("nome") as string).trim();
    const cargo = formData.get("cargo") as string;

    if (!nome || !cargo) return { error: "Preencha nome e cargo." };

    const { error } = await supabase.from("sales_people").insert({ nome, cargo });
    if (error) return { error: error.message };

    revalidatePath("/admin/equipe");
    return { success: true };
}

export async function toggleSalesPerson(id: number, currentAtivo: boolean) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    await supabase.from("sales_people").update({ ativo: !currentAtivo }).eq("id", id);

    revalidatePath("/admin/equipe");
    return { success: true };
}

export async function deleteSalesPerson(id: number) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    await supabase.from("sales_people").delete().eq("id", id);

    revalidatePath("/admin/equipe");
    return { success: true };
}
<<<<<<< Updated upstream
=======

// ---- REGRAS DE COMISSÃO ----
export async function addRegraComissao(formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const produto = (formData.get("produto") as string).trim();
    const categoria = formData.get("categoria") as string || "-";
    const perfil = formData.get("perfil") as string || "-";
    const tipo = formData.get("tipo") as string || "-";
    const especificacao = formData.get("especificacao") as string || "-";
    const vigencia = formData.get("vigencia") as string || "-";
    const comissao_percentual = parseFloat(formData.get("comissao_percentual") as string) || 0;

    if (!produto) return { error: "Preencha o produto." };

    const { error } = await supabase.from("regra_comissao").insert({
        produto, categoria, perfil, tipo, especificacao, vigencia, comissao_percentual
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/comissao");
    revalidatePath("/vendas/nova");
    revalidatePath("/vendas/[id]/editar");
    return { success: true };
}

export async function updateRegraComissao(id: number, formData: FormData) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const produto = (formData.get("produto") as string).trim();
    const categoria = formData.get("categoria") as string || "-";
    const perfil = formData.get("perfil") as string || "-";
    const tipo = formData.get("tipo") as string || "-";
    const especificacao = formData.get("especificacao") as string || "-";
    const vigencia = formData.get("vigencia") as string || "-";
    const comissao_percentual = parseFloat(formData.get("comissao_percentual") as string) || 0;

    if (!produto) return { error: "Preencha o produto." };

    const { error } = await supabase.from("regra_comissao").update({
        produto, categoria, perfil, tipo, especificacao, vigencia, comissao_percentual
    }).eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/comissao");
    return { success: true };
}

export async function deleteRegraComissao(id: number) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();
    const { error } = await supabase.from("regra_comissao").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/comissao");
    return { success: true };
}

// ---- METAS EQUIPE ----

/** Carrega todos os dados para a página /admin/metas-equipe */
export async function getMetasEquipePageData(ano: number): Promise<MetasEquipePageData | null> {
    const supabase = getAdminClient();
    if (!supabase) return null;

    const anoAtual = new Date().getFullYear();
    const anosSet = new Set<number>([ano, anoAtual - 1, anoAtual, anoAtual + 1]);

    try {
        const [
            { data: anosData },
            { data: salesPeopleData },
            { data: categoriasData },
            { data: equipeData },
            { data: globaisData },
        ] = await Promise.all([
            supabase.from("metas_equipe").select("ano"),
            supabase.from("sales_people").select("*").eq("ativo", true).order("nome"),
            supabase.from("metas_equipe").select("categoria"),
            supabase.from("metas_equipe").select("categoria, sales_person_id, mes, valor_meta").eq("ano", ano),
            supabase.from("metas").select("categoria, mes, valor_meta").eq("ano", ano).not("mes", "is", null),
        ]);

        anosData?.forEach((r: { ano: number | null }) => {
            if (r.ano != null) anosSet.add(r.ano);
        });
        const anos = Array.from(anosSet).sort((a, b) => b - a);

        const catSet = new Set<string>(CATEGORIAS as unknown as string[]);
        categoriasData?.forEach((m: { categoria: string | null }) => {
            if (m.categoria) catSet.add(m.categoria.trim());
        });
        const categorias = Array.from(catSet);

        const salesPeople = salesPeopleData ?? [];

        // Montar metasEquipe: categoria -> salesPersonId -> mes -> valor
        const metasEquipe: MetasEquipeData = {};
        categorias.forEach((cat) => {
            metasEquipe[cat] = {};
            salesPeople.forEach((sp: { id: number }) => {
                metasEquipe[cat][sp.id] = {};
            });
        });
        equipeData?.forEach((r: { categoria: string; sales_person_id: number; mes: number; valor_meta: number }) => {
            const cat = r.categoria.trim();
            if (!metasEquipe[cat]) metasEquipe[cat] = {};
            if (!metasEquipe[cat][r.sales_person_id]) metasEquipe[cat][r.sales_person_id] = {};
            metasEquipe[cat][r.sales_person_id][r.mes] = Number(r.valor_meta || 0);
        });

        // Montar metasGlobais: categoria -> mes -> valor
        const metasGlobais: MetasByCategory = {};
        categorias.forEach((cat) => { metasGlobais[cat] = {}; });
        globaisData?.forEach((r: { categoria: string; mes: number | null; valor_meta: number }) => {
            if (r.mes == null) return;
            const cat = r.categoria.trim();
            if (!metasGlobais[cat]) metasGlobais[cat] = {};
            metasGlobais[cat][r.mes] = Number(r.valor_meta || 0);
        });

        return { ano, anos, categorias, salesPeople, metasEquipe, metasGlobais };
    } catch (err) {
        console.error("getMetasEquipePageData:", err);
        return null;
    }
}

/** Salva metas individuais de equipe para o ano via upsert */
export async function saveMetasEquipe(
    ano: number,
    data: MetasEquipeData
): Promise<{ success?: boolean; error?: string }> {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = getAdminClient();
    if (!supabase) return { error: "Erro de configuração: Service Role não encontrada." };

    try {
        const rows: { ano: number; mes: number; categoria: string; sales_person_id: number; valor_meta: number }[] = [];

        for (const [cat, byPerson] of Object.entries(data)) {
            for (const [personIdStr, byMes] of Object.entries(byPerson)) {
                const personId = Number(personIdStr);
                for (let mes = 1; mes <= 12; mes++) {
                    rows.push({
                        ano,
                        mes,
                        categoria: cat.trim(),
                        sales_person_id: personId,
                        valor_meta: byMes[mes] || 0,
                    });
                }
            }
        }

        if (rows.length === 0) return { success: true };

        const { error } = await supabase
            .from("metas_equipe")
            .upsert(rows, { onConflict: "ano,mes,categoria,sales_person_id" });

        if (error) return { error: `Erro ao salvar: ${error.message}` };

        revalidatePath("/admin/metas-equipe");
        return { success: true };
    } catch (err) {
        console.error("saveMetasEquipe:", err);
        return { error: "Erro interno ao salvar as metas." };
    }
}

/** Inicializa o ano na metas_equipe (todas as pessoas × categorias × 12 meses = 0) */
export async function initializeEquipeYear(
    ano: number
): Promise<{ success?: boolean; alreadyExists?: boolean; error?: string }> {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = getAdminClient();
    if (!supabase) return { error: "Erro de configuração: Service Role não encontrada." };

    try {
        const { data: existing } = await supabase
            .from("metas_equipe").select("id").eq("ano", ano).limit(1);

        if (existing && existing.length > 0) return { success: true, alreadyExists: true };

        const [{ data: cats }, { data: people }] = await Promise.all([
            supabase.from("metas_equipe").select("categoria"),
            supabase.from("sales_people").select("id").eq("ativo", true),
        ]);

        const catSet = new Set<string>(CATEGORIAS as unknown as string[]);
        cats?.forEach((r: { categoria: string | null }) => {
            if (r.categoria) catSet.add(r.categoria.trim());
        });
        const categorias = Array.from(catSet);
        const salesPeopleIds: number[] = people?.map((p: { id: number }) => p.id) ?? [];

        if (salesPeopleIds.length === 0) return { error: "Nenhuma pessoa ativa na equipe." };

        const rows = categorias.flatMap((cat) =>
            salesPeopleIds.flatMap((pid) =>
                Array.from({ length: 12 }, (_, i) => ({
                    ano,
                    mes: i + 1,
                    categoria: cat,
                    sales_person_id: pid,
                    valor_meta: 0,
                }))
            )
        );

        const { error } = await supabase.from("metas_equipe").insert(rows);
        if (error) return { error: `Erro ao criar ano: ${error.message}` };

        revalidatePath("/admin/metas-equipe");
        return { success: true };
    } catch (err) {
        console.error("initializeEquipeYear:", err);
        return { error: "Erro interno ao criar o ano." };
    }
}

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
