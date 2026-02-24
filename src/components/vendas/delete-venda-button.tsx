"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteVenda } from "@/lib/actions/vendas";
import { toast } from "sonner";

export function DeleteVendaButton({ vendaId }: { vendaId: number }) {
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Tem certeza que deseja excluir esta venda?")) return;
        const result = await deleteVenda(vendaId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Venda excluída com sucesso.");
            router.push("/vendas");
        }
    }

    return (
        <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
        </Button>
    );
}
