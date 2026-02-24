"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createCliente, updateCliente } from "@/lib/actions/clientes";
import { toast } from "sonner";
import type { Cliente } from "@/lib/types/database";

export function ClienteForm({ cliente }: { cliente?: Cliente | null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEdit = !!cliente;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = isEdit ? await updateCliente(cliente!.id, formData) : await createCliente(formData);
        setLoading(false);
        if (result.error) { toast.error(result.error); }
        else { toast.success(isEdit ? "Cliente atualizado!" : "Cliente cadastrado!"); router.push(isEdit ? `/clientes/${cliente!.id}` : "/clientes"); }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" type="button" asChild><Link href={isEdit ? `/clientes/${cliente!.id}` : "/clientes"}><ArrowLeft className="w-4 h-4" /></Link></Button>
                <h1 className="text-2xl font-bold">{isEdit ? "Editar Cliente" : "Novo Cliente"}</h1>
            </div>

            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Identificação</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome *</Label><Input name="nome" defaultValue={cliente?.nome || ""} required /></div>
                    <div><Label>CNPJ/CPF</Label><Input name="cnpj_cpf" defaultValue={cliente?.cnpj_cpf || ""} /></div>
                    <div><Label>Confidencialidade</Label><Input name="confidencialidade" defaultValue={cliente?.confidencialidade || ""} /></div>
                    <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" name="contrato_ativo" id="contrato_ativo" defaultChecked={cliente?.contrato_ativo} className="rounded" />
                        <Label htmlFor="contrato_ativo">Contrato Ativo</Label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Nome do Contato</Label><Input name="contato_nome" defaultValue={cliente?.contato_nome || ""} /></div>
                    <div><Label>Email</Label><Input name="contato_email" type="email" defaultValue={cliente?.contato_email || ""} /></div>
                    <div><Label>Telefone</Label><Input name="contato_telefone" defaultValue={cliente?.contato_telefone || ""} /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Datas e Links</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Data 1º Contrato</Label><Input name="data_primeiro_contrato" type="date" defaultValue={cliente?.data_primeiro_contrato || ""} /></div>
                    <div><Label>Data Renovação</Label><Input name="data_renovacao" type="date" defaultValue={cliente?.data_renovacao || ""} /></div>
                    <div><Label>Link Contrato</Label><Input name="link_contrato" defaultValue={cliente?.link_contrato || ""} /></div>
                    <div><Label>Link Proposta</Label><Input name="link_proposta" defaultValue={cliente?.link_proposta || ""} /></div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <Label>Observações</Label>
                    <textarea name="observacoes" defaultValue={cliente?.observacoes || ""} rows={3} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="min-w-32">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                </Button>
            </div>
        </form>
    );
}
