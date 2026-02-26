"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClienteForm } from "./cliente-form";
import { useState } from "react";

interface CreateClientDialogProps {
    onSuccess: (data: { id: number; nome: string }) => void;
    trigger?: React.ReactNode;
}

export function CreateClientDialog({ onSuccess, trigger }: CreateClientDialogProps) {
    const [open, setOpen] = useState(false);

    const handleSuccess = (data?: { id: number; nome: string }) => {
        if (data) {
            onSuccess(data);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl h-full max-h-[90vh] p-0 border-0 bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <DialogHeader className="p-8 border-b bg-[#F8F9FA] shrink-0">
                    <DialogTitle className="text-xl font-bold">Cadastrar Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    <ClienteForm onSuccess={handleSuccess} hideHeader />
                </div>
            </DialogContent>
        </Dialog>
    );
}
