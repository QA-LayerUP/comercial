"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCliente } from "@/lib/actions/clientes";
import { toast } from "sonner";

export function DeleteClienteButton({ clienteId }: { clienteId: number }) {
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
        const result = await deleteCliente(clienteId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Cliente excluído com sucesso.");
            router.push("/clientes");
        }
    }

    return (
        <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
        </Button>
    );
}
