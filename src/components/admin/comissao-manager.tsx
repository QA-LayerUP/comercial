"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
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
import {
    Plus,
    Loader2,
    Trash2,
    Pencil,
    Search,
    X,
    Percent,
    ShieldCheck,
    Layers,
    Tag,
} from "lucide-react";
import { addRegraComissao, updateRegraComissao, deleteRegraComissao } from "@/lib/actions/admin";
import { toast } from "sonner";

interface Regra {
    id: number;
    produto: string;
    categoria: string;
    perfil: string;
    tipo: string;
    especificacao: string;
    vigencia: string;
    comissao_percentual: number;
}

interface ComissaoManagerProps {
    regras: Regra[];
}

const TIPO_COLORS: Record<string, string> = {
    "Fee Mensal": "bg-[#E91E8C]/10 text-[#E91E8C]",
    "Projeto": "bg-[#3A86FF]/10 text-[#3A86FF]",
    "Recorrente": "bg-[#00C896]/10 text-[#00C896]",
    "Avulso": "bg-[#FFC857]/20 text-[#B8882A]",
};

function tipoColor(tipo: string) {
    return TIPO_COLORS[tipo] ?? "bg-[#94A3B8]/10 text-[#64748B]";
}

const EMPTY: Partial<Regra> = {
    produto: "",
    categoria: "",
    perfil: "",
    tipo: "",
    especificacao: "",
    vigencia: "",
    comissao_percentual: 0,
};

const inputClass =
    "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";

