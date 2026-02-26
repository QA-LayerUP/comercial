import { redirect } from "next/navigation";
import { getProfile } from "@/lib/actions/auth";
import { recalcularComissoes } from "@/lib/actions/vendas";
import { RecalcularClient } from "./recalcular-client";

export default async function RecalcularComissoesPage() {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const preview = await recalcularComissoes(true);

    return <RecalcularClient preview={preview} />;
}
