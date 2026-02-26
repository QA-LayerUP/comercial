"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Search,
    X,
    Users,
    UserCheck,
    UserX,
    Power,
} from "lucide-react";
import { addSalesPerson, toggleSalesPerson, deleteSalesPerson } from "@/lib/actions/admin";
import { CARGOS } from "@/lib/utils";
import { toast } from "sonner";
import type { SalesPerson } from "@/lib/types/database";

// ---- Cores por cargo ----
const CARGO_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    SDR:                    { bg: "bg-[#E91E8C]/10",  text: "text-[#E91E8C]",  dot: "bg-[#E91E8C]" },
    Vendedor:               { bg: "bg-[#3A86FF]/10",  text: "text-[#3A86FF]",  dot: "bg-[#3A86FF]" },
    Estrategia:             { bg: "bg-[#8B5CF6]/10",  text: "text-[#8B5CF6]",  dot: "bg-[#8B5CF6]" },
    "Gestao de projetos":   { bg: "bg-[#00C896]/10",  text: "text-[#00C896]",  dot: "bg-[#00C896]" },
    "Customer Success":     { bg: "bg-[#FFC857]/20",  text: "text-[#B8882A]",  dot: "bg-[#FFC857]" },
};

function cargoStyle(cargo: string) {
    return CARGO_STYLES[cargo] ?? { bg: "bg-[#94A3B8]/10", text: "text-[#64748B]", dot: "bg-[#94A3B8]" };
}

function getInitials(nome: string) {
    return nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
}

const inputClass =
    "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";

