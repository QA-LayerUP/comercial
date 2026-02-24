import { createClient } from "@supabase/supabase-js";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { UsuariosManager } from "@/components/admin/usuarios-manager";

export default async function UsuariosPage() {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    // Usar service_role para bypass de RLS e garantir lista completa
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: users } = await adminClient
        .from("profiles")
        .select("*")
        .order("nome");

    return <UsuariosManager users={(users || []) as any} />;
}
