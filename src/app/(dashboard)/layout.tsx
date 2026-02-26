import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <SidebarProvider>
            <AppSidebar profile={profile as Profile | null} />
            <SidebarInset>
                <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
