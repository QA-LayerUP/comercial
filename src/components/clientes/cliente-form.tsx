"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createCliente, updateCliente } from "@/lib/actions/clientes";
import { toast } from "sonner";
import type { Cliente } from "@/lib/types/database";

<<<<<<< Updated upstream
export function ClienteForm({ cliente }: { cliente?: Cliente | null }) {
=======
const inputClass = "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";

interface ClienteFormProps {
    cliente?: Cliente | null;
    onSuccess?: (data?: { id: number; nome: string }) => void;
    hideHeader?: boolean;
}
export function ClienteForm({ cliente, onSuccess, hideHeader }: ClienteFormProps) {
>>>>>>> Stashed changes
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEdit = !!cliente;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = isEdit ? await updateCliente(cliente!.id, formData) : await createCliente(formData);
        setLoading(false);
<<<<<<< Updated upstream
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
=======
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(isEdit ? "Cliente atualizado!" : "Cliente cadastrado!");
            if (onSuccess) {
                onSuccess((result as any).data);
            } else {
                router.push(isEdit ? `/clientes/${cliente!.id}` : "/clientes");
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" type="button" className="rounded-xl" asChild>
                            <Link href={isEdit ? `/clientes/${cliente!.id}` : "/clientes"}>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{isEdit ? "Editar Cliente" : "Novo Cliente"}</h1>
                            <p className="text-sm text-muted-foreground">{isEdit ? `Editando ${cliente!.nome}` : "Preencha os dados do novo cliente"}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Identificação */}
            <Card className={cn(
                "rounded-2xl border-0 overflow-hidden",
                hideHeader ? "shadow-none bg-[#F8F9FA]" : "shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            )}>
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                    <Building2 className="w-4 h-4 text-[#E91E8C]" />
                    <h3 className="font-semibold text-sm">Identificação</h3>
                </div>
                <CardContent className={cn(
                    "grid gap-4 p-6",
                    hideHeader ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
                )}>
                    <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome *</Label>
                        <Input name="nome" defaultValue={cliente?.nome || ""} required className={inputClass} />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CNPJ/CPF</Label>
                        <Input name="cnpj_cpf" defaultValue={cliente?.cnpj_cpf || ""} className={inputClass} />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidencialidade</Label>
                        <Input name="confidencialidade" defaultValue={cliente?.confidencialidade || ""} className={inputClass} />
                    </div>
                    <div className="flex items-center gap-3 pt-5 md:col-span-1">
                        <input
                            type="checkbox"
                            name="contrato_ativo"
                            id="contrato_ativo"
                            defaultChecked={cliente?.contrato_ativo}
                            className="w-4 h-4 rounded border-[#D0D0D0] text-[#E91E8C] focus:ring-[#FFC857]"
                        />
                        <Label htmlFor="contrato_ativo" className="text-sm font-medium cursor-pointer">Contrato Ativo</Label>
>>>>>>> Stashed changes
                    </div>
                </CardContent>
            </Card>

<<<<<<< Updated upstream
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
=======
            {/* Contato */}
            <Card className={cn(
                "rounded-2xl border-0 overflow-hidden",
                hideHeader ? "shadow-none bg-[#F8F9FA]" : "shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            )}>
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                    <User className="w-4 h-4 text-[#3A86FF]" />
                    <h3 className="font-semibold text-sm">Contato</h3>
                </div>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Contato</Label>
                        <Input name="contato_nome" defaultValue={cliente?.contato_nome || ""} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                        <Input name="contato_email" type="email" defaultValue={cliente?.contato_email || ""} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Telefone</Label>
                        <Input name="contato_telefone" defaultValue={cliente?.contato_telefone || ""} className={inputClass} />
                    </div>
                </CardContent>
            </Card>

            {/* Datas e Links */}
            <Card className={cn(
                "rounded-2xl border-0 overflow-hidden",
                hideHeader ? "shadow-none bg-[#F8F9FA]" : "shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            )}>
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                    <Calendar className="w-4 h-4 text-[#FFC857]" />
                    <h3 className="font-semibold text-sm">Datas e Links</h3>
                </div>
                <CardContent className={cn(
                    "grid gap-4 p-6",
                    hideHeader ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
                )}>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data 1º Contrato</Label>
                        <Input name="data_primeiro_contrato" type="date" defaultValue={cliente?.data_primeiro_contrato || ""} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Renovação</Label>
                        <Input name="data_renovacao" type="date" defaultValue={cliente?.data_renovacao || ""} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Link Contrato</Label>
                        <Input name="link_contrato" defaultValue={cliente?.link_contrato || ""} className={inputClass} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Link Proposta</Label>
                        <Input name="link_proposta" defaultValue={cliente?.link_proposta || ""} className={inputClass} placeholder="https://..." />
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            <Card className={cn(
                "rounded-2xl border-0 overflow-hidden",
                hideHeader ? "shadow-none bg-[#F8F9FA]" : "shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            )}>
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                    <FileText className="w-4 h-4 text-[#00C896]" />
                    <h3 className="font-semibold text-sm">Observações</h3>
                </div>
                <CardContent className="p-6">
                    <textarea
                        name="observacoes"
                        defaultValue={cliente?.observacoes || ""}
                        rows={3}
                        className="w-full rounded-lg bg-[#F5F6FA] border-transparent px-3 py-2.5 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none resize-none"
                        placeholder="Observações adicionais..."
                    />
                </CardContent>
            </Card>

            {/* Footer Save */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {!hideHeader && (
                    <Button type="button" variant="ghost" className="text-muted-foreground" asChild>
                        <Link href={isEdit ? `/clientes/${cliente!.id}` : "/clientes"}>Cancelar</Link>
                    </Button>
                )}
                <Button type="submit" disabled={loading} className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-8 h-11 rounded-xl">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {isEdit ? "Salvar Alterações" : "Cadastrar Cliente"}
                        </>
                    )}
>>>>>>> Stashed changes
                </Button>
            </div>
        </form>
    );
}
