"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./auth";

// Admin client with service_role to manage users via Admin API
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

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
export async function saveMetas(ano: number, metasData: Record<string, Record<number, number>>) {
    const admin = await isAdmin();
    if (!admin) return { error: "Acesso restrito." };

    const supabase = await createServerClient();

    for (const [categoria, meses] of Object.entries(metasData)) {
        for (const [mes, valor] of Object.entries(meses)) {
            await supabase.from("metas").upsert(
                {
                    ano,
                    categoria,
                    mes: parseInt(mes),
                    valor_meta: valor,
                },
                { onConflict: "ano,categoria,mes" }
            );
        }
    }

    revalidatePath("/admin/metas");
    revalidatePath("/");
    return { success: true };
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