export function ComissaoManager({ regras: initial }: ComissaoManagerProps) {
    const [regras, setRegras] = useState<Regra[]>(initial);
    const [search, setSearch] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Regra>>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Regra | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ---- Derived stats ----
    const totalRegras = regras.length;
    const uniqueProdutos = new Set(regras.map((r) => r.produto)).size;
    const uniqueCategorias = new Set(regras.map((r) => r.categoria)).size;
    const avgComissao =
        regras.length > 0
            ? regras.reduce((s, r) => s + Number(r.comissao_percentual), 0) / regras.length
            : 0;

    // ---- Filtered rows ----
    const filtered = useMemo(() => {
        if (!search.trim()) return regras;
        const q = search.toLowerCase();
        return regras.filter(
            (r) =>
                r.produto.toLowerCase().includes(q) ||
                r.categoria.toLowerCase().includes(q) ||
                r.perfil.toLowerCase().includes(q) ||
                r.tipo.toLowerCase().includes(q) ||
                r.especificacao.toLowerCase().includes(q)
        );
    }, [regras, search]);

    // ---- Open sheet ----
    function openAdd() {
        setEditing(EMPTY);
        setSheetOpen(true);
    }

    function openEdit(r: Regra) {
        setEditing({ ...r });
        setSheetOpen(true);
    }

    // ---- Save (add or update) ----
    async function handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (editing.id) {
            const result = await updateRegraComissao(editing.id, formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Regra atualizada!");
                setRegras((prev) =>
                    prev.map((r) =>
                        r.id === editing.id
                            ? {
                                  ...r,
                                  produto: formData.get("produto") as string,
                                  categoria: (formData.get("categoria") as string) || "-",
                                  perfil: (formData.get("perfil") as string) || "-",
                                  tipo: (formData.get("tipo") as string) || "-",
                                  especificacao: (formData.get("especificacao") as string) || "-",
                                  vigencia: (formData.get("vigencia") as string) || "-",
                                  comissao_percentual:
                                      parseFloat(formData.get("comissao_percentual") as string) || 0,
                              }
                            : r
                    )
                );
                setSheetOpen(false);
            }
        } else {
            const result = await addRegraComissao(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Regra adicionada!");
                // Optimistic: reload via revalidation will update on next nav;
                // for now just close and show a soft reload hint
                setSheetOpen(false);
                window.location.reload();
            }
        }
        setLoading(false);
    }

    // ---- Delete ----
    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteRegraComissao(deleteTarget.id);
        setDeleting(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Regra removida.");
            setRegras((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    }

    return (
        <>
            {/* ---- KPI Cards ---- */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard
                    icon={<ShieldCheck className="w-5 h-5 text-[#E91E8C]" />}
                    bg="bg-[#E91E8C]/10"
                    label="Total de Regras"
                    value={String(totalRegras)}
                />
                <KpiCard
                    icon={<Tag className="w-5 h-5 text-[#3A86FF]" />}
                    bg="bg-[#3A86FF]/10"
                    label="Produtos"
                    value={String(uniqueProdutos)}
                />
                <KpiCard
                    icon={<Layers className="w-5 h-5 text-[#00C896]" />}
                    bg="bg-[#00C896]/10"
                    label="Categorias"
                    value={String(uniqueCategorias)}
                />
                <KpiCard
                    icon={<Percent className="w-5 h-5 text-[#FFC857]" />}
                    bg="bg-[#FFC857]/20"
                    label="Média Comissão"
                    value={`${avgComissao.toFixed(2)}%`}
                />
            </section>

            {/* ---- Toolbar ---- */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Buscar produto, categoria, tipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {filtered.length} de {totalRegras}
                    </span>
                    <Button
                        onClick={openAdd}
                        size="sm"
                        className="bg-[#E91E8C] hover:bg-[#D4177F] text-white h-10 px-4 rounded-xl ml-auto"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Nova Regra
                    </Button>
                </CardContent>
            </Card>

            {/* ---- Table ---- */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] pl-6">
                                    Produto
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Categoria
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Perfil
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Tipo
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Especificação
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Vigência
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] text-right">
                                    Comissão
                                </TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                                        Nenhuma regra encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((r) => (
                                <TableRow
                                    key={r.id}
                                    className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group"
                                >
                                    <TableCell className="pl-6 font-semibold text-sm text-[#1A1A1A]">
                                        {r.produto}
                                    </TableCell>
                                    <TableCell className="text-sm text-[#475569]">{r.categoria}</TableCell>
                                    <TableCell className="text-sm text-[#475569]">{r.perfil}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${tipoColor(r.tipo)}`}
                                        >
                                            {r.tipo}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-[#475569] max-w-[180px] truncate">
                                        {r.especificacao}
                                    </TableCell>
                                    <TableCell className="text-sm text-[#475569]">{r.vigencia}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Badge className="font-mono bg-[#E91E8C]/10 text-[#E91E8C] border-0 hover:bg-[#E91E8C]/10">
                                            {Number(r.comissao_percentual).toFixed(2)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg text-[#64748B] hover:text-[#3A86FF] hover:bg-[#3A86FF]/10"
                                                onClick={() => openEdit(r)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-50"
                                                onClick={() => setDeleteTarget(r)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* ---- Edit / Add Sheet ---- */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-lg font-bold">
                            {editing.id ? "Editar Regra" : "Nova Regra de Comissão"}
                        </SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            {editing.id
                                ? `Editando regra para "${editing.produto}"`
                                : "Preencha os campos para criar uma nova regra."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Produto *
                            </Label>
                            <Input
                                name="produto"
                                defaultValue={editing.produto || ""}
                                required
                                className={inputClass}
                                placeholder="Ex: CRM, ERP..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Categoria
                                </Label>
                                <Input
                                    name="categoria"
                                    defaultValue={editing.categoria === "-" ? "" : (editing.categoria || "")}
                                    className={inputClass}
                                    placeholder="Ex: Software"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Perfil
                                </Label>
                                <Input
                                    name="perfil"
                                    defaultValue={editing.perfil === "-" ? "" : (editing.perfil || "")}
                                    className={inputClass}
                                    placeholder="Ex: Hunter"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Tipo
                                </Label>
                                <Input
                                    name="tipo"
                                    defaultValue={editing.tipo === "-" ? "" : (editing.tipo || "")}
                                    className={inputClass}
                                    placeholder="Ex: Fee Mensal"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Vigência
                                </Label>
                                <Input
                                    name="vigencia"
                                    defaultValue={editing.vigencia === "-" ? "" : (editing.vigencia || "")}
                                    className={inputClass}
                                    placeholder="Ex: 2024"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Especificação
                            </Label>
                            <Input
                                name="especificacao"
                                defaultValue={editing.especificacao === "-" ? "" : (editing.especificacao || "")}
                                className={inputClass}
                                placeholder="Detalhes adicionais..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Comissão (%)
                            </Label>
                            <div className="relative">
                                <Input
                                    name="comissao_percentual"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    defaultValue={editing.comissao_percentual ?? 0}
                                    required
                                    className={`${inputClass} pr-8`}
                                    placeholder="0.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    %
                                </span>
                            </div>
                        </div>

                        <SheetFooter className="pt-4 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1"
                                onClick={() => setSheetOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#E91E8C] hover:bg-[#D4177F] text-white rounded-xl"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : editing.id ? (
                                    "Salvar Alterações"
                                ) : (
                                    "Criar Regra"
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* ---- Delete Confirm ---- */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover regra?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A regra{" "}
                            <strong>
                                {deleteTarget?.produto} — {deleteTarget?.tipo}
                            </strong>{" "}
                            será removida permanentemente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ---- KPI Card ----
function KpiCard({
    icon,
    bg,
    label,
    value,
}: {
    icon: React.ReactNode;
    bg: string;
    label: string;
    value: string;
}) {
    return (
        <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {label}
                    </p>
                    <p className="text-2xl font-bold font-mono text-[#1A1A1A] mt-0.5">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
