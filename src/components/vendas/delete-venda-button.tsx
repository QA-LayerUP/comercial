"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteVenda } from "@/lib/actions/vendas";
import { toast } from "sonner";

export function DeleteVendaButton({ vendaId }: { vendaId: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleDelete() {
        setLoading(true);
        const result = await deleteVenda(vendaId);
        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Venda excluída com sucesso.");
            setOpen(false);
            router.push("/vendas");
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação não pode ser desfeita. A venda será removida permanentemente do sistema.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading} className="rounded-lg">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
