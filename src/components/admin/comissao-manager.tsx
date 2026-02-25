"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Edit2, Search, Filter, X, Percent, Box, Layers, UserCircle, Save } from "lucide-react";
import { addRegraComissao, updateRegraComissao, deleteRegraComissao } from "@/lib/actions/admin";
import { toast } from "sonner";
import type { RegraComissao } from "@/lib/types/database";

const inputClass = "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";

export function ComissaoManager({ regras }: { regras: RegraComissao[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<RegraComissao | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RegraComissao | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = useMemo(() => {
        return regras.filter((r) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !r.produto.toLowerCase().includes(q) &&
                    !r.categoria.toLowerCase().includes(q) &&
                    !r.perfil.toLowerCase().includes(q) &&
                    !r.tipo.toLowerCase().includes(q)
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [regras, searchQuery]);

    const hasFilters = searchQuery;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (editingRule) {
            result = await updateRegraComissao(editingRule.id, formData);
        } else {
            result = await addRegraComissao(formData);
        }

        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(editingRule ? "Regra atualizada!" : "Regra criada!");
            (e.target as HTMLFormElement).reset();
            setShowForm(false);
            setEditingRule(null);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteRegraComissao(deleteTarget.id);
        setDeleting(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Regra excluída.");
            setDeleteTarget(null);
        }
    }

    function openEdit(r: RegraComissao) {
        setEditingRule(r);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function closeForm() {
        setShowForm(false);
        setEditingRule(null);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Regras de Comissão</h1>
                    <p className="text-sm text-muted-foreground">Gerencie percentuais e gatilhos de comissão</p>
                </div>
                <Button
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white"
                    size="sm"
                    onClick={() => showForm ? closeForm() : setShowForm(true)}
                >
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? "Fechar" : "Nova Regra"}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total de Regras</p>
                        <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{regras.length}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Produtos Mapeados</p>
                                <p className="text-3xl font-bold mt-1 text-[#00C896]">
                                    {new Set(regras.map(r => r.produto)).size}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <Box className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Maior Comissão</p>
                                <p className="text-3xl font-bold mt-1 font-mono text-[#3A86FF]">
                                    {regras.length > 0 ? Math.max(...regras.map(r => Number(r.comissao_percentual))).toFixed(1) : "0"}%
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#3A86FF]/10 flex items-center justify-center">
                                <Percent className="w-5 h-5 text-[#3A86FF]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Formulario Add/Edit */}
            {showForm && (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1] bg-[#FAFAFA]">
                        <Edit2 className="w-4 h-4 text-[#E91E8C]" />
                        <h3 className="font-semibold text-sm">
                            {editingRule ? "Editar Regra" : "Nova Regra"}
                        </h3>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto *</Label>
                                    <Input name="produto" placeholder="Ex: Layer UP, Layer Tools" required defaultValue={editingRule?.produto} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Perfil (Cargo)</Label>
                                    <Input name="perfil" placeholder="Ex: Vendedor, SDR" defaultValue={editingRule?.perfil === "-" ? "" : editingRule?.perfil} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão (%) *</Label>
                                    <div className="relative">
                                        <Input name="comissao_percentual" type="number" step="0.01" min="0" required defaultValue={editingRule?.comissao_percentual} className={`${inputClass} font-mono`} />
                                        <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
                                    <Input name="categoria" placeholder="Ex: Novo Cliente, Upsell" defaultValue={editingRule?.categoria === "-" ? "" : editingRule?.categoria} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</Label>
                                    <Input name="tipo" placeholder="Ex: Base, Adicional" defaultValue={editingRule?.tipo === "-" ? "" : editingRule?.tipo} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Especificação</Label>
                                    <Input name="especificacao" placeholder="Ex: Prazo, Volume" defaultValue={editingRule?.especificacao === "-" ? "" : editingRule?.especificacao} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vigência</Label>
                                    <Input name="vigencia" placeholder="Ex: 2024" defaultValue={editingRule?.vigencia === "-" ? "" : editingRule?.vigencia} className={inputClass} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F1F1]">
                                <Button type="button" variant="ghost" onClick={closeForm} className="text-muted-foreground">Cancelar</Button>
                                <Button type="submit" disabled={loading} className="bg-[#E91E8C] hover:bg-[#D4177F] text-white">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Regra</>}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filter */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Filter className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Filtros</h3>
                    </div>
                    <div className="flex gap-4 items-end p-6">
                        <div className="space-y-1.5 flex-1 max-w-sm">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Busca</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Produto, categoria, perfil..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`${inputClass} w-full pl-9 rounded-lg`}
                                />
                            </div>
                        </div>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" className="h-10 text-muted-foreground" onClick={() => setSearchQuery("")}>
                                <X className="w-3.5 h-3.5 mr-1" /> Limpar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Lista de Regras</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{filtered.length} regras listadas</span>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Produto</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Categoria</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Perfil</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Detalhes</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Comissão %</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((r) => (
                                <TableRow key={r.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#F5F6FA] flex items-center justify-center text-[#1A1A1A] font-medium text-xs">
                                                <Box className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <span className="font-medium text-sm">{r.produto}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs ${r.categoria !== "-" ? "font-medium bg-[#FAFAFA] border border-[#E0E0E0] px-2 py-0.5 rounded" : "text-muted-foreground"}`}>
                                            {r.categoria}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {r.perfil !== "-" ? (
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <UserCircle className="w-4 h-4 text-[#3A86FF]" />
                                                {r.perfil}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <div className="space-y-0.5">
                                            {r.tipo !== "-" && <p><span className="text-muted-foreground">Tipo:</span> {r.tipo}</p>}
                                            {r.especificacao !== "-" && <p><span className="text-muted-foreground">Espec:</span> {r.especificacao}</p>}
                                            {r.vigencia !== "-" && <p><span className="text-muted-foreground">Validade:</span> {r.vigencia}</p>}
                                            {r.tipo === "-" && r.especificacao === "-" && r.vigencia === "-" && <span className="text-muted-foreground">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded bg-[#E91E8C]/10 text-[#E91E8C] font-mono">
                                            {Number(r.comissao_percentual).toFixed(2)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-[#3A86FF]/10 text-[#3A86FF]"
                                                onClick={() => openEdit(r)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteTarget(r)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-muted-foreground">
                                            {hasFilters ? "Nenhuma regra encontrada para a busca." : "Nenhuma regra cadastrada."}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent className="bg-white rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>Excluir regra de comissão?</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir a regra para <strong>{deleteTarget?.produto}</strong>
                            {deleteTarget?.perfil !== "-" ? ` (${deleteTarget?.perfil})` : ""}?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-lg">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Sim, excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