export function EquipeManager({ salesPeople: initial }: { salesPeople: SalesPerson[] }) {
    const [people, setPeople] = useState<SalesPerson[]>(initial);
    const [search, setSearch] = useState("");
    const [cargoFilter, setCargoFilter] = useState<string>("Todos");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SalesPerson | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ---- Stats ----
    const total = people.length;
    const ativos = people.filter((p) => p.ativo).length;
    const inativos = total - ativos;

    // ---- Filtered ----
    const filtered = useMemo(() => {
        return people.filter((p) => {
            const matchSearch =
                !search.trim() || p.nome.toLowerCase().includes(search.toLowerCase());
            const matchCargo = cargoFilter === "Todos" || p.cargo === cargoFilter;
            return matchSearch && matchCargo;
        });
    }, [people, search, cargoFilter]);

    // ---- Add ----
    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setAddLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addSalesPerson(formData);
        setAddLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Profissional adicionado!");
            setSheetOpen(false);
            window.location.reload();
        }
    }

    // ---- Toggle ativo ----
    async function handleToggle(sp: SalesPerson) {
        setTogglingId(sp.id);
        await toggleSalesPerson(sp.id, sp.ativo);
        setPeople((prev) =>
            prev.map((p) => (p.id === sp.id ? { ...p, ativo: !p.ativo } : p))
        );
        setTogglingId(null);
        toast.success(sp.ativo ? "Profissional desativado." : "Profissional ativado.");
    }

    // ---- Delete ----
    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteSalesPerson(deleteTarget.id);
        setDeleting(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Profissional removido.");
            setPeople((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    }

    const filterTabs = ["Todos", ...CARGOS];

    return (
        <>
            {/* ---- KPI Cards ---- */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard
                    icon={<Users className="w-5 h-5 text-[#3A86FF]" />}
                    bg="bg-[#3A86FF]/10"
                    label="Total"
                    value={String(total)}
                />
                <KpiCard
                    icon={<UserCheck className="w-5 h-5 text-[#00C896]" />}
                    bg="bg-[#00C896]/10"
                    label="Ativos"
                    value={String(ativos)}
                />
                <KpiCard
                    icon={<UserX className="w-5 h-5 text-[#94A3B8]" />}
                    bg="bg-[#94A3B8]/10"
                    label="Inativos"
                    value={String(inativos)}
                />
                <KpiCard
                    icon={<Users className="w-5 h-5 text-[#E91E8C]" />}
                    bg="bg-[#E91E8C]/10"
                    label="Cargos"
                    value={String(new Set(people.map((p) => p.cargo)).size)}
                />
            </section>

            {/* ---- Toolbar ---- */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Buscar por nome..."
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

                    {/* Cargo filter tabs */}
                    <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 flex-wrap">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setCargoFilter(tab)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                                    cargoFilter === tab
                                        ? "bg-white text-[#1E293B] shadow-sm"
                                        : "text-[#64748B] hover:text-[#1E293B]"
                                }`}
                            >
                                {tab}
                                {tab !== "Todos" && (
                                    <span className="ml-1.5 text-[10px] opacity-60">
                                        {people.filter((p) => p.cargo === tab).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={() => setSheetOpen(true)}
                        size="sm"
                        className="bg-[#E91E8C] hover:bg-[#D4177F] text-white h-10 px-4 rounded-xl ml-auto"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Adicionar
                    </Button>
                </CardContent>
            </Card>

            {/* ---- Table ---- */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] pl-6 w-[280px]">
                                    Profissional
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Cargo
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                                    Status
                                </TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-16 text-muted-foreground text-sm"
                                    >
                                        Nenhum profissional encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((sp) => {
                                const cs = cargoStyle(sp.cargo);
                                const isToggling = togglingId === sp.id;
                                return (
                                    <TableRow
                                        key={sp.id}
                                        className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors group"
                                    >
                                        {/* Avatar + Nome */}
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${cs.bg} ${cs.text}`}
                                                >
                                                    {getInitials(sp.nome)}
                                                </div>
                                                <span className="font-semibold text-sm text-[#1A1A1A]">
                                                    {sp.nome}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Cargo badge */}
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${cs.bg} ${cs.text}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                                                {sp.cargo}
                                            </span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                                    sp.ativo
                                                        ? "bg-[#00C896]/10 text-[#00C896]"
                                                        : "bg-[#94A3B8]/10 text-[#94A3B8]"
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        sp.ativo ? "bg-[#00C896]" : "bg-[#94A3B8]"
                                                    }`}
                                                />
                                                {sp.ativo ? "Ativo" : "Inativo"}
                                            </span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="pr-4">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-7 w-7 rounded-lg ${
                                                        sp.ativo
                                                            ? "text-[#64748B] hover:text-[#94A3B8] hover:bg-[#94A3B8]/10"
                                                            : "text-[#64748B] hover:text-[#00C896] hover:bg-[#00C896]/10"
                                                    }`}
                                                    onClick={() => handleToggle(sp)}
                                                    disabled={isToggling}
                                                    title={sp.ativo ? "Desativar" : "Ativar"}
                                                >
                                                    {isToggling ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Power className="w-3.5 h-3.5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => setDeleteTarget(sp)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* ---- Add Sheet ---- */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-lg font-bold">Adicionar Profissional</SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Preencha os dados para adicionar um novo membro à equipe.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Nome *
                            </Label>
                            <Input
                                name="nome"
                                required
                                className={inputClass}
                                placeholder="Nome completo"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Cargo *
                            </Label>
                            <select
                                name="cargo"
                                required
                                className="w-full h-10 rounded-lg bg-[#F5F6FA] border-transparent px-3 text-sm focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none appearance-none"
                            >
                                {CARGOS.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <SheetFooter className="pt-4 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1"
                                onClick={() => setSheetOpen(false)}
                                disabled={addLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={addLoading}
                                className="flex-1 bg-[#E91E8C] hover:bg-[#D4177F] text-white rounded-xl"
                            >
                                {addLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Adicionar
                                    </>
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
                        <AlertDialogTitle>Remover profissional?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteTarget?.nome}</strong> será removido permanentemente da
                            equipe. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Remover"
                            )}
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
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}
                >
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
