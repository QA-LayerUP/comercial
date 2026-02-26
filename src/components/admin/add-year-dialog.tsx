"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { initializeYear } from "@/lib/actions/admin";
import { toast } from "sonner";

export function AddYearDialog() {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleAdd() {
        const y = parseInt(year, 10);
        if (Number.isNaN(y) || y < 2000 || y > 2100) {
            toast.error("Ano inválido. Use um valor entre 2000 e 2100.");
            return;
        }

        setLoading(true);
        const result = await initializeYear(y);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
            return;
        }

        if (result.alreadyExists) {
            toast.info(`O ano ${y} já existe. Abrindo planejamento...`);
        } else {
            toast.success(`Ano ${y} criado com todas as categorias!`);
        }

        setOpen(false);
        router.push(`/admin/metas?ano=${y}`);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border-dashed border-2 hover:bg-[#F5F6FA]"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Ano
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Ano de Planejamento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ano</label>
                        <Input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !loading && handleAdd()}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Todas as categorias existentes serão criadas com meta zero para o novo ano.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleAdd}
                        disabled={loading}
                        className="bg-[#E91E8C] hover:bg-[#D4177F] text-white"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Criar Planejamento"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
