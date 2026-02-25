"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Trash2, Users2, UserCheck, UserX, Search, Filter, X } from "lucide-react";
import { addSalesPerson, toggleSalesPerson, deleteSalesPerson } from "@/lib/actions/admin";
import { CARGOS } from "@/lib/utils";
import { toast } from "sonner";
import type { SalesPerson } from "@/lib/types/database";

const inputClass = "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";
const selectClass = "h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none";

const CARGO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    "Vendedor": { bg: "bg-[#E91E8C]/10", text: "text-[#E91E8C]", dot: "#E91E8C" },
    "Estrategia": { bg: "bg-[#FFC857]/15", text: "text-[#B8941F]", dot: "#FFC857" },
    "SDR": { bg: "bg-[#3A86FF]/10", text: "text-[#3A86FF]", dot: "#3A86FF" },
    "Customer Success": { bg: "bg-[#00C896]/10", text: "text-[#00C896]", dot: "#00C896" },
    "Gestao de projetos": { bg: "bg-[#8A2BE2]/10", text: "text-[#8A2BE2]", dot: "#8A2BE2" },
};

export function EquipeManager({ salesPeople }: { salesPeople: SalesPerson[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCargo, setFilterCargo] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<SalesPerson | null>(null);
    const [deleting, setDeleting] = useState(false);

    const ativos = salesPeople.filter((sp) => sp.ativo).length;

    // Filtered list
    const filtered = useMemo(() => {
        return salesPeople.filter((sp) => {
            if (searchQuery && !sp.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterCargo && sp.cargo !== filterCargo) return false;
            if (filterStatus === "ativo" && !sp.ativo) return false;
            if (filterStatus === "inativo" && sp.ativo) return false;
            return true;
        });
    }, [salesPeople, searchQuery, filterCargo, filterStatus]);

    const hasFilters = searchQuery || filterCargo || filterStatus;

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addSalesPerson(formData);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else {
            toast.success("Profissional adicionado!");
            (e.target as HTMLFormElement).reset();
            setShowForm(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        await deleteSalesPerson(deleteTarget.id);
        setDeleting(false);
        setDeleteTarget(null);
        toast.success("Profissional excluído.");
    }

    // Group filtered results by cargo
    const grouped = CARGOS.reduce((acc, cargo) => {
        const list = filtered.filter((sp) => sp.cargo === cargo);
        if (list.length > 0) acc.push({ cargo, members: list });
        return acc;
    }, [] as { cargo: string; members: SalesPerson[] }[]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Equipe Comercial</h1>
                    <p className="text-sm text-muted-foreground">Gerencie a equipe de vendas</p>
                </div>
                <Button
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? "Fechar" : "Novo Membro"}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total Equipe</p>
                        <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{salesPeople.length}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ativos</p>
                                <p className="text-3xl font-bold mt-1 text-[#00C896]">{ativos}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inativos</p>
                                <p className="text-3xl font-bold mt-1">{salesPeople.length - ativos}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] flex items-center justify-center">
                                <UserX className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Form */}
            {showForm && (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Plus className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Adicionar Profissional</h3>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome *</Label>
                                <Input name="nome" placeholder="Nome completo" required className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cargo *</Label>
                                <select name="cargo" className={selectClass} required>
                                    {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <Button type="submit" size="sm" disabled={loading} className="bg-[#00C896] hover:bg-[#00B084] text-white h-10">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Adicionar</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Filter className="w-4 h-4 text-[#E91E8C]" />
                        <h3 className="font-semibold text-sm">Filtros</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-end p-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Buscar por nome..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`${selectClass} w-full pl-9`}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cargo</label>
                            <select value={filterCargo} onChange={(e) => setFilterCargo(e.target.value)} className={selectClass}>
                                <option value="">Todos os cargos</option>
                                {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                                <option value="">Todos</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 text-muted-foreground"
                                onClick={() => { setSearchQuery(""); setFilterCargo(""); setFilterStatus(""); }}
                            >
                                <X className="w-3.5 h-3.5 mr-1" /> Limpar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Grouped Members */}
            {grouped.length > 0 ? (
                grouped.map(({ cargo, members }) => {
                    const colors = CARGO_COLORS[cargo] || CARGO_COLORS["Vendedor"];
                    return (
                        <Card key={cargo} className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                                    <h3 className="font-semibold text-sm">{cargo}</h3>
                                </div>
                                <span className="text-xs text-muted-foreground">{members.length} membro{members.length !== 1 ? "s" : ""}</span>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Nome</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Status</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((sp) => (
                                        <TableRow key={sp.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                                        style={{ backgroundColor: colors.dot + "CC" }}
                                                    >
                                                        {sp.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-sm">{sp.nome}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sp.ativo ? (
                                                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00C896]/12 text-[#00C896]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C896] mr-1.5" />
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-muted-foreground">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#D0D0D0] mr-1.5" />
                                                        Inativo
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`rounded-lg text-xs h-8 ${sp.ativo ? "hover:bg-red-50 text-red-500" : "hover:bg-[#00C896]/10 text-[#00C896]"}`}
                                                        onClick={async () => {
                                                            await toggleSalesPerson(sp.id, sp.ativo);
                                                            toast.success("Status atualizado.");
                                                        }}
                                                    >
                                                        {sp.ativo ? <><UserX className="w-3.5 h-3.5 mr-1" /> Desativar</> : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Ativar</>}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setDeleteTarget(sp)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    );
                })
            ) : (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="py-12 text-center">
                        <Users2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                            {hasFilters ? "Nenhum membro encontrado com os filtros selecionados" : "Nenhum profissional cadastrado"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Delete AlertDialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent className="bg-white rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting} className="rounded-lg">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
